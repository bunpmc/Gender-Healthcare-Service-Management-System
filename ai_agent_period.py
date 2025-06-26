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

# TESTING
# CODE SMELLS EXAMPLES IN PYTHON

# =============================================================================
# MODULE SMELLS
# =============================================================================

# 1. LOW COHESION - Class doing unrelated things
class UserManagerEmailSender:
    """Low cohesion: mixing user management with email functionality"""
    
    def __init__(self):
        self.users = []
        self.smtp_server = "smtp.gmail.com"
    
    def add_user(self, user):
        self.users.append(user)
    
    def remove_user(self, user_id):
        self.users = [u for u in self.users if u.id != user_id]
    
    def send_welcome_email(self, email):
        # Email logic mixed with user management
        pass
    
    def validate_email_format(self, email):
        # More email logic in user management class
        return "@" in email
    
    def calculate_user_age(self, birth_date):
        # Age calculation logic
        pass
    
    def generate_email_template(self, template_type):
        # Template generation logic
        pass

# 2. BRAIN CLASS / GOD CLASS - Large class with too many responsibilities
class ApplicationManager:
    """Brain/God Class: handling everything in the application"""
    
    def __init__(self):
        self.users = []
        self.products = []
        self.orders = []
        self.payments = []
        self.inventory = {}
        self.email_templates = {}
        self.database_connection = None
        self.cache = {}
        self.logger = None
        self.security_tokens = {}
    
    # User management (50+ lines of code)
    def create_user(self, username, email, password):
        # Complex user creation logic
        pass
    
    def authenticate_user(self, username, password):
        # Authentication logic
        pass
    
    def update_user_profile(self, user_id, profile_data):
        # Profile update logic
        pass
    
    # Product management (50+ lines of code)
    def add_product(self, product_data):
        # Product creation logic
        pass
    
    def update_inventory(self, product_id, quantity):
        # Inventory management logic
        pass
    
    # Order processing (100+ lines of code)
    def process_order(self, order_data):
        # Complex order processing - this is a Brain Method
        if self.validate_order(order_data):
            if self.check_inventory(order_data):
                if self.process_payment(order_data['payment']):
                    if self.update_inventory_after_order(order_data):
                        if self.send_confirmation_email(order_data):
                            if self.update_user_order_history(order_data):
                                if self.generate_invoice(order_data):
                                    return self.finalize_order(order_data)
        return False
    
    # Payment processing (50+ lines of code)
    def process_payment(self, payment_data):
        # Payment processing logic
        pass
    
    # Email functionality (30+ lines of code)
    def send_email(self, recipient, subject, body):
        # Email sending logic
        pass
    
    # Database operations (40+ lines of code)
    def save_to_database(self, data, table):
        # Database save logic
        pass
    
    # Caching (20+ lines of code)
    def cache_data(self, key, data):
        # Caching logic
        pass
    
    # Security (30+ lines of code)
    def generate_token(self, user_id):
        # Token generation logic
        pass

# 3. DEVELOPER CONGESTION - File that many developers modify frequently
class ConfigManager:
    """This class is modified by multiple teams frequently"""
    
    # Team A adds database configs
    DATABASE_CONFIG = {
        'host': 'localhost',
        'port': 5432,
        'database': 'myapp'
    }
    
    # Team B adds API configs
    API_CONFIG = {
        'base_url': 'https://api.example.com',
        'timeout': 30,
        'retries': 3
    }
    
    # Team C adds feature flags
    FEATURE_FLAGS = {
        'new_ui': True,
        'beta_feature': False
    }
    
    # Team D adds logging configs
    LOGGING_CONFIG = {
        'level': 'INFO',
        'format': '%(asctime)s - %(name)s - %(levelname)s'
    }

# 4. COMPLEX CODE BY FORMER CONTRIBUTORS - Legacy complex code
class LegacyPaymentProcessor:
    """Complex code written by developer who left the company"""
    
    def process_legacy_payment(self, payment_data):
        # Complex logic that nobody fully understands anymore
        if payment_data.get('type') == 'credit_card':
            if payment_data.get('card_type') in ['visa', 'mastercard']:
                if self._validate_card_number(payment_data['card_number']):
                    if self._check_expiry(payment_data['expiry']):
                        # ... 50 more lines of complex conditional logic
                        pass
        # More complex branching logic that's hard to maintain
        pass

