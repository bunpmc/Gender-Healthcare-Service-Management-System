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
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import asyncio
import uvicorn
import uuid
import random

# Load environment
load_dotenv()

# FastAPI app
app = FastAPI(title="GenderHealthcare Chatbot API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GOOGLE_CREDS = os.getenv('GOOGLE_DRIVE_CREDENTIALS_FILE')
FILE_ID = os.getenv('GOOGLE_DRIVE_FILE_ID_TECHNICAL')
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB = os.getenv('MONGO_DB', 'angler')
MONGO_COLL = os.getenv('MONGO_COLLECTION', 'Vector')
MODEL = os.getenv('EMBEDDING_MODEL', 'nomic-embed-text')
LANGUAGE_MODEL = os.getenv('LANGUAGE_MODEL', 'mistral')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
OLLAMA_HOST = os.getenv('OLLAMA_HOST', '127.0.0.1:11434')
BASE_PROFILE_URL = "http://localhost:4200/doctor"  # Base URL for doctor profiles

# Global state
DOCUMENT_READY = False
os.environ['OLLAMA_HOST'] = OLLAMA_HOST

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic models
class SearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = "default"
    limit: Optional[int] = 3

class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = "default"

class DoctorRequest(BaseModel):
    name: str
    specialty: str
    bio: str
    contact_email: str
    phone: Optional[str] = None
    office_address: Optional[str] = None
    availability: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None

class DoctorSearchRequest(BaseModel):
    query: str
    speciality: Optional[str] = None
    location: Optional[str] = None

class DocumentResponse(BaseModel):
    text: str
    similarity: float

class ChatResponse(BaseModel):
    response: str
    context_used: bool
    doctor_recommendations: Optional[List[Dict[str, Any]]] = None

class DoctorResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

# Doctor Management Class
class DoctorManager:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.table_name = "doctor_details"
    
    def add_doctor(self, name: str, specialty: str, bio: str, contact_email: str,
                   phone: str = None, office_address: str = None, 
                   availability: Dict = None, image_url: str = None) -> str:
        try:
            doctor_data = {
                "doctor_id": str(uuid.uuid4()),
                "department": specialty.lower().replace(" ", "_"),
                "speciality": specialty,
                "about_me": json.dumps({"description": bio, "experience": bio}),
                "license_no": f"LIC{random.randint(1000, 9999)}",
                "bio": bio,
                "slogan": "Providing expert care",
                "educations": json.dumps({"degrees": []}),
                "certifications": json.dumps({"certifications": []})
            }
            
            # Insert into staff_members to satisfy foreign key
            staff_data = {
                "staff_id": doctor_data["doctor_id"],
                "full_name": name,
                "working_email": contact_email,
                "role": "doctor",
                "years_experience": "0",
                "hired_at": datetime.now().isoformat(),
                "is_available": True,
                "staff_status": "active",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "image_link": image_url or None,
                "gender": None,
                "languages": json.dumps(["English"])
            }
            self.supabase.table("staff_members").insert(staff_data).execute()
            
            result = self.supabase.table(self.table_name).insert(doctor_data).execute()
            
            if result.data:
                return result.data[0]['doctor_id']
            return None
            
        except Exception as e:
            print(f"Error adding doctor: {e}")
            return None
    
    def get_doctor_by_id(self, doctor_id: str) -> Dict[str, Any]:
        try:
            doctor_result = self.supabase.table(self.table_name).select("*").eq("doctor_id", doctor_id).execute()
            
            if not doctor_result.data:
                return None
            
            doctor = doctor_result.data[0]
            
            staff_result = self.supabase.table("staff_members").select("full_name, working_email").eq("staff_id", doctor_id).execute()
            name = staff_result.data[0]["full_name"] if staff_result.data else "Unknown"
            contact_email = staff_result.data[0]["working_email"] if staff_result.data else f"contact_{doctor_id}@example.com"
            
            doctor_mapped = {
                "id": doctor["doctor_id"],
                "name": name,
                "specialty": doctor["speciality"],
                "bio": doctor["bio"],
                "contact_email": contact_email,
                "phone": None,
                "office_address": None,
                "availability": None,
                "image_url": None,
                "created_at": doctor.get("created_at", datetime.now().isoformat()),
                "profile_link": f"{BASE_PROFILE_URL}/{doctor['doctor_id']}"
            }
            return doctor_mapped
            
        except Exception as e:
            print(f"Error getting doctor: {e}")
            return None
    
    def search_doctors(self, specialty: str = None, location: str = None, 
                      name_query: str = None) -> List[Dict[str, Any]]:
        try:
            query = self.supabase.table(self.table_name).select("*")
            
            if specialty:
                query = query.eq("speciality", specialty)
            
            result = query.execute()
            
            doctors = []
            for doctor in result.data:
                staff_result = self.supabase.table("staff_members").select("full_name, working_email").eq("staff_id", doctor["doctor_id"]).execute()
                name = staff_result.data[0]["full_name"] if staff_result.data else "Unknown"
                contact_email = staff_result.data[0]["working_email"] if staff_result.data else f"contact_{doctor['doctor_id']}@example.com"
                
                doctor_mapped = {
                    "id": doctor["doctor_id"],
                    "name": name,
                    "specialty": doctor["speciality"],
                    "bio": doctor["bio"],
                    "contact_email": contact_email,
                    "phone": None,
                    "office_address": None,
                    "availability": None,
                    "image_url": None,
                    "created_at": doctor.get("created_at", datetime.now().isoformat()),
                    "profile_link": f"{BASE_PROFILE_URL}/{doctor['doctor_id']}"
                }
                doctors.append(doctor_mapped)
            
            return doctors
            
        except Exception as e:
            print(f"Error searching doctors: {e}")
            return []
    
    def get_all_specialties(self) -> List[str]:
        try:
            result = self.supabase.table(self.table_name).select("speciality").execute()
            specialties = list(set([doc['speciality'] for doc in result.data]))
            return sorted(specialties)
            
        except Exception as e:
            print(f"Error getting specialties: {e}")
            return []

# Query Processor
class HealthcareQueryProcessor:
    def __init__(self, doctor_manager: DoctorManager):
        self.doctor_manager = doctor_manager
        self.query_patterns = {
            r'(doctor|physician|specialist|gynecologist|obgyn)': self._handle_doctor_request,
            r'(appointment|booking|schedule|consult)': self._handle_appointment_request,
            r'(emergency|urgent|help|crisis)': self._handle_emergency,
        }
    
    def process_query(self, query: str) -> Dict[str, Any]:
        query_lower = query.lower()
        print(f"Processing query: {query_lower}")
        
        for pattern, handler in self.query_patterns.items():
            if re.search(pattern, query_lower):
                try:
                    return handler(query)
                except Exception as e:
                    print(f"Error in handler for pattern {pattern}: {e}")
                    return {
                        "success": False,
                        "message": f"Error processing query: {str(e)}",
                        "data": None
                    }
        
        return self._handle_general_help()
    
    def _handle_doctor_request(self, query: str = "") -> Dict[str, Any]:
        query_lower = query.lower()
        print(f"Handling doctor request: {query_lower}")
        
        specialty_keywords = {
            'gynecologist': 'gynecologist',
            'obgyn': 'gynecologist',
            'endocrinologist': 'endocrinologist',
            'urologist': 'urologist',
            'reproductive specialist': 'reproductive_specialist',
            'sexual health specialist': 'sexual_health_specialist'
        }
        
        specialty = None
        for keyword, spec in specialty_keywords.items():
            if keyword in query_lower:
                specialty = spec
                break
        
        if not specialty and any(word in query_lower for word in ['hormone', 'gender']):
            specialty = 'endocrinologist'
        
        print(f"Searching for specialty: {specialty}")
        doctors = self.doctor_manager.search_doctors(specialty=specialty)
        
        if not doctors:
            print("No doctors found")
            return {
                "success": True,
                "message": f"No doctors found for {specialty or 'your request'}. Please contact our support team for assistance.",
                "data": {"doctors": [], "specialty_searched": specialty}
            }
        
        doctor_info = []
        for doc in doctors[:3]:
            info = {
                "name": doc['name'],
                "specialty": doc['specialty'],
                "bio": doc['bio'][:200] + "..." if len(doc['bio']) > 200 else doc['bio'],
                "contact_email": doc['contact_email'],
                "phone": doc.get('phone'),
                "office_address": doc.get('office_address'),
                "doctor_id": doc['id'],
                "profile_link": doc['profile_link']
            }
            doctor_info.append(info)
        
        message = f"Found {len(doctors)} doctor(s)"
        if specialty:
            message += f" specializing in {specialty}"
        message += ". Here are the top recommendations:\n\n"
        
        for i, doc in enumerate(doctor_info, 1):
            message += f"{i}. Dr. {doc['name']} - {doc['specialty']}\n"
            message += f"   Email: {doc['contact_email']}\n"
            if doc['phone']:
                message += f"   Phone: {doc['phone']}\n"
            if doc['office_address']:
                message += f"   Address: {doc['office_address']}\n"
            message += f"   Bio: {doc['bio']}\n"
            message += f"   Profile: {doc['profile_link']}\n\n"
        
        return {
            "success": True,
            "message": message,
            "data": {"doctors": doctor_info, "specialty_searched": specialty}
        }
    
    def _handle_appointment_request(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "To book an appointment, please contact one of our recommended doctors directly using their contact information, or call our main office. Would you like me to show you our available doctors?",
            "data": {"action_required": "contact_doctor"}
        }
    
    def _handle_emergency(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "If this is a medical emergency, please call emergency services (911) immediately or go to your nearest emergency room. For urgent but non-emergency concerns, contact your healthcare provider or our on-call service.",
            "data": {"emergency_contacts": {
                "emergency": "911",
                "nurse_hotline": "1-800-NURSE-HELP"
            }}
        }
    
    def _handle_general_help(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "I can help you with:\n\n"
                      "Doctor Services: Find specialists, get contact information\n"
                      "Support: General healthcare questions and guidance\n\n"
                      "Try asking: 'Find me a gynecologist' or 'I need a specialist'",
            "data": None
        }

# Utility functions
def check_ollama_server():
    try:
        response = requests.get(f"http://{OLLAMA_HOST}/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False

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

async def get_enhanced_chat_response(query, context_chunks=None, doctor_manager=None):
    try:
        instruction_prompt = (
            "You are a helpful healthcare assistant for a gender healthcare website. "
            "Provide accurate, supportive, and informative responses about health topics. "
            "When appropriate, recommend consulting with healthcare professionals. "
            "Use the following context to provide accurate answers.\n\n"
        )
        
        if context_chunks:
            instruction_prompt += "Context:\n"
            for i, chunk in enumerate(context_chunks, 1):
                text_preview = chunk['text'][:800] if len(chunk['text']) > 800 else chunk['text']
                instruction_prompt += f"Chunk {i}:\n{text_preview}\n\n"
        
        instruction_prompt += f"User Query: {query}\n\nAnswer:"
        
        chat_response = "No response generated by the model."
        if check_ollama_server():
            try:
                response = ollama.chat(
                    model=LANGUAGE_MODEL,
                    messages=[
                        {'role': 'system', 'content': instruction_prompt},
                        {'role': 'user', 'content': query},
                    ],
                    stream=False,
                )
                if response and 'message' in response and 'content' in response['message']:
                    chat_response = response['message']['content'].strip()
            except Exception as e:
                print(f"Ollama chat error: {e}")
                chat_response = "Unable to generate response due to model error. Please try again."
        else:
            print("Ollama server unavailable")
            chat_response = "Ollama server is not available, but I can still assist with doctor searches."

        doctor_recommendations = []
        if doctor_manager:
            specialty = None
            specialty_keywords = {
                'gynecologist': 'gynecologist',
                'obgyn': 'gynecologist',
                'endocrinologist': 'endocrinologist',
                'urologist': 'urologist',
                'reproductive specialist': 'reproductive_specialist',
                'sexual health specialist': 'sexual_health_specialist'
            }
            query_lower = query.lower()
            for keyword, spec in specialty_keywords.items():
                if keyword in query_lower:
                    specialty = spec
                    break
            if not specialty and any(word in query_lower for word in ['hormone', 'gender']):
                specialty = 'endocrinologist'
            
            try:
                doctors = doctor_manager.search_doctors(specialty=specialty)[:2]
                doctor_recommendations = doctors
            except Exception as e:
                print(f"Doctor search error: {e}")
                doctor_recommendations = []

        return chat_response, doctor_recommendations
        
    except Exception as e:
        print(f"Unexpected chat error: {e}")
        return "Sorry, an unexpected error occurred. Please try again later.", []

# Google Drive PDF Processing
async def download_and_process_pdf():
    global DOCUMENT_READY
    try:
        credentials = service_account.Credentials.from_service_account_file(GOOGLE_CREDS)
        service = build('drive', 'v3', credentials=credentials)
        
        request = service.files().get_media(fileId=FILE_ID)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        
        fh.seek(0)
        doc = fitz.open(stream=fh, filetype="pdf")
        text_chunks = []
        
        for page in doc:
            text = page.get_text()
            if text.strip():
                chunks = [text[i:i+1000] for i in range(0, len(text), 1000)]
                for chunk in chunks:
                    embedding = get_embedding(chunk)
                    if embedding:
                        text_chunks.append({
                            'text': chunk,
                            'embedding': embedding
                        })
        
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        collection = db[MONGO_COLL]
        collection.delete_many({})
        if text_chunks:
            collection.insert_many(text_chunks)
        
        client.close()
        DOCUMENT_READY = True
        print("PDF processed and embeddings stored successfully")
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
        DOCUMENT_READY = False

# API Endpoints
@app.on_event("startup")
async def startup_event():
    print("Starting GenderHealthcare Chatbot API...")
    if check_ollama_server():
        print("Ollama server is available")
    else:
        print("Ollama server not available")
    asyncio.create_task(download_and_process_pdf())

@app.get("/")
async def root():
    return {"message": "GenderHealthcare Chatbot API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ollama_server": check_ollama_server(),
        "document_ready": DOCUMENT_READY,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/search", response_model=List[DocumentResponse])
async def search_documents(request: SearchRequest):
    try:
        if not DOCUMENT_READY:
            raise HTTPException(status_code=503, detail="Document processing not complete")
        
        query_embedding = get_embedding(request.query)
        if not query_embedding:
            raise HTTPException(status_code=500, detail="Failed to generate query embedding")
        
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        collection = db[MONGO_COLL]
        
        results = collection.aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "queryVector": query_embedding,
                    "path": "embedding",
                    "numCandidates": 100,
                    "limit": request.limit
                }
            },
            {
                "$project": {
                    "text": 1,
                    "score": {"$meta": "vectorSearchScore"}
                }
            }
        ])
        
        response = [
            DocumentResponse(text=doc['text'], similarity=doc['score'])
            for doc in results
        ]
        
        client.close()
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        doctor_manager = DoctorManager(supabase)
        query_processor = HealthcareQueryProcessor(doctor_manager)
        
        try:
            processed_response = query_processor.process_query(request.query)
            if processed_response['success']:
                return ChatResponse(
                    response=processed_response['message'],
                    context_used=False,
                    doctor_recommendations=processed_response['data'].get('doctors') if processed_response['data'] else None
                )
            else:
                print(f"Query processor failed: {processed_response['message']}")
        except Exception as e:
            print(f"Query processor error: {str(e)}")
        
        if not DOCUMENT_READY:
            print("Document not ready, falling back to basic response")
            response, doctor_recommendations = await get_enhanced_chat_response(
                request.query,
                None,
                doctor_manager
            )
            return ChatResponse(
                response=response,
                context_used=False,
                doctor_recommendations=doctor_recommendations
            )
        
        search_request = SearchRequest(query=request.query, user_id=request.user_id)
        try:
            context_chunks = await search_documents(search_request)
        except Exception as e:
            print(f"Search documents error: {e}")
            context_chunks = None
        
        response, doctor_recommendations = await get_enhanced_chat_response(
            request.query,
            context_chunks,
            doctor_manager
        )
        
        return ChatResponse(
            response=response,
            context_used=bool(context_chunks),
            doctor_recommendations=doctor_recommendations
        )
        
    except Exception as e:
        print(f"Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/doctors", response_model=DoctorResponse)
