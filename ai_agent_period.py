from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
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
from collections import Counter, defaultdict
import PeriodTracker as PeriodTracker

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
    data: Optional[Dict[str, Any]] = None

# Enhanced Period Analytics Class
class PeriodAnalytics:
    @staticmethod
    def analyze_symptoms(periods: List[Dict]) -> Dict[str, Any]:
        """Analyze symptom patterns across periods"""
        all_symptoms = []
        symptom_by_intensity = defaultdict(list)
        
        for period in periods:
            try:
                symptoms = json.loads(period.get('symptoms', '[]'))
                flow_intensity = period.get('flow_intensity', 'medium')
                all_symptoms.extend(symptoms)
                symptom_by_intensity[flow_intensity].extend(symptoms)
            except:
                continue
        
        symptom_counter = Counter(all_symptoms)
        most_common = symptom_counter.most_common(5)
        
        return {
            "total_symptoms_recorded": len(all_symptoms),
            "unique_symptoms": len(symptom_counter),
            "most_common_symptoms": [{"symptom": s, "frequency": f} for s, f in most_common],
            "symptoms_by_flow_intensity": {
                intensity: Counter(symptoms).most_common(3)
                for intensity, symptoms in symptom_by_intensity.items()
            }
        }
    
    @staticmethod
    def calculate_cycle_statistics(periods: List[Dict]) -> Dict[str, Any]:
        """Calculate comprehensive cycle statistics"""
        if len(periods) < 2:
            return {"error": "Need at least 2 periods for cycle analysis"}
        
        sorted_periods = sorted(periods, key=lambda x: x['start_date'])
        cycles = []
        
        for i in range(1, len(sorted_periods)):
            current_start = datetime.fromisoformat(sorted_periods[i]['start_date'])
            previous_start = datetime.fromisoformat(sorted_periods[i-1]['start_date'])
            cycle_length = (current_start - previous_start).days
            cycles.append(cycle_length)
        
        if not cycles:
            return {"error": "Unable to calculate cycles"}
        
        avg_cycle = sum(cycles) / len(cycles)
        min_cycle = min(cycles)
        max_cycle = max(cycles)
        
        # Cycle regularity assessment
        variance = sum((c - avg_cycle) ** 2 for c in cycles) / len(cycles)
        std_dev = variance ** 0.5
        
        regularity = "regular" if std_dev <= 3 else "irregular" if std_dev <= 7 else "very irregular"
        
        return {
            "average_cycle_length": round(avg_cycle, 1),
            "shortest_cycle": min_cycle,
            "longest_cycle": max_cycle,
            "cycle_count": len(cycles),
            "standard_deviation": round(std_dev, 1),
            "regularity": regularity,
            "cycles_data": cycles
        }
    
    @staticmethod
    def analyze_flow_patterns(periods: List[Dict]) -> Dict[str, Any]:
        """Analyze menstrual flow patterns"""
        flow_counter = Counter()
        duration_data = []
        
        for period in periods:
            flow_intensity = period.get('flow_intensity', 'medium')
            flow_counter[flow_intensity] += 1
            
            if period.get('end_date'):
                start = datetime.fromisoformat(period['start_date'])
                end = datetime.fromisoformat(period['end_date'])
                duration = (end - start).days + 1
                duration_data.append(duration)
        
        avg_duration = sum(duration_data) / len(duration_data) if duration_data else None
        
        return {
            "flow_distribution": dict(flow_counter),
            "most_common_flow": flow_counter.most_common(1)[0] if flow_counter else None,
            "average_duration_days": round(avg_duration, 1) if avg_duration else None,
            "duration_range": {
                "min": min(duration_data) if duration_data else None,
                "max": max(duration_data) if duration_data else None
            }
        }