# 5. LINES OF CODE - Very large file/class
class MassiveDataProcessor:
    """Large class with too many lines of code (imagine 1000+ lines)"""
    
    def __init__(self):
        # 50 lines of initialization
        pass
    
    def method1(self):
        # 100 lines of code
        pass
    
    def method2(self):
        # 150 lines of code
        pass
    
    # ... 20 more methods with 50+ lines each
    # Total: 1000+ lines of code

# =============================================================================
# FUNCTION SMELLS
# =============================================================================

# 1. BRAIN METHOD / GOD FUNCTION - Complex function doing everything
def process_user_registration(user_data):
    """Brain Method: one function handling entire registration process"""
    
    # Validation (20 lines)
    if not user_data.get('email'):
        raise ValueError("Email required")
    if not user_data.get('password'):
        raise ValueError("Password required")
    if len(user_data['password']) < 8:
        raise ValueError("Password too short")
    if '@' not in user_data['email']:
        raise ValueError("Invalid email")
    
    # Password hashing (10 lines)
    import hashlib
    salt = "random_salt"
    hashed_password = hashlib.sha256((user_data['password'] + salt).encode()).hexdigest()
    
    # Database operations (15 lines)
    connection = get_database_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", 
                      (user_data['email'], hashed_password))
        user_id = cursor.lastrowid
        connection.commit()
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        connection.close()
    
    # Email sending (20 lines)
    email_subject = "Welcome to our platform!"
    email_body = f"Hello {user_data.get('name', 'User')}, welcome!"
    try:
        send_email(user_data['email'], email_subject, email_body)
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    
    # Logging (10 lines)
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"New user registered: {user_data['email']}")
    
    # Return user data (5 lines)
    return {
        'user_id': user_id,
        'email': user_data['email'],
        'status': 'registered'
    }

# 2. DRY VIOLATIONS - Repeated code that changes together
def calculate_discount_for_premium_user(user, order_total):
    """DRY violation: discount calculation repeated"""
    if user.membership == 'premium':
        if order_total > 100:
            discount = order_total * 0.15
        elif order_total > 50:
            discount = order_total * 0.10
        else:
            discount = order_total * 0.05
    else:
        discount = 0
    return discount

def calculate_discount_for_order(user, order_total):
    """Same discount logic repeated"""
    if user.membership == 'premium':
        if order_total > 100:
            discount = order_total * 0.15
        elif order_total > 50:
            discount = order_total * 0.10
        else:
            discount = order_total * 0.05
    else:
        discount = 0
    return order_total - discount

# 3. COMPLEX METHOD - High cyclomatic complexity
def process_payment_with_multiple_conditions(payment_data):
    """Complex method with many conditional statements"""
    
    if payment_data['type'] == 'credit_card':
        if payment_data['card_type'] == 'visa':
            if payment_data['amount'] > 1000:
                if payment_data['country'] == 'US':
                    # Process high-value US Visa
                    pass
                else:
                    # Process high-value international Visa
                    pass
            else:
                # Process low-value Visa
                pass
        elif payment_data['card_type'] == 'mastercard':
            if payment_data['amount'] > 500:
                # Process high-value Mastercard
                pass
            else:
                # Process low-value Mastercard
                pass
    elif payment_data['type'] == 'paypal':
        if payment_data['verified']:
            if payment_data['amount'] > 2000:
                # Process high-value verified PayPal
                pass
            else:
                # Process low-value verified PayPal
                pass
        else:
            # Process unverified PayPal
            pass
    elif payment_data['type'] == 'bank_transfer':
        if payment_data['same_day']:
            # Process same-day transfer
            pass
        else:
            # Process regular transfer
            pass

# 4. PRIMITIVE OBSESSION - Using primitives instead of domain objects
def create_user_account(email_str, phone_str, age_int, salary_float):
    """Primitive obsession: using basic types instead of domain objects"""
    
    # Should use Email, Phone, Age, Money objects instead
    if '@' not in email_str:  # Email validation scattered
        raise ValueError("Invalid email")
    
    if len(phone_str) != 10:  # Phone validation scattered
        raise ValueError("Invalid phone")
    
    if age_int < 18 or age_int > 120:  # Age validation scattered
        raise ValueError("Invalid age")
    
    if salary_float < 0:  # Salary validation scattered
        raise ValueError("Invalid salary")
    
    # Processing with primitives
    return {
        'email': email_str,
        'phone': phone_str,
        'age': age_int,
        'salary': salary_float
    }