async def add_doctor(request: DoctorRequest):
    try:
        doctor_manager = DoctorManager(supabase)
        doctor_id = doctor_manager.add_doctor(
            name=request.name,
            specialty=request.specialty,
            bio=request.bio,
            contact_email=request.contact_email,
            phone=request.phone,
            office_address=request.office_address,
            availability=request.availability,
            image_url=request.image_url
        )
        
        if not doctor_id:
            raise HTTPException(status_code=500, detail="Failed to add doctor")
        
        return DoctorResponse(
            success=True,
            message="Doctor added successfully",
            data={"doctor_id": doctor_id}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding doctor: {str(e)}")

@app.post("/doctors/search", response_model=DoctorResponse)
async def search_doctors(request: DoctorSearchRequest):
    try:
        doctor_manager = DoctorManager(supabase)
        doctors = doctor_manager.search_doctors(
            specialty=request.speciality,
            location=request.location,
            name_query=request.query
        )
        
        return DoctorResponse(
            success=True,
            message=f"Found {len(doctors)} doctors",
            data={"doctors": doctors}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching doctors: {str(e)}")

@app.get("/doctors/specialties", response_model=List[str])
async def get_specialties():
    try:
        doctor_manager = DoctorManager(supabase)
        specialties = doctor_manager.get_all_specialties()
        return specialties
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting specialties: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)