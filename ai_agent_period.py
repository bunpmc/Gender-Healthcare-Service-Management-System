from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import ollama
import json
import os
import re
from pymongo import MongoClient
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account
import io
import fitz  # PyMuPDF
import time
import requests
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv
import asyncio
import uvicorn

# Load environment
load_dotenv()

# FastAPI app
app = FastAPI(title="RAG and Period Tracking API", version="1.0.0")

# CORS middleware for Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],  # Add your Angular app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GOOGLE_CREDS = os.getenv('GOOGLE_DRIVE_CREDENTIALS_FILE')
FILE_ID = os.getenv('GOOGLE_DRIVE_FILE_ID')
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB = os.getenv('MONGO_DB', 'angler')
MONGO_COLL = os.getenv('MONGO_COLLECTION', 'Vector')
MODEL = os.getenv('EMBEDDING_MODEL', 'nomic-embed-text')
LANGUAGE_MODEL = os.getenv('LANGUAGE_MODEL', 'mistral')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
OLLAMA_HOST = os.getenv('OLLAMA_HOST', '127.0.0.1:11434')

# Global state
DOCUMENT_READY = False
os.environ['OLLAMA_HOST'] = OLLAMA_HOST

# Global state
DOCUMENT_READY = False
os.environ['OLLAMA_HOST'] = OLLAMA_HOST

# Pydantic models
class SearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = "default"
    limit: Optional[int] = 3

class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = "default"

class PeriodRequest(BaseModel):
    start_date: str
    end_date: Optional[str] = None
    flow_intensity: Optional[str] = "medium"
    symptoms: Optional[List[str]] = []
    description: Optional[str] = None
    patient_id: str

class PeriodQueryRequest(BaseModel):
    query: str
    patient_id: str

class DocumentResponse(BaseModel):
    text: str
    similarity: float

class ChatResponse(BaseModel):
    response: str
    context_used: bool

class PeriodResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None

# Utility functions
def check_ollama_server():
    try:
        response = requests.get(f"http://{OLLAMA_HOST}/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False

def download_from_drive(file_id):
    try:
        creds = service_account.Credentials.from_service_account_file(
            GOOGLE_CREDS, scopes=['https://www.googleapis.com/auth/drive']
        )
        service = build('drive', 'v3', credentials=creds)
        
        file_metadata = service.files().get(fileId=file_id).execute()
        mime_type = file_metadata.get('mimeType', '')
        
        if mime_type == 'application/pdf':
            request = service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            return extract_text_from_pdf(fh.getvalue())
        elif 'document' in mime_type or 'text' in mime_type:
            if 'google-apps.document' in mime_type:
                request = service.files().export_media(fileId=file_id, mimeType='text/plain')
            else:
                request = service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while not done:
                _, done = downloader.next_chunk()
            return fh.getvalue().decode('utf-8', errors='ignore')
        return None
    except Exception as e:
        print(f"Error downloading file: {e}")
        return None

def extract_text_from_pdf(pdf_bytes):
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page_num in range(doc.page_count):
            page = doc[page_num]
            text += page.get_text() + "\n\n"
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

def split_text(text, chunk_size=1000, overlap=200):
    if not text:
        return []
    
    text = text.strip()
    text = ' '.join(text.split())
    
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        if end >= len(text):
            chunks.append(text[start:])
            break
        
        break_point = text.rfind('.', start, end)
        if break_point == -1:
            break_point = text.rfind(' ', start, end)
        if break_point == -1:
            break_point = end
        else:
            break_point += 1
        
        chunks.append(text[start:break_point].strip())
        start = break_point - overlap
        if start < 0:
            start = 0
    
    return [chunk for chunk in chunks if chunk.strip()]

def get_embedding(text, max_retries=3):
    try:
        if not text.strip():
            return None
        
        for attempt in range(max_retries):
            try:
                if not check_ollama_server():
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    return None
                
                response = ollama.embeddings(model=MODEL, prompt=text)
                embedding = response.get('embedding') or response.get('embeddings')
                
                if embedding:
                    return embedding
                
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    raise
        return None
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

def store_to_mongo(embeddings_chunks, collection_name=MONGO_COLL):
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        collection = db[collection_name]
        collection.delete_many({})
        
        successful_inserts = 0
        for chunk, vector in embeddings_chunks:
            if vector and chunk.strip():
                collection.insert_one({"text": chunk, "embedding": vector})
                successful_inserts += 1
        
        client.close()
        return successful_inserts
    except Exception as e:
        print(f"Error storing to MongoDB: {e}")
        return 0

def search_mongo(query_embedding, collection_name=MONGO_COLL, limit=3):
    if not query_embedding:
        return []
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        collection = db[collection_name]
        
        pipeline = [
            {
                '$vectorSearch': {
                    'index': 'default',
                    'path': 'embedding',
                    'queryVector': query_embedding,
                    'numCandidates': 50,
                    'limit': limit
                }
            }
        ]
        results = list(collection.aggregate(pipeline))
        client.close()
        return results
    except Exception as e:
        print(f"Error searching MongoDB: {e}")
        return []

def cosine_similarity(a, b):
    try:
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x ** 2 for x in a) ** 0.5
        norm_b = sum(x ** 2 for x in b) ** 0.5
        return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0
    except:
        return 0