# 5. LARGE METHOD - Too many lines of code
def generate_comprehensive_report(data):
    """Large method with too many lines of code"""
    
    # Data validation (20 lines)
    if not data:
        raise ValueError("No data provided")
    # ... more validation
    
    # Data processing (30 lines)
    processed_data = []
    for item in data:
        # Complex processing logic
        pass
    
    # Calculations (25 lines)
    total = sum(item['value'] for item in processed_data)
    average = total / len(processed_data)
    # ... more calculations
    
    # Formatting (20 lines)
    formatted_data = []
    for item in processed_data:
        # Formatting logic
        pass
    
    # Report generation (30 lines)
    report = {
        'title': 'Comprehensive Report',
        'data': formatted_data,
        'summary': {'total': total, 'average': average}
    }
    # ... more report building
    
    # File writing (15 lines)
    with open('report.json', 'w') as f:
        import json
        json.dump(report, f, indent=2)
    
    return report
    # Total: 140+ lines

# =============================================================================
# IMPLEMENTATION SMELLS
# =============================================================================

# 1. NESTED COMPLEXITY - Deeply nested conditions and loops
def process_complex_data(data_sets):
    """Nested complexity: multiple levels of nesting"""
    
    for data_set in data_sets:
        if data_set.is_valid():
            for category in data_set.categories:
                if category.is_active():
                    for item in category.items:
                        if item.needs_processing():
                            for attribute in item.attributes:
                                if attribute.is_dirty():
                                    for validation_rule in attribute.validation_rules:
                                        if validation_rule.applies_to(attribute):
                                            # 6 levels deep!
                                            validation_rule.validate(attribute)

# 2. BUMPY ROAD - Function with multiple logical chunks
def process_order_bumpy_road(order):
    """Bumpy road: multiple logical chunks not properly encapsulated"""
    
    # Chunk 1: Order validation
    if not order.customer_id:
        raise ValueError("Customer ID required")
    if not order.items:
        raise ValueError("Order items required")
    total = sum(item.price * item.quantity for item in order.items)
    
    # Chunk 2: Inventory checking
    for item in order.items:
        available = get_inventory_count(item.product_id)
        if available < item.quantity:
            raise ValueError(f"Insufficient inventory for {item.product_id}")
    
    # Chunk 3: Payment processing
    payment_data = {
        'amount': total,
        'customer_id': order.customer_id,
        'payment_method': order.payment_method
    }
    payment_result = process_payment(payment_data)
    if not payment_result.success:
        raise ValueError("Payment failed")
    
    # Chunk 4: Inventory updates
    for item in order.items:
        update_inventory(item.product_id, -item.quantity)
    
    # Chunk 5: Email notification
    customer = get_customer(order.customer_id)
    email_body = f"Your order #{order.id} has been processed"
    send_email(customer.email, "Order Confirmation", email_body)
    
    # Chunk 6: Logging and cleanup
    log_order_processed(order.id)
    cleanup_temp_files()
    
    return order

# 3. COMPLEX CONDITIONAL - Multiple logical operators in conditions
def check_user_access_rights(user, resource, action):
    """Complex conditional with multiple logical operators"""
    
    # Complex conditional expression
    if ((user.role == 'admin' or user.role == 'moderator' or user.is_owner_of(resource)) and 
        (action in ['read', 'write', 'delete'] or user.has_special_permission(action)) and
        (resource.is_public or resource.owner_id == user.id or user.id in resource.shared_with) and
        not (user.is_suspended or user.is_banned or resource.is_locked) and
        (user.subscription_active or resource.free_tier_accessible)):
        return True
    return False

