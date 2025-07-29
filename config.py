import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Dict, Optional, Any
import ollama
import json
import os
import re
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account
from googleapiclient.errors import HttpError
import io
import fitz  # PyMuPDF
import time
import requests
from datetime import datetime
from supabase import create_client, Client
from postgrest.exceptions import APIError
from dotenv import load_dotenv
import asyncio
import uvicorn
import uuid
from fuzzywuzzy import fuzz, process
from cachetools import TTLCache
from typing import Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment
load_dotenv()
required_env_vars = [
    'GOOGLE_DRIVE_CREDENTIALS_FILE',
    'GOOGLE_DRIVE_FILE_ID_TECHNICAL',
    'MONGO_URI',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Configuration
GOOGLE_CREDS = os.getenv('GOOGLE_DRIVE_CREDENTIALS_FILE')
FILE_ID = os.getenv('GOOGLE_DRIVE_FILE_ID')
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB = os.getenv('MONGO_DB', 'angler')
MONGO_COLL = os.getenv('MONGO_COLLECTION', 'Vector')
CHAT_HISTORY_COLL = os.getenv('CHAT_HISTORY_COLLECTION', 'ChatHistory')
MODEL = os.getenv('EMBEDDING_MODEL', 'nomic-embed-text')
LANGUAGE_MODEL = os.getenv('LANGUAGE_MODEL', 'mistral')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
OLLAMA_HOST = os.getenv('OLLAMA_HOST', '127.0.0.1:11434')

# Global state
DOCUMENT_READY = False
os.environ['OLLAMA_HOST'] = OLLAMA_HOST

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    raise RuntimeError(f"Supabase initialization failed: {str(e)}")

# Caching
specialties_cache = TTLCache(maxsize=100, ttl=3600)
doctors_cache = TTLCache(maxsize=1000, ttl=1800)
query_term_cache = TTLCache(maxsize=1000, ttl=3600)

# Pydantic models
class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = None

    @field_validator('query')
    @classmethod
    def validate_query(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Query cannot be empty")
        return v.strip()

class DocumentResponse(BaseModel):
    text: str
    similarity: float

class ChatResponse(BaseModel):
    response: str
    context_used: bool
    doctor_recommendations: Optional[List[Dict[str, Any]]] = None
    session_id: Optional[str] = None
    additional_info: Optional[Dict[str, Any]] = None

# Utility functions
def check_ollama_server() -> bool:
    try:
        response = requests.get(f"http://{OLLAMA_HOST}/api/tags", timeout=3)
        if response.status_code != 200:
            logger.warning(f"Ollama server check failed with status {response.status_code}")
            return False
        return True
    except requests.RequestException as e:
        logger.error(f"Ollama server check failed: {str(e)}")
        return False

def get_embedding(text: str, max_retries: int = 2) -> Optional[List[float]]:
    if not text.strip():
        logger.warning("Empty text provided for embedding")
        return None
    for attempt in range(max_retries):
        try:
            if not check_ollama_server():
                logger.warning(f"Ollama server unavailable on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                return None
            response = ollama.embeddings(model=MODEL, prompt=text)
            embedding = response.get('embedding') or response.get('embeddings')
            if not embedding:
                logger.error("No embedding returned from Ollama")
                return None
            return embedding
        except Exception as e:
            logger.error(f"Embedding error (attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(1)
    logger.error("Failed to generate embedding after retries")
    return None

# Chat History Manager
class ChatHistoryManager:
    def __init__(self, mongo_uri: str, db_name: str, collection_name: str):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.collection_name = collection_name
        try:
            self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            self.client.admin.command('ping')
            self.db = self.client[db_name]
            self.collection = self.db[collection_name]
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {str(e)}")
            raise RuntimeError(f"MongoDB connection failed: {str(e)}")

    async def save_chat_history(self, user_id: str, query: str, response: str, 
                             context_used: bool, doctor_recommendations: List = None):
        if not user_id:
            logger.info("Skipping chat history save for anonymous user")
            return
        try:
            chat_entry = {
                "user_id": user_id,
                "query": query,
                "response": response,
                "context_used": context_used,
                "doctor_recommendations": doctor_recommendations or [],
                "timestamp": datetime.now().isoformat(),
                "session_id": str(uuid.uuid4())
            }
            await asyncio.get_event_loop().run_in_executor(None, self.collection.insert_one, chat_entry)
            logger.info(f"Chat history saved for user: {user_id}")
        except PyMongoError as e:
            logger.error(f"Error saving chat history: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to save chat history: {str(e)}")

# Doctor Manager
class DoctorManager:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
        self.table_name = "doctor_details"

    async def search_doctors(self, specialty: str = None, name_query: str = None) -> List[Dict[str, Any]]:
        cache_key = f"{specialty}_{name_query}"
        if cache_key in doctors_cache:
            logger.info(f"Returning cached doctors for key: {cache_key}")
            return doctors_cache[cache_key]
        
        try:
            query = self.supabase.table(self.table_name).select("*")
            if specialty:
                query = query.eq("speciality", specialty)
            result = await asyncio.get_event_loop().run_in_executor(None, query.execute)
            
            doctors = []
            for doctor in result.data:
                staff_result = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: self.supabase.table("staff_members").select("full_name, working_email").eq("staff_id", doctor["doctor_id"]).execute()
                )
                name = staff_result.data[0]["full_name"] if staff_result.data else "Unknown"
                contact_email = staff_result.data[0]["working_email"] if staff_result.data else f"contact_{doctor['doctor_id']}@example.com"
                doctor_mapped = {
                    "id": doctor["doctor_id"],
                    "name": name,
                    "specialty": doctor["speciality"],
                    "bio": doctor["bio"],
                    "contact_email": contact_email
                }
                doctors.append(doctor_mapped)
            
            if name_query:
                doctors = [
                    doc for doc in doctors
                    if fuzz.partial_ratio(name_query.lower(), doc['name'].lower()) > 80
                ]
            
            if not doctors and specialty:
                logger.warning(f"No doctors found for specialty: {specialty}")
                all_specialties = await self.get_all_specialties()
                if all_specialties:
                    closest_specialty, score = process.extractOne(specialty, all_specialties)
                    if score > 80:
                        logger.info(f"Falling back to closest specialty: {closest_specialty}")
                        query = self.supabase.table(self.table_name).select("*").eq("speciality", closest_specialty)
                        result = await asyncio.get_event_loop().run_in_executor(None, query.execute)
                        for doctor in result.data:
                            staff_result = await asyncio.get_event_loop().run_in_executor(
                                None, lambda: self.supabase.table("staff_members").select("full_name, working_email").eq("staff_id", doctor["doctor_id"]).execute()
                            )
                            name = staff_result.data[0]["full_name"] if staff_result.data else "Unknown"
                            contact_email = staff_result.data[0]["working_email"] if staff_result.data else f"contact_{doctor['doctor_id']}@example.com"
                            doctor_mapped = {
                                "id": doctor["doctor_id"],
                                "name": name,
                                "specialty": doctor["speciality"],
                                "bio": doctor["bio"],
                                "contact_email": contact_email
                            }
                            doctors.append(doctor_mapped)
            
            doctors_cache[cache_key] = doctors
            logger.info(f"Found {len(doctors)} doctors for query: specialty={specialty}, name_query={name_query}")
            return doctors
        except APIError as e:
            logger.error(f"Supabase error searching doctors: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to search doctors: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error searching doctors: {str(e)}")
            return []

    async def get_all_specialties(self) -> List[str]:
        if "specialties" in specialties_cache:
            logger.info("Returning cached specialties")
            return specialties_cache["specialties"]
        try:
            result = await asyncio.get_event_loop().run_in_executor(
                None, lambda: self.supabase.table(self.table_name).select("speciality").execute()
            )
            specialties = sorted(list(set(doc['speciality'] for doc in result.data)))
            specialties_cache["specialties"] = specialties
            logger.info(f"Retrieved {len(specialties)} specialties")
            return specialties
        except APIError as e:
            logger.error(f"Supabase error getting specialties: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve specialties: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error getting specialties: {str(e)}")
            return []

# Query Processor
class HealthcareQueryProcessor:
    def __init__(self, doctor_manager: DoctorManager, mongo_uri: str, mongo_db: str, mongo_coll: str):
        self.doctor_manager = doctor_manager
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db
        self.mongo_coll = mongo_coll
        self.query_patterns = {
            r'(doctor|physician|specialist|gynecologist|obgyn)': self._handle_doctor_request,
            r'(appointment|booking|schedule|consult|telehealth)': self._handle_appointment_request,
            r'(emergency|urgent|help|crisis)': self._handle_emergency,
            r'(symptom|pain|condition|disease|irregular period|menopause|pms|pregnancy)': self._handle_symptom_query,
            r'(insurance|payment|coverage)': self._handle_insurance_query,
            r'(procedure|surgery|treatment)': self._handle_procedure_query,
        }
        self.key_terms = {
            'doctor': ['doctor', 'physician', 'specialist', 'gynecologist', 'obgyn'],
            'appointment': ['appointment', 'booking', 'schedule', 'consult', 'telehealth', 'apm'],
            'emergency': ['emergency', 'urgent', 'help', 'crisis'],
            'symptom': ['symptom', 'pain', 'condition', 'disease', 'irregular period', 'menopause', 'pms', 'pregnancy'],
            'insurance': ['insurance', 'payment', 'coverage'],
            'procedure': ['procedure', 'surgery', 'treatment']
        }

    def _correct_misspellings(self, query: str) -> str:
        if not query or not query.strip():
            return query
        query_lower = query.lower()
        words = query_lower.split()
        corrected_words = []
        
        for word in words:
            cache_key = f"term_{word}"
            if cache_key in query_term_cache:
                corrected_words.append(query_term_cache[cache_key])
                continue
            
            best_match = word
            best_score = 0
            for category, terms in self.key_terms.items():
                match, score = process.extractOne(word, terms, scorer=fuzz.partial_ratio)
                if score > 80 and score > best_score:
                    best_match = match
                    best_score = score
            corrected_words.append(best_match)
            query_term_cache[cache_key] = best_match
            if best_match != word:
                logger.info(f"Corrected '{word}' to '{best_match}' (score: {best_score})")
        
        corrected_query = ' '.join(corrected_words)
        return corrected_query if corrected_query != query_lower else query_lower

    async def process_query(self, query: str) -> Dict[str, Any]:
        if not query or not query.strip():
            logger.warning("Empty query received")
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        corrected_query = self._correct_misspellings(query)
        query_lower = corrected_query.lower().strip()
        logger.info(f"Processing query: {query} (corrected: {corrected_query})")
        
        for pattern, handler in self.query_patterns.items():
            if re.search(pattern, query_lower):
                try:
                    return await handler(query)
                except HTTPException as e:
                    raise e
                except Exception as e:
                    logger.error(f"Error in handler for pattern {pattern}: {str(e)}")
                    return {
                        "success": False,
                        "message": f"Error processing query: {str(e)}",
                        "data": None
                    }
        return await self._handle_general_help()

    async def _handle_doctor_request(self, query: str) -> Dict[str, Any]:
        query_lower = query.lower()
        specialty_keywords = {
            'gynecologist': 'gynecologist',
            'obgyn': 'gynecologist',
            'endocrinologist': 'endocrinologist',
            'urologist': 'urologist',
            'reproductive specialist': 'reproductive_specialist',
            'sexual health specialist': 'sexual_health_specialist',
            'therapist': 'therapist',
            'psychiatrist': 'psychiatrist'
        }
        specialty = None
        for keyword, spec in specialty_keywords.items():
            if keyword in query_lower:
                specialty = spec
                break
        if not specialty and any(word in query_lower for word in ['hormone', 'gender', 'transgender']):
            specialty = 'endocrinologist'
        
        try:
            doctors = await self.doctor_manager.search_doctors(specialty=specialty, name_query=query)
            if not doctors:
                logger.info(f"No doctors found for specialty: {specialty}")
                return {
                    "success": True,
                    "message": f"No doctors found for {specialty or 'your request'}. Please try a different specialty or provide more details.",
                    "data": {"doctors": [], "specialty_searched": specialty}
                }
            
            doctor_info = [
                {
                    "name": doc['name'],
                    "specialty": doc['specialty'],
                    "bio": doc['bio'][:200] + "..." if len(doc['bio']) > 200 else doc['bio'],
                    "contact_email": doc['contact_email']
                } for doc in doctors[:3]
            ]
            
            message = f"Found {len(doctors)} doctor(s)"
            if specialty:
                message += f" specializing in {specialty}"
            message += ". Here are some recommendations:\n\n"
            for i, doc in enumerate(doctor_info, 1):
                message += f"{i}. Dr. {doc['name']} - {doc['specialty']}\n"
                message += f"   Email: {doc['contact_email']}\n"
                message += f"   Bio: {doc['bio']}\n\n"
            
            return {
                "success": True,
                "message": message,
                "data": {"doctors": doctor_info, "specialty_searched": specialty}
            }
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error handling doctor request: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process doctor request: {str(e)}")

    async def _handle_appointment_request(self, query: str) -> Dict[str, Any]:
        query_lower = query.lower()
        is_telehealth = 'telehealth' in query_lower or 'online' in query_lower
        return {
            "success": True,
            "message": f"To book an {'online' if is_telehealth else 'in-person'} appointment, please contact a healthcare provider directly. Would you like me to find a suitable doctor?",
            "data": {"action_required": "contact_doctor", "is_telehealth": is_telehealth}
        }

    async def _handle_emergency(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "For medical emergencies, call 911 or visit the nearest emergency room. For urgent but non-emergency issues, contact a healthcare provider or a 24/7 nurse hotline.",
            "data": {"emergency_contacts": {"emergency": "911"}}
        }

    async def _handle_symptom_query(self, query: str) -> Dict[str, Any]:
        specialty = 'general_practitioner'
        if any(word in query.lower() for word in ['hormone', 'menopause', 'pms', 'pregnancy', 'irregular period']):
            specialty = 'gynecologist'
        elif any(word in query.lower() for word in ['mental', 'anxiety', 'depression']):
            specialty = 'therapist'
        
        context_chunks = None
        if DOCUMENT_READY:
            try:
                client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
                try:
                    client.admin.command('ping')
                    db = client[self.mongo_db]
                    collection = db[self.mongo_coll]
                    query_embedding = await asyncio.get_event_loop().run_in_executor(None, lambda: get_embedding(query))
                    if not query_embedding:
                        logger.error("Failed to generate query embedding")
                    else:
                        results = await asyncio.get_event_loop().run_in_executor(
                            None,
                            lambda: collection.aggregate([
                                {
                                    "$vectorSearch": {
                                        "index": "default",
                                        "queryVector": query_embedding,
                                        "path": "embedding",
                                        "numCandidates": 50,
                                        "limit": 5
                                    }
                                },
                                {"$project": {"text": 1, "score": {"$meta": "vectorSearchScore"}}}
                            ])
                        )
                        context_chunks = [DocumentResponse(text=doc['text'], similarity=doc['score']) for doc in results]
                        logger.info(f"Retrieved {len(context_chunks)} document chunks for symptom query: {query}")
                finally:
                    client.close()
            except Exception as e:
                logger.error(f"Error retrieving document context for symptom query: {str(e)}")
                context_chunks = None

        try:
            doctors = await self.doctor_manager.search_doctors(specialty=specialty)
            message = ""
            if context_chunks:
                response_text, _, _ = await get_enhanced_chat_response(query, context_chunks, self.doctor_manager)
                message += f"Based on your query, here's some information: {response_text}\n\n"
            else:
                message += f"I'm unable to provide specific medical advice based on available information. "
            message += f"I recommend consulting a {specialty.replace('_', ' ')} for your symptoms. Would you like to see available doctors?\n\n"
            if doctors:
                message += "Here are some recommendations:\n"
                for i, doc in enumerate(doctors[:2], 1):
                    message += f"{i}. Dr. {doc['name']} - {doc['specialty']}\n"
                    message += f"   Email: {doc['contact_email']}\n"
            return {
                "success": True,
                "message": message,
                "data": {"doctors": doctors[:2], "specialty_searched": specialty, "context_used": bool(context_chunks)}
            }
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error handling symptom query: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process symptom query: {str(e)}")

    async def _handle_insurance_query(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "For insurance or payment questions, please contact your healthcare provider or insurance company directly.",
            "data": {"action_required": "check_insurance"}
        }

    async def _handle_procedure_query(self) -> Dict[str, Any]:
        return {
            "success": True,
            "message": "For information about specific procedures or treatments, please consult a specialist. Would you like me to find a relevant doctor?",
            "data": {"action_required": "find_doctor"}
        }

    async def _handle_general_help(self) -> Dict[str, Any]:
        try:
            specialties = await self.doctor_manager.get_all_specialties()
            return {
                "success": True,
                "message": "I can assist with:\n"
                          "- Finding doctors (e.g., 'find me a gynecologist')\n"
                          "- Understanding symptoms or conditions\n"
                          "- Booking appointments\n"
                          "- Insurance questions\n"
                          f"Available specialties: {', '.join(specialties)}\n\n"
                          "Try asking: 'Find a therapist' or 'I have symptoms of menopause'",
                "data": {"specialties": specialties}
            }
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error handling general help: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process general help query: {str(e)}")

# Enhanced Chat Response
async def get_enhanced_chat_response(query: str, context_chunks: List = None, 
                                   doctor_manager: DoctorManager = None) -> Tuple[str, List, Dict]:
    try:
        if not query or not query.strip():
            logger.warning("Empty query received in get_enhanced_chat_response")
            return "Query cannot be empty", [], {}
        
        instruction_prompt = (
            "You are a healthcare assistant for a patient-focused chatbot. "
            "Provide accurate, supportive, and empathetic responses. "
            "Focus on answering patient queries clearly, using provided context when available. "
            "Always recommend consulting a healthcare professional for medical advice. "
            "Avoid diagnosing or prescribing treatments.\n\n"
        )
        if context_chunks:
            instruction_prompt += "Context from medical documents:\n"
            for i, chunk in enumerate(context_chunks[:3], 1):
                text_preview = chunk['text'][:600] if len(chunk['text']) > 600 else chunk['text']
                instruction_prompt += f"Chunk {i}:\n{text_preview}\n\n"
        instruction_prompt += f"User Query: {query}\n\nAnswer:"
        
        chat_response = "No response generated."
        if check_ollama_server():
            try:
                response = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: ollama.chat(
                        model=LANGUAGE_MODEL,
                        messages=[
                            {'role': 'system', 'content': instruction_prompt},
                            {'role': 'user', 'content': query},
                        ],
                        stream=False,
                    )
                )
                if response and 'message' in response and 'content' in response['message']:
                    chat_response = response['message']['content'].strip()
                else:
                    logger.warning("Invalid response structure from Ollama")
                    chat_response = "Invalid response from model."
            except Exception as e:
                logger.error(f"Ollama chat error: {str(e)}")
                chat_response = "Unable to generate response due to model error."
        else:
            logger.warning("Ollama server unavailable")
            chat_response = "I'm sorry, I'm unable to process your request right now, but I can assist with finding a doctor or answering general questions."

        doctor_recommendations = []
        if doctor_manager:
            specialty = None
            specialty_keywords = {
                'gynecologist': 'gynecologist',
                'obgyn': 'gynecologist',
                'endocrinologist': 'endocrinologist',
                'urologist': 'urologist',
                'reproductive specialist': 'reproductive_specialist',
                'sexual health specialist': 'sexual_health_specialist',
                'therapist': 'therapist',
                'psychiatrist': 'psychiatrist'
            }
            query_lower = query.lower()
            for keyword, spec in specialty_keywords.items():
                if keyword in query_lower:
                    specialty = spec
                    break
            if not specialty and any(word in query_lower for word in ['hormone', 'gender', 'transgender']):
                specialty = 'endocrinologist'
            elif any(word in query_lower for word in ['mental', 'anxiety', 'depression']):
                specialty = 'therapist'
            elif any(word in query_lower for word in ['irregular period', 'menopause', 'pms', 'pregnancy']):
                specialty = 'gynecologist'
            try:
                doctor_recommendations = await doctor_manager.search_doctors(specialty=specialty)
                doctor_recommendations = doctor_recommendations[:2]
            except HTTPException as e:
                raise e
            except Exception as e:
                logger.error(f"Doctor search error in get_enhanced_chat_response: {str(e)}")
                doctor_recommendations = []

        additional_info = {}
        if any(word in query_lower for word in ['insurance', 'payment', 'coverage']):
            additional_info['insurance_info'] = "Please contact your healthcare provider or insurance company for details."
        if any(word in query_lower for word in ['telehealth', 'online']):
            additional_info['telehealth_info'] = "Telehealth appointments are available. Contact a doctor to schedule."
        
        return chat_response, doctor_recommendations, additional_info
    except Exception as e:
        logger.error(f"Unexpected error in get_enhanced_chat_response: {str(e)}")
        return "An error occurred. Please try again.", [], {}

# Google Drive PDF Processing
async def download_and_process_pdf():
    global DOCUMENT_READY
    try:
        if not os.path.exists(GOOGLE_CREDS):
            logger.error(f"Google credentials file not found: {GOOGLE_CREDS}")
            raise FileNotFoundError(f"Google credentials file not found: {GOOGLE_CREDS}")
        credentials = service_account.Credentials.from_service_account_file(GOOGLE_CREDS)
        service = build('drive', 'v3', credentials=credentials)
        request = service.files().get_media(fileId=FILE_ID)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        fh.seek(0)
        doc = fitz.open(stream=fh, filetype="pdf")
        text_chunks = []
        for page in doc:
            text = page.get_text()
            if text.strip():
                chunks = [text[i:i+800] for i in range(0, len(text), 800)]
                for chunk in chunks:
                    embedding = await asyncio.get_event_loop().run_in_executor(None, lambda: get_embedding(chunk))
                    if embedding:
                        text_chunks.append({'text': chunk, 'embedding': embedding})
        
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        try:
            client.admin.command('ping')
            db = client[MONGO_DB]
            collection = db[MONGO_COLL]
            await asyncio.get_event_loop().run_in_executor(None, lambda: collection.delete_many({}))
            if text_chunks:
                await asyncio.get_event_loop().run_in_executor(None, lambda: collection.insert_many(text_chunks))
            logger.info("PDF processed and embeddings stored successfully")
            DOCUMENT_READY = True
        finally:
            client.close()
    except FileNotFoundError as e:
        logger.error(f"File error in PDF processing: {str(e)}")
        DOCUMENT_READY = False
    except HttpError as e:
        logger.error(f"Google Drive API error: {str(e)}")
        DOCUMENT_READY = False
    except PyMongoError as e:
        logger.error(f"MongoDB error in PDF processing: {str(e)}")
        DOCUMENT_READY = False
    except Exception as e:
        logger.error(f"Unexpected error in PDF processing: {str(e)}")
        DOCUMENT_READY = False

# FastAPI app
app = FastAPI()

# API Endpoints
@app.on_event("startup")
async def startup_event():
    logger.info("Starting GenderHealthcare Chatbot API...")
    if check_ollama_server():
        logger.info("Ollama server is available")
    else:
        logger.warning("Ollama server not available")
    asyncio.create_task(download_and_process_pdf())

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    doctor_manager = DoctorManager(supabase)
    query_processor = HealthcareQueryProcessor(doctor_manager, MONGO_URI, MONGO_DB, MONGO_COLL)
    session_id = str(uuid.uuid4()) if not request.user_id else None
    chat_history_manager = ChatHistoryManager(MONGO_URI, MONGO_DB, CHAT_HISTORY_COLL)
    
    try:
        processed_response = await query_processor.process_query(request.query)
        if processed_response['success']:
            response = ChatResponse(
                response=processed_response['message'],
                context_used=processed_response['data'].get('context_used', False),
                doctor_recommendations=processed_response['data'].get('doctors') if processed_response['data'] else None,
                session_id=session_id,
                additional_info=processed_response['data']
            )
            if request.user_id:
                await chat_history_manager.save_chat_history(
                    user_id=request.user_id,
                    query=request.query,
                    response=response.response,
                    context_used=response.context_used,
                    doctor_recommendations=response.doctor_recommendations
                )
            logger.info(f"Chat response generated for query: {request.query}")
            return response
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Query processor error: {str(e)}")
    
    context_chunks = None
    if DOCUMENT_READY:
        try:
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            try:
                client.admin.command('ping')
                db = client[MONGO_DB]
                collection = db[MONGO_COLL]
                query_embedding = await asyncio.get_event_loop().run_in_executor(None, lambda: get_embedding(request.query))
                if not query_embedding:
                    logger.error("Failed to generate query embedding")
                else:
                    results = await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: collection.aggregate([
                            {
                                '$vectorSearch': {
                                    'index': "default",
                                    'path': "embedding",
                                    'queryVector': query_embedding,
                                    'numCandidates': 50,
                                    'limit': 3
                                }
                            },
                            {"$project": {"text": 1, "score": {"$meta": "vectorSearchScore"}}}
                        ])
                    )
                    context_chunks = [DocumentResponse(text=doc['text'], similarity=doc['score']) for doc in results]
                    logger.info(f"Search returned {len(context_chunks)} documents")
            finally:
                client.close()
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Search documents error: {str(e)}")
    
    response_text, doctor_recommendations, additional_info = await get_enhanced_chat_response(
        request.query, context_chunks, doctor_manager
    )
    response = ChatResponse(
        response=response_text,
        context_used=bool(context_chunks),
        doctor_recommendations=doctor_recommendations,
        session_id=session_id,
        additional_info=additional_info
    )
    
    if request.user_id:
        try:
            await chat_history_manager.save_chat_history(
                user_id=request.user_id,
                query=request.query,
                response=response.response,
                context_used=response.context_used,
                doctor_recommendations=response.doctor_recommendations
            )
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error saving chat history in chat endpoint: {str(e)}")
    
    logger.info(f"Enhanced chat response generated for query: {request.query}")
    return response

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)