async def get_chat_response(query, context_chunks=None):
    try:
        instruction_prompt = (
            "You are a helpful assistant that answers questions based on provided document context. "
            "Use the following context to provide accurate and concise answers. If the answer is not in the context, "
            "state 'The document does not contain this information' and provide a general answer if possible.\n\n"
            "Context:\n"
        )
        
        if context_chunks:
            for i, chunk in enumerate(context_chunks, 1):
                text_preview = chunk['text'][:800] if len(chunk['text']) > 800 else chunk['text']
                instruction_prompt += f"Chunk {i}:\n{text_preview}\n\n"
        else:
            instruction_prompt += "No relevant document chunks found.\n\n"
        
        instruction_prompt += f"User Query: {query}\n\nAnswer:"
        
        if not check_ollama_server():
            return "Ollama server is not available. Please try again later."
        
        response = ollama.chat(
            model=LANGUAGE_MODEL,
            messages=[
                {'role': 'system', 'content': instruction_prompt},
                {'role': 'user', 'content': query},
            ],
            stream=False,
        )
        
        if response and 'message' in response and 'content' in response['message']:
            return response['message']['content'].strip()
        else:
            return "No response generated by the model."
            
    except Exception as e:
        print(f"Chat error: {e}")
        return "Sorry, I couldn't generate a response. Please try again later."