# 4. LARGE ASSERTION BLOCKS - Test with too many consecutive assertions
def test_user_creation_large_assertions():
    """Large assertion blocks in tests"""
    
    user = create_user("test@example.com", "password123")
    
    # Large block of consecutive assertions
    assert user is not None
    assert user.email == "test@example.com"
    assert user.password != "password123"  # Should be hashed
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.is_active == True
    assert user.is_verified == False
    assert user.role == "user"
    assert user.profile is not None
    assert user.profile.first_name == ""
    assert user.profile.last_name == ""
    assert user.settings is not None
    assert user.settings.email_notifications == True
    assert user.settings.sms_notifications == False
    assert len(user.permissions) == 0
    assert user.last_login is None
    assert user.login_count == 0
    # ... 20+ more assertions

# 5. DUPLICATED ASSERTION BLOCKS - Same assertions copy-pasted
def test_admin_user_creation():
    """Duplicated assertion blocks across tests"""
    
    user = create_admin_user("admin@example.com", "admin123")
    
    # Duplicated assertion block
    assert user is not None
    assert user.email == "admin@example.com"
    assert user.password != "admin123"
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.is_active == True
    assert user.profile is not None
    assert user.settings is not None

def test_moderator_user_creation():
    """Same assertion block duplicated"""
    
    user = create_moderator_user("mod@example.com", "mod123")
    
    # Same assertion block copy-pasted
    assert user is not None
    assert user.email == "mod@example.com"
    assert user.password != "mod123"
    assert user.created_at is not None
    assert user.updated_at is not None
    assert user.is_active == True
    assert user.profile is not None
    assert user.settings is not None

# =============================================================================
# HELPER FUNCTIONS (for examples above)
# =============================================================================

def get_database_connection():
    pass

def send_email(recipient, subject, body):
    pass

def get_inventory_count(product_id):
    return 10

def process_payment(payment_data):
    class PaymentResult:
        success = True
    return PaymentResult()

def update_inventory(product_id, change):
    pass

def get_customer(customer_id):
    class Customer:
        email = "customer@example.com"
    return Customer()

def log_order_processed(order_id):
    pass

def cleanup_temp_files():
    pass

def create_user(email, password):
    class User:
        def __init__(self, email, password):
            self.email = email
            self.password = "hashed_" + password
            self.created_at = "2024-01-01"
            self.updated_at = "2024-01-01"
            self.is_active = True
            self.is_verified = False
            self.role = "user"
            self.profile = type('Profile', (), {'first_name': '', 'last_name': ''})()
            self.settings = type('Settings', (), {'email_notifications': True, 'sms_notifications': False})()
            self.permissions = []
            self.last_login = None
            self.login_count = 0
    return User(email, password)

def create_admin_user(email, password):
    user = create_user(email, password)
    user.role = "admin"
    return user

def create_moderator_user(email, password):
    user = create_user(email, password)
    user.role = "moderator"
    return user
# END TESTING

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
)# Configurationa
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

# CODESCENCE

# # MORE HARDCODED SECRETS AND CREDENTIALS
# DATABASE_MASTER_PASSWORD = "root123admin"  # Security hotspot
# PRODUCTION_API_KEY = "prod-api-key-987654321"  # Security hotspot
# SYSTEM_ADMIN_TOKEN = "admin-token-abcdef"  # Security hotspot
# PAYMENT_GATEWAY_SECRET = "payment-secret-123456"  # Security hotspot
# EXTERNAL_SERVICE_AUTH = "Bearer sk-live-abcdef1234567890"  # Security hotspot
# MASTER_ENCRYPTION_KEY = "master-key-supersecret"  # Security hotspot
# CLOUD_STORAGE_ACCESS_KEY = "AKIA1234567890ABCDEF"  # Security hotspot
# CLOUD_STORAGE_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  # Security hotspot
# THIRD_PARTY_WEBHOOK_SECRET = "whsec_1234567890abcdef"  # Security hotspot
# LEGACY_SYSTEM_PASSWORD = "legacy_pass_456"  # Security hotspot

# # DUPLICATE CODE BLOCKS TO INCREASE DUPLICATION ISSUES
# def duplicate_validation_logic_v1(data):
#     """Duplicate validation logic - version 1"""
#     if not data:
#         return False
#     if not isinstance(data, dict):
#         return False
#     if 'user_id' not in data:
#         return False
#     if not data['user_id']:
#         return False
#     if len(data['user_id']) < 5:
#         return False
#     if not data['user_id'].isalnum():
#         return False
#     return True