# Enhanced Query Processor
class PeriodQueryProcessor:
    def __init__(self, tracker: PeriodTracker):
        self.tracker = tracker
        
        # Query patterns and their handlers
        self.query_patterns = {
            r'(average|avg|mean)\s*(cycle|length)': self._handle_average_cycle,
            r'symptoms?': self._handle_symptoms,
            r'(predict|next|when)\s*(period|menstruation)': self._handle_prediction,
            r'(history|past|previous)\s*(periods?|cycles?)': self._handle_history,
            r'(flow|intensity|heavy|light|medium)': self._handle_flow_analysis,
            r'(analysis|overview|summary|report)': self._handle_comprehensive,
            r'(regular|irregular|consistency)': self._handle_regularity,
            r'(duration|length|how\s*long)': self._handle_duration,
            r'(pregnancy|pregnant|conception)': self._handle_pregnancy_info,
            r'(statistics|stats|numbers)': self._handle_statistics
        }
    
    def process_query(self, query: str) -> Dict[str, Any]:
        """Process natural language query and return appropriate response"""
        query_lower = query.lower()
        
        # Check for multiple query types
        matched_handlers = []
        for pattern, handler in self.query_patterns.items():
            if re.search(pattern, query_lower):
                matched_handlers.append(handler)
        
        if not matched_handlers:
            return self._handle_general_help()
        
        # If multiple matches, prioritize comprehensive analysis
        if len(matched_handlers) > 2:
            return self._handle_comprehensive()
        
        # Execute the first matched handler
        try:
            return matched_handlers[0]()
        except Exception as e:
            return {
                "success": False,
                "message": f"Error processing query: {str(e)}",
                "data": None
            }
    
    def _handle_average_cycle(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        cycle_stats = analysis.get("cycle_analysis", {})
        return {
            "success": True,
            "message": f"Your average cycle length is {cycle_stats.get('average_cycle_length', 'unknown')} days. "
                      f"Your cycles are {cycle_stats.get('regularity', 'unknown')} with a range of "
                      f"{cycle_stats.get('shortest_cycle', 'N/A')}-{cycle_stats.get('longest_cycle', 'N/A')} days.",
            "data": {"cycle_statistics": cycle_stats}
        }
    
    def _handle_symptoms(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        symptom_data = analysis.get("symptom_analysis", {})
        most_common = symptom_data.get("most_common_symptoms", [])
        
        if not most_common:
            message = "No symptoms have been recorded yet."
        else:
            symptoms_text = ", ".join([f"{s['symptom']} ({s['frequency']} times)" for s in most_common[:3]])
            message = f"Your most common symptoms are: {symptoms_text}. "
            message += f"You've recorded {symptom_data.get('total_symptoms_recorded', 0)} symptoms across all periods."
        
        return {
            "success": True,
            "message": message,
            "data": {"symptom_analysis": symptom_data}
        }
    
    def _handle_prediction(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        prediction = analysis.get("prediction")
        if not prediction:
            return {"success": False, "message": "Unable to predict next period - need more data"}
        
        days_until = prediction["days_until"]
        next_date = prediction["next_period_date"]
        
        if days_until > 0:
            message = f"Your next period is predicted to start on {next_date} (in {days_until} days)."
        elif days_until == 0:
            message = f"Your period is predicted to start today ({next_date})."
        else:
            message = f"Your period was predicted to start on {next_date} ({abs(days_until)} days ago). Consider updating your records."
        
        return {
            "success": True,
            "message": message,
            "data": {"prediction": prediction}
        }
    
    def _handle_flow_analysis(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        flow_data = analysis.get("flow_analysis", {})
        distribution = flow_data.get("flow_distribution", {})
        most_common = flow_data.get("most_common_flow")
        avg_duration = flow_data.get("average_duration_days")
        
        message = f"Flow analysis: "
        if most_common:
            message += f"Your most common flow intensity is {most_common[0]} ({most_common[1]} times). "
        if avg_duration:
            message += f"Average period duration is {avg_duration} days. "
        
        message += f"Flow distribution: {', '.join([f'{k}: {v}' for k, v in distribution.items()])}"
        
        return {
            "success": True,
            "message": message,
            "data": {"flow_analysis": flow_data}
        }
    
    def _handle_comprehensive(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        # Create comprehensive summary
        total_periods = analysis.get("total_periods", 0)
        cycle_stats = analysis.get("cycle_analysis", {})
        symptom_stats = analysis.get("symptom_analysis", {})
        flow_stats = analysis.get("flow_analysis", {})
        
        message = f"Comprehensive Period Analysis:\n\n"
        message += f"📊 Overall: {total_periods} periods tracked\n"
        
        if cycle_stats and "error" not in cycle_stats:
            message += f"🔄 Cycles: Average {cycle_stats.get('average_cycle_length')} days, {cycle_stats.get('regularity')}\n"
        
        if symptom_stats.get("most_common_symptoms"):
            top_symptom = symptom_stats["most_common_symptoms"][0]
            message += f"🎯 Most common symptom: {top_symptom['symptom']} ({top_symptom['frequency']} times)\n"
        
        if flow_stats.get("most_common_flow"):
            message += f"💧 Typical flow: {flow_stats['most_common_flow'][0]}\n"
        
        if analysis.get("prediction"):
            pred = analysis["prediction"]
            message += f"🔮 Next period: {pred['next_period_date']} ({pred['days_until']} days)"
        
        return {
            "success": True,
            "message": message,
            "data": analysis
        }
    
    def _handle_pregnancy_info(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        last_periods = self.tracker.get_periods()
        if not last_periods:
            return {"success": False, "message": "No period data available for pregnancy assessment"}
        
        # Get most recent period
        latest_period = max(last_periods, key=lambda x: x['start_date'])
        last_period_date = datetime.fromisoformat(latest_period['start_date'])
        days_since = (datetime.now() - last_period_date).days
        
        cycle_stats = analysis.get("cycle_analysis", {})
        avg_cycle = cycle_stats.get("average_cycle_length", 28)
        
        message = f"Pregnancy-related information:\n\n"
        message += f"Last period: {latest_period['start_date']} ({days_since} days ago)\n"
        message += f"Average cycle: {avg_cycle} days\n"
        
        if days_since > avg_cycle + 7:
            message += f"⚠️ Period is {days_since - avg_cycle} days late based on your average cycle.\n"
            message += "Consider taking a pregnancy test or consulting your healthcare provider."
        elif days_since > avg_cycle:
            message += f"Period is {days_since - avg_cycle} days late. Monitor for a few more days."
        else:
            message += "Period timing appears normal based on your cycle history."
        
        return {
            "success": True,
            "message": message,
            "data": {
                "last_period_date": latest_period['start_date'],
                "days_since_last_period": days_since,
                "average_cycle_length": avg_cycle,
                "is_late": days_since > avg_cycle
            }
        }
    
    def _handle_history(self) -> Dict[str, Any]:
        periods = self.tracker.get_periods()
        if not periods:
            return {"success": False, "message": "No period history found"}
        
        recent_periods = sorted(periods, key=lambda x: x['start_date'], reverse=True)[:5]
        
        message = f"Recent period history ({len(periods)} total periods):\n\n"
        for i, period in enumerate(recent_periods, 1):
            start_date = period['start_date']
            flow = period.get('flow_intensity', 'unknown')
            symptoms = json.loads(period.get('symptoms', '[]'))
            symptom_text = f" (symptoms: {', '.join(symptoms)})" if symptoms else ""
            message += f"{i}. {start_date} - {flow} flow{symptom_text}\n"
        
        return {
            "success": True,
            "message": message,
            "data": {"recent_periods": recent_periods, "total_count": len(periods)}
        }
    
    def _handle_regularity(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        cycle_stats = analysis.get("cycle_analysis", {})
        regularity = cycle_stats.get("regularity", "unknown")
        std_dev = cycle_stats.get("standard_deviation", 0)
        
        message = f"Cycle regularity: Your cycles are {regularity}. "
        if regularity == "regular":
            message += "Your cycles are consistent with low variation."
        elif regularity == "irregular":
            message += f"Your cycles vary by about ±{std_dev:.1f} days."
        else:
            message += f"Your cycles have high variation (±{std_dev:.1f} days)."
        
        return {
            "success": True,
            "message": message,
            "data": {"regularity_analysis": cycle_stats}
        }
    
    def _handle_duration(self) -> Dict[str, Any]:
        analysis = self.tracker.get_comprehensive_analysis()
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        flow_stats = analysis.get("flow_analysis", {})
        avg_duration = flow_stats.get("average_duration_days")
        duration_range = flow_stats.get("duration_range", {})
        
        if not avg_duration:
            return {"success": False, "message": "Duration data not available - need end dates for periods"}
        
        message = f"Period duration analysis: Average duration is {avg_duration} days. "
        if duration_range.get("min") and duration_range.get("max"):
            message += f"Your periods typically last {duration_range['min']}-{duration_range['max']} days."
        
        return {
            "success": True,
            "message": message,
            "data": {"duration_analysis": flow_stats}
        }
    
    def _handle_statistics(self) -> Dict[str, Any]:
        return self._handle_comprehensive()  # Same as comprehensive analysis
    
    def _handle_general_help(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "I can help you with: cycle length analysis, symptom tracking, period predictions, "
                      "flow patterns, regularity assessment, pregnancy-related questions, and comprehensive reports. "
                      "Try asking about your 'average cycle length', 'symptoms', 'next period', or request a 'full analysis'.",
            "data": None
        }

# Utility functions (keeping existing ones)
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

@app.get("/period/{patient_id}/analysis")
async def get_comprehensive_analysis(patient_id: str):
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, patient_id)
        analysis = tracker.get_comprehensive_analysis()
        
        if "error" in analysis:
            return {"success": False, "message": analysis["error"]}
        
        return {"success": True, "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced period query endpoint
@app.post("/period/query", response_model=PeriodResponse)
async def process_period_query(request: PeriodQueryRequest):
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, request.patient_id)
        processor = PeriodQueryProcessor(tracker)
        
        result = processor.process_query(request.query)
        
        return PeriodResponse(
            success=result["success"],
            message=result["message"],
            data=result["data"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint for AI-powered period insights
@app.post("/period/ai-insights")
async def get_ai_period_insights(request: PeriodQueryRequest):
    """Get AI-powered insights about period data using Ollama"""
    try:
        if not check_ollama_server():
            raise HTTPException(status_code=503, detail="AI service not available")
        
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, request.patient_id)
        analysis = tracker.get_comprehensive_analysis()
        
        if "error" in analysis:
            return PeriodResponse(success=False, message=analysis["error"])
        
        # Create context for AI
        context = f"""
        Patient Period Analysis Data:
        - Total periods tracked: {analysis.get('total_periods', 0)}
        - Cycle statistics: {json.dumps(analysis.get('cycle_analysis', {}), indent=2)}
        - Symptom patterns: {json.dumps(analysis.get('symptom_analysis', {}), indent=2)}
        - Flow patterns: {json.dumps(analysis.get('flow_analysis', {}), indent=2)}
        - Prediction data: {json.dumps(analysis.get('prediction', {}), indent=2)}
        
        User Question: {request.query}
        
        Please provide helpful, accurate medical information based on this period tracking data. 
        Include relevant insights, patterns, and recommendations where appropriate.
        If the question relates to serious medical concerns, advise consulting a healthcare provider.
        """
        
        response = ollama.chat(
            model=LANGUAGE_MODEL,
            messages=[
                {
                    'role': 'system', 
                    'content': 'You are a helpful assistant specializing in menstrual health and period tracking analysis. Provide informative, supportive responses based on the period data provided.'
                },
                {'role': 'user', 'content': context}
            ],
            stream=False,
        )
        
        ai_response = response['message']['content'] if response and 'message' in response else "Could not generate AI response"
        
        return PeriodResponse(
            success=True,
            message=ai_response,
            data={"analysis_data": analysis, "ai_powered": True}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Bulk data import endpoint
@app.post("/period/bulk-import")
async def bulk_import_periods(patient_id: str, periods_data: List[Dict[str, Any]]):
    """Import multiple periods at once"""
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, patient_id)
        imported_count = 0
        errors = []
        
        for i, period_data in enumerate(periods_data):
            try:
                period_id = tracker.add_period(
                    start_date=period_data.get('start_date'),
                    end_date=period_data.get('end_date'),
                    flow_intensity=period_data.get('flow_intensity', 'medium'),
                    symptoms=period_data.get('symptoms', []),
                    description=period_data.get('description')
                )
                
                if period_id:
                    imported_count += 1
                else:
                    errors.append(f"Row {i+1}: Failed to import period")
                    
            except Exception as e:
                errors.append(f"Row {i+1}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully imported {imported_count} out of {len(periods_data)} periods",
            "data": {
                "imported_count": imported_count,
                "total_count": len(periods_data),
                "errors": errors
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Export data endpoint
@app.get("/period/{patient_id}/export")
async def export_period_data(patient_id: str, format: str = "json"):
    """Export period data in different formats"""
    try:
        tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, patient_id)
        periods = tracker.get_periods()
        analysis = tracker.get_comprehensive_analysis()
        
        export_data = {
            "patient_id": patient_id,
            "export_date": datetime.now().isoformat(),
            "periods": periods,
            "analysis": analysis
        }
        
        if format.lower() == "csv":
            # Convert to CSV format (simplified)
            csv_periods = []
            for period in periods:
                csv_periods.append({
                    "start_date": period.get("start_date"),
                    "end_date": period.get("end_date"),
                    "flow_intensity": period.get("flow_intensity"),
                    "symptoms": ", ".join(json.loads(period.get("symptoms", "[]"))),
                    "description": period.get("period_description", "")
                })
            export_data["csv_periods"] = csv_periods
        
        return {
            "success": True,
            "data": export_data,
            "format": format
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
    prompt = (
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
        
    instruction_