# Period Tracker Class
class PeriodTracker:
    def __init__(self, supabase_url: str, supabase_key: str, patient_id: str):
        self.cycle_length = 28
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.patient_id = patient_id

    def add_period(self, start_date: str, end_date: str = None, flow_intensity: str = "medium", 
                  symptoms: List[str] = None, description: str = None) -> Optional[str]:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
            
            if end and end < start:
                return None

            if flow_intensity not in ["light", "medium", "heavy"]:
                flow_intensity = "medium"

            estimated_next = start + timedelta(days=self.cycle_length)
            cycle_length = self.average_cycle_length() or self.cycle_length
            symptoms_json = json.dumps(symptoms or [])

            response = self.supabase.table("period_tracking").insert({
                "patient_id": self.patient_id,
                "start_date": start.isoformat(),
                "end_date": end.isoformat() if end else None,
                "estimated_next_date": estimated_next.isoformat(),
                "cycle_length": cycle_length,
                "flow_intensity": flow_intensity,
                "symptoms": symptoms_json,
                "period_description": description,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()

            return response.data[0]["period_id"] if response.data else None
        except Exception as e:
            print(f"Error adding period: {e}")
            return None

    def get_periods(self) -> List[Dict]:
        try:
            response = self.supabase.table("period_tracking").select("*").eq("patient_id", self.patient_id).execute()
            return response.data
        except:
            return []

    def average_cycle_length(self) -> Optional[int]:
        periods = self.get_periods()
        if len(periods) < 2:
            return None
        
        periods_sorted = sorted(
            [(datetime.fromisoformat(p["start_date"]), p["cycle_length"]) for p in periods],
            key=lambda x: x[0]
        )
        
        cycles = [(periods_sorted[i][0] - periods_sorted[i-1][0]).days for i in range(1, len(periods_sorted))]
        return sum(cycles) // len(cycles) if cycles else self.cycle_length

    def predict_next_period(self) -> Optional[datetime]:
        periods = self.get_periods()
        if not periods:
            return None
        
        last_period = max([datetime.fromisoformat(p["start_date"]) for p in periods])
        cycle_length = self.average_cycle_length() or self.cycle_length
        return last_period + timedelta(days=cycle_length)

# Initialize document on startup
async def initialize_document():
    global DOCUMENT_READY
    if DOCUMENT_READY:
        return

    print("Initializing document...")
    
    if not all([GOOGLE_CREDS, FILE_ID, MONGO_URI]):
        print("Missing required environment variables")
        return

    text = download_from_drive(FILE_ID)
    if not text:
        print("Failed to download/extract document.")
        return

    chunks = split_text(text)
    embeddings_chunks = []
    
    for chunk in chunks:
        embedding = get_embedding(chunk)
        if embedding:
            embeddings_chunks.append((chunk, embedding))

    stored_count = store_to_mongo(embeddings_chunks)
    DOCUMENT_READY = stored_count > 0
    print(f"Document initialization complete! Stored {stored_count} chunks")

# API Endpoints
@app.on_event("startup")
async def startup_event():
    if check_ollama_server():
        await initialize_document()
    else:
        print("Ollama server not available")

@app.get("/")
async def root():
    return {"message": "RAG and Period Tracking API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "document_ready": DOCUMENT_READY,
        "ollama_server": check_ollama_server(),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/search", response_model=List[DocumentResponse])
async def search_documents(request: SearchRequest):
    if not DOCUMENT_READY:
        raise HTTPException(status_code=503, detail="Document not ready")
    
    query_embedding = get_embedding(request.query)
    if not query_embedding:
        raise HTTPException(status_code=500, detail="Failed to generate query embedding")
    
    results = search_mongo(query_embedding, limit=request.limit)
    similarities = [
        DocumentResponse(
            text=r['text'], 
            similarity=cosine_similarity(query_embedding, r['embedding'])
        )
        for r in results if 'embedding' in r
    ]
    
    similarities.sort(key=lambda x: x.similarity, reverse=True)
    return similarities

@app.post("/chat", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    if not DOCUMENT_READY:
        raise HTTPException(status_code=503, detail="Document not ready")
    
    # Get relevant context
    query_embedding = get_embedding(request.query)
    if query_embedding:
        results = search_mongo(query_embedding, limit=3)
        context_chunks = [
            {"text": r['text'], "similarity": cosine_similarity(query_embedding, r['embedding'])}
            for r in results if 'embedding' in r
        ]
        context_chunks.sort(key=lambda x: x['similarity'], reverse=True)
    else:
        context_chunks = []
    
    # Generate response
    response = await get_chat_response(request.query, context_chunks[:3])
    
    return ChatResponse(
        response=response,
        context_used=len(context_chunks) > 0
    )

@app.post("/period/add", response_model=PeriodResponse)
async def add_period(request: PeriodRequest):
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, request.patient_id)
        period_id = tracker.add_period(
            request.start_date,
            request.end_date,
            request.flow_intensity,
            request.symptoms,
            request.description
        )
        
        if period_id:
            return PeriodResponse(
                success=True,
                message="Period added successfully",
                data={"period_id": period_id}
            )
        else:
            return PeriodResponse(
                success=False,
                message="Failed to add period. Please check the date format (YYYY-MM-DD)"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/period/{patient_id}/history")
async def get_period_history(patient_id: str):
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, patient_id)
        periods = tracker.get_periods()
        return {"success": True, "data": periods}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/period/{patient_id}/predict")
async def predict_next_period(patient_id: str):
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, patient_id)
        next_period = tracker.predict_next_period()
        
        if next_period:
            return {
                "success": True,
                "data": {
                    "predicted_date": next_period.strftime('%Y-%m-%d'),
                    "days_until": (next_period - datetime.now()).days
                }
            }
        else:
            return {"success": False, "message": "No period data available to predict"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/period/{patient_id}/cycle-length")
async def get_average_cycle_length(patient_id: str):
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, patient_id)
        avg_cycle = tracker.average_cycle_length()
        
        if avg_cycle:
            return {"success": True, "data": {"average_cycle_length": avg_cycle}}
        else:
            return {"success": False, "message": "Not enough data to calculate average cycle length"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/period/query", response_model=PeriodResponse)
async def process_period_query(request: PeriodQueryRequest):
    try:
        # Simple query processing based on keywords
        query_lower = request.query.lower()
        
        if "predict" in query_lower or "next" in query_lower:
            tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, request.patient_id)
            next_period = tracker.predict_next_period()
            
            if next_period:
                message = f"Your next period is predicted to start around {next_period.strftime('%Y-%m-%d')}"
            else:
                message = "No period data available to predict"
                
            return PeriodResponse(success=True, message=message)
        
        elif "history" in query_lower or "periods" in query_lower:
            tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, request.patient_id)
            periods = tracker.get_periods()
            
            if periods:
                message = f"Found {len(periods)} period records. Use /period/{request.patient_id}/history for details."
            else:
                message = "No period history found."
                
            return PeriodResponse(success=True, message=message, data={"count": len(periods)})
        
        elif "cycle" in query_lower:
            tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, request.patient_id)
            avg_cycle = tracker.average_cycle_length()
            
            if avg_cycle:
                message = f"Your average cycle length is {avg_cycle} days."
            else:
                message = "Not enough data to calculate average cycle length."
                
            return PeriodResponse(success=True, message=message)
        
        else:
            return PeriodResponse(
                success=False,
                message="I can help with: predicting next period, showing history, or calculating cycle length"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)