# def duplicate_validation_logic_v2(data):
#     """Duplicate validation logic - version 2 (almost identical)"""
#     if not data:
#         return False
#     if not isinstance(data, dict):
#         return False
#     if 'user_id' not in data:
#         return False
#     if not data['user_id']:
#         return False
#     if len(data['user_id']) < 5:
#         return False
#     if not data['user_id'].isalnum():
#         return False
#     return True

# def duplicate_validation_logic_v3(data):
#     """Duplicate validation logic - version 3 (almost identical)"""
#     if not data:
#         return False
#     if not isinstance(data, dict):
#         return False
#     if 'user_id' not in data:
#         return False
#     if not data['user_id']:
#         return False
#     if len(data['user_id']) < 5:
#         return False
#     if not data['user_id'].isalnum():
#         return False
#     return True

# # LONG PARAMETER LISTS
# def function_with_massive_parameter_list(param1, param2, param3, param4, param5, param6, param7, param8, param9, param10, param11, param12, param13, param14, param15, param16, param17, param18, param19, param20, param21, param22, param23, param24, param25, param26, param27, param28, param29, param30, param31, param32, param33, param34, param35, param36, param37, param38, param39, param40):
#     """Function with way too many parameters"""
#     return sum([param1, param2, param3, param4, param5, param6, param7, param8, param9, param10, param11, param12, param13, param14, param15, param16, param17, param18, param19, param20, param21, param22, param23, param24, param25, param26, param27, param28, param29, param30, param31, param32, param33, param34, param35, param36, param37, param38, param39, param40])

# # EXTREMELY LONG FUNCTION
# def extremely_long_function_that_should_be_split():
#     """This function is way too long and does too many things"""
#     print("Starting extremely long function")
#     print("Initializing variables")
#     print("Setting up configuration")
#     print("Validating input parameters")
#     print("Connecting to database")
#     print("Establishing connection pool")
#     print("Configuring connection settings")
#     print("Setting up authentication")
#     print("Validating credentials")
#     print("Checking user permissions")
#     print("Loading user profile")
#     print("Initializing user session")
#     print("Setting session parameters")
#     print("Configuring session timeout")
#     print("Loading application settings")
#     print("Initializing application state")
#     print("Setting up logging framework")
#     print("Configuring log levels")
#     print("Setting up error handling")
#     print("Initializing exception handlers")
#     print("Setting up monitoring")
#     print("Configuring health checks")
#     print("Initializing metrics collection")
#     print("Setting up performance monitoring")
#     print("Configuring alerts")
#     print("Initializing notification system")
#     print("Setting up email configuration")
#     print("Configuring SMS settings")
#     print("Initializing push notifications")
#     print("Setting up data validation")
#     print("Configuring validation rules")
#     print("Initializing data sanitization")
#     print("Setting up input filtering")
#     print("Configuring output encoding")
#     print("Initializing security framework")
#     print("Setting up encryption")
#     print("Configuring key management")
#     print("Initializing access control")
#     print("Setting up authorization")
#     print("Configuring role-based access")
#     print("Initializing audit logging")
#     print("Setting up compliance checks")
#     print("Configuring regulatory requirements")
#     print("Initializing data governance")
#     print("Setting up data classification")
#     print("Configuring data retention policies")
#     print("Initializing backup systems")
#     print("Setting up disaster recovery")
#     print("Configuring high availability")
#     print("Initializing load balancing")
#     print("Setting up clustering")
#     print("Configuring failover mechanisms")
#     print("Initializing caching layer")
#     print("Setting up cache invalidation")
#     print("Configuring cache expiration")
#     print("Initializing search functionality")
#     print("Setting up indexing")
#     print("Configuring search parameters")
#     print("Initializing reporting system")
#     print("Setting up report generation")
#     print("Configuring report scheduling")
#     print("Initializing dashboard")
#     print("Setting up visualization")
#     print("Configuring charts and graphs")
#     print("Initializing export functionality")
#     print("Setting up file formats")
#     print("Configuring export parameters")
#     print("Initializing import functionality")
#     print("Setting up data parsing")
#     print("Configuring import validation")
#     print("Initializing integration layer")
#     print("Setting up API endpoints")
#     print("Configuring API authentication")
#     print("Initializing webhook system")
#     print("Setting up event processing")
#     print("Configuring event handlers")
#     print("Initializing queue system")
#     print("Setting up message processing")
#     print("Configuring queue parameters")
#     print("Initializing workflow engine")
#     print("Setting up process definitions")
#     print("Configuring workflow parameters")
#     print("Initializing business rules")
#     print("Setting up rule engine")
#     print("Configuring rule parameters")
#     print("Initializing decision trees")
#     print("Setting up decision logic")
#     print("Configuring decision parameters")
#     print("Initializing machine learning")
#     print("Setting up ML models")
#     print("Configuring ML parameters")
#     print("Initializing AI components")
#     print("Setting up neural networks")
#     print("Configuring AI parameters")
#     print("Initializing data science pipeline")
#     print("Setting up data preprocessing")
#     print("Configuring feature engineering")
#     print("Initializing model training")
#     print("Setting up model validation")
#     print("Configuring model deployment")
#     print("Initializing prediction system")
#     print("Setting up prediction endpoints")
#     print("Configuring prediction parameters")
#     print("Initializing recommendation engine")
#     print("Setting up recommendation algorithms")
#     print("Configuring recommendation parameters")
#     print("Initializing personalization")
#     print("Setting up user profiling")
#     print("Configuring personalization rules")
#     print("Initializing A/B testing")
#     print("Setting up experiment design")
#     print("Configuring test parameters")
#     print("Initializing analytics")
#     print("Setting up data collection")
#     print("Configuring analytics parameters")
#     print("Initializing tracking system")
#     print("Setting up event tracking")
#     print("Configuring tracking parameters")
#     print("Finalizing initialization")
#     print("Completed extremely long function")
#     return "Function completed successfully"

# # DEEPLY NESTED CONDITIONAL LOGIC
# def deeply_nested_conditional_logic(user_data, system_config, permissions, settings):
#     """Deeply nested conditional logic that's hard to follow"""
#     if user_data:
#         if user_data.get('authenticated'):
#             if user_data.get('role') == 'admin':
#                 if system_config.get('admin_access_enabled'):
#                     if permissions.get('can_modify_system'):
#                         if settings.get('maintenance_mode_disabled'):
#                             if user_data.get('last_login'):
#                                 if user_data['last_login'] > datetime.now() - timedelta(days=30):
#                                     if user_data.get('failed_login_attempts', 0) < 3:
#                                         if user_data.get('account_locked') is False:
#                                             if user_data.get('password_expired') is False:
#                                                 if user_data.get('terms_accepted') is True:
#                                                     if user_data.get('privacy_policy_accepted') is True:
#                                                         if user_data.get('two_factor_enabled') is True:
#                                                             if user_data.get('security_questions_answered') is True:
#                                                                 if user_data.get('email_verified') is True:
#                                                                     if user_data.get('phone_verified') is True:
#                                                                         return {"access": "granted", "level": "full_admin"}
#                                                                     else:
#                                                                         return {"access": "denied", "reason": "phone_not_verified"}
#                                                                 else:
#                                                                     return {"access": "denied", "reason": "email_not_verified"}
#                                                             else:
#                                                                 return {"access": "denied", "reason": "security_questions_not_answered"}
#                                                         else:
#                                                             return {"access": "denied", "reason": "two_factor_not_enabled"}
#                                                     else:
#                                                         return {"access": "denied", "reason": "privacy_policy_not_accepted"}
#                                                 else:
#                                                     return {"access": "denied", "reason": "terms_not_accepted"}
#                                             else:
#                                                 return {"access": "denied", "reason": "password_expired"}
#                                         else:
#                                             return {"access": "denied", "reason": "account_locked"}
#                                     else:
#                                         return {"access": "denied", "reason": "too_many_failed_attempts"}
#                                 else:
#                                     return {"access": "denied", "reason": "last_login_too_old"}
#                             else:
#                                 return {"access": "denied", "reason": "no_last_login"}
#                         else:
#                             return {"access": "denied", "reason": "maintenance_mode_enabled"}
#                     else:
#                         return {"access": "denied", "reason": "insufficient_permissions"}
#                 else:
#                     return {"access": "denied", "reason": "admin_access_disabled"}
#             else:
#                 return {"access": "denied", "reason": "not_admin"}
#         else:
#             return {"access": "denied", "reason": "not_authenticated"}
#     else:
#         return {"access": "denied", "reason": "no_user_data"}

# # MASSIVE GLOBAL VARIABLES
# GLOBAL_CONFIGURATION_MATRIX = {
#     "setting1": "value1", "setting2": "value2", "setting3": "value3", "setting4": "value4",
#     "setting5": "value5", "setting6": "value6", "setting7": "value7", "setting8": "value8",
#     "setting9": "value9", "setting10": "value10", "setting11": "value11", "setting12": "value12"
# }

# GLOBAL_USER_PERMISSIONS = {
#     "admin": True, "user": True, "guest": False, "moderator": True, "superuser": True
# }

# GLOBAL_SYSTEM_STATE = {
#     "initialized": True, "running": True, "healthy": True, "maintenance": False
# }

# # ANTI-PATTERNS AND BAD PRACTICES
# class GodObject:
#     """A god object that does everything - anti-pattern"""
#     def __init__(self):
#         self.user_management = True
#         self.data_processing = True
#         self.file_handling = True
#         self.network_operations = True
#         self.database_operations = True
#         self.security_operations = True
#         self.logging_operations = True
#         self.monitoring_operations = True
#         self.reporting_operations = True
#         self.notification_operations = True
#         self.integration_operations = True
#         self.workflow_operations = True
#         self.business_logic = True
#         self.validation_logic = True
#         self.transformation_logic = True
        
#     def do_everything(self, data):
#         """Method that tries to do everything"""
#         self.validate_user(data)
#         self.process_data(data)
#         self.handle_files(data)
#         self.make_network_calls(data)
#         self.update_database(data)
#         self.check_security(data)
#         self.log_operations(data)
#         self.monitor_performance(data)
#         self.generate_reports(data)
#         self.send_notifications(data)
#         self.handle_integrations(data)
#         self.manage_workflows(data)
#         return "Everything done"
    
#     def validate_user(self, data): pass
#     def process_data(self, data): pass
#     def handle_files(self, data): pass
#     def make_network_calls(self, data): pass
#     def update_database(self, data): pass
#     def check_security(self, data): pass
#     def log_operations(self, data): pass
#     def monitor_performance(self, data): pass
#     def generate_reports(self, data): pass
#     def send_notifications(self, data): pass
#     def handle_integrations(self, data): pass
#     def manage_workflows(self, data): pass

# # MAGIC NUMBERS AND STRINGS
# def function_with_magic_numbers():
#     """Function full of magic numbers and strings"""
#     if random.randint(1, 100) > 75:  # Magic number
#         return "SUCCESS_CODE_200"  # Magic string
#     elif random.randint(1, 100) > 50:  # Magic number
#         return "ERROR_CODE_500"  # Magic string
#     elif random.randint(1, 100) > 25:  # Magic number
#         return "WARNING_CODE_300"  # Magic string
#     else:
#         return "UNKNOWN_CODE_999"  # Magic string

# # Add these to your existing FastAPI routes
# @app.post("/trigger-complex-validation")
# async def trigger_complex_validation():
#     """Endpoint to trigger the ultra complex validation"""
#     try:
#         result = extremely_complex_data_processing_function(
#             [], {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
#         )
#         return result
#     except Exception as e:
#         return {"error": str(e)}

# @app.post("/god-object-operation")
# async def god_object_operation():
#     """Endpoint using the god object anti-pattern"""
#     god = GodObject()
#     result = god.do_everything({"test": "data"})
#     return {"result": result}

# # INSECURE RANDOM USAGE
# import random
# import secrets

# def insecure_token_generation():
#     """Insecure token generation using weak random"""
#     token = ""
#     for i in range(32):
#         token += str(random.randint(0, 9))  # Insecure random usage
#     return token

# def insecure_password_generation():
#     """Insecure password generation"""
#     password = ""
#     chars = "abcdefghijklmnopqrstuvwxyz0123456789"
#     for i in range(8):
#         password += random.choice(chars)  # Insecure random usage
#     return password
# 