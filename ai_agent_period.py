import sys
sys.path.insert(0, r'D:RAG\RAG\lib')
import ollama
import redis
import json
import os
import re
from pymongo import MongoClient
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account
import discord
from discord.ext import commands
import io
import asyncio
from dotenv import load_dotenv
import fitz  # Using PyMuPDF as primary PDF library
import time
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from supabase import create_client, Client

# Load environment
load_dotenv()

# Configuration
GOOGLE_CREDS = os.getenv('GOOGLE_DRIVE_CREDENTIALS_FILE')
FILE_ID = os.getenv('GOOGLE_DRIVE_FILE_ID')
MONGO_URI = os.getenv('MONGO_URI')
MONGO_DB = os.getenv('MONGO_DB', 'angler')
MONGO_COLL = os.getenv('MONGO_COLLECTION', 'Vector')
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASS = os.getenv('REDIS_PASSWORD', '')
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
DISCORD_CHANNEL = int(os.getenv('DISCORD_CHANNEL', 0))
MODEL = os.getenv('EMBEDDING_MODEL', 'nomic-embed-text')  # Ensures 768D embeddings
LANGUAGE_MODEL = os.getenv('LANGUAGE_MODEL', 'mistral')  # Default for chat
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
DOCUMENT_READY = False

# Set Ollama host
OLLAMA_HOST = os.getenv('OLLAMA_HOST', '127.0.0.1:11434')
os.environ['OLLAMA_HOST'] = OLLAMA_HOST
print(f"Using Ollama host: {OLLAMA_HOST}")
print(f"{GOOGLE_CREDS=}, {FILE_ID=}, {MONGO_URI=}, {MONGO_DB=}, {MONGO_COLL=}, {DISCORD_TOKEN=}, {DISCORD_CHANNEL=}, {REDIS_HOST=}, {SUPABASE_URL=}, {SUPABASE_KEY=}")

# Validate environment variables
if not all([GOOGLE_CREDS, FILE_ID, MONGO_URI, MONGO_DB, DISCORD_TOKEN, DISCORD_CHANNEL, REDIS_HOST, SUPABASE_URL, SUPABASE_KEY]):
    raise ValueError("Missing required environment variables")

# Helper function to check Ollama server status
def check_ollama_server():
    try:
        response = requests.get(f"http://{OLLAMA_HOST}/api/tags", timeout=5)
        if response.status_code == 200:
            print(f"Ollama server is running at {OLLAMA_HOST}")
            return True
        else:
            print(f"Ollama server returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"Failed to connect to Ollama server at {OLLAMA_HOST}: {e}")
        return False

# 1. Google Drive download
def download_from_drive(file_id):
    try:
        creds = service_account.Credentials.from_service_account_file(
            GOOGLE_CREDS, scopes=['https://www.googleapis.com/auth/drive']
        )
        service = build('drive', 'v3', credentials=creds)
        
        file_metadata = service.files().get(fileId=file_id).execute()
        file_name = file_metadata.get('name', '')
        mime_type = file_metadata.get('mimeType', '')
        
        print(f"Downloading file: {file_name} (MIME: {mime_type})")
        
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
        else:
            print(f"Unsupported file type: {mime_type}")
            return None
    except Exception as e:
        print(f"Error downloading file: {e}")
        return None

# 1.2. PDF text extraction
def extract_text_from_pdf(pdf_bytes):
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page_num in range(doc.page_count):
            page = doc[page_num]
            text += page.get_text()
            text += "\n\n"
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return None

# 1.3. Improved text splitting
def split_text(text, chunk_size=1000, overlap=200):
    if not text:
        return []
    
    text = text.strip()
    text = ' '.join(text.split())  # Normalize whitespace
    
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

# 1.4. Generate embeddings with retry
def get_embedding(text, max_retries=3, retry_delay=2):
    try:
        text = text.strip()
        if not text:
            return None
        
        for attempt in range(max_retries):
            try:
                if not check_ollama_server():
                    print(f"Ollama server not available, attempt {attempt + 1}/{max_retries}")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        continue
                    return None
                
                response = ollama.embeddings(model=MODEL, prompt=text)
                embedding = response.get('embedding') or response.get('embeddings')
                
                if not embedding:
                    raise ValueError(f"Model '{MODEL}' returned no embedding data")
                
                if len(embedding) != 768:
                    print(f"Warning: Expected 768 dimensions, got {len(embedding)} for model {MODEL}")
                    return embedding
                
                return embedding
            
            except Exception as e:
                print(f"Embedding attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    raise
        return None
    except Exception as e:
        print(f"Error generating embedding after {max_retries} attempts: {e}")
        return None

# 1.5. Store to MongoDB
def store_to_mongo(embeddings_chunks, collection_name=MONGO_COLL):
    client = None
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
        print(f"Stored {successful_inserts} documents to MongoDB")
    except Exception as e:
        print(f"Error storing to MongoDB: {e}")
    finally:
        if client:
            client.close()

# 1.6. Initialize document
async def initialize_document():
    global DOCUMENT_READY
    if DOCUMENT_READY:
        return

    print("Initializing document...")

    text = download_from_drive(FILE_ID)
    if not text:
        print("Failed to download/extract document.")
        return

    print(f"Extracted {len(text)} characters")

    chunks = split_text(text)
    embeddings_chunks = []
    
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        if embedding:
            embeddings_chunks.append((chunk, embedding))
        if (i + 1) % 10 == 0 or i + 1 == len(chunks):
            print(f"Processed {i + 1}/{len(chunks)} chunks")

    print(f"Generated {len(embeddings_chunks)} embeddings")
    store_to_mongo(embeddings_chunks)
    DOCUMENT_READY = True
    print("Document initialization complete!")

# 6. Check search index
def check_search_index(collection_name=MONGO_COLL, index_name='default'):
    client = None
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        collection = db[collection_name]
        
        search_indexes = list(collection.aggregate([{"$listSearchIndexes": {}}]))
        for index in search_indexes:
            if index['name'] == index_name and index['type'] == 'vectorSearch':
                return True
        
        print(f"Vector search index '{index_name}' not found.")
        return False
    except Exception as e:
        print(f"Error checking index: {e}")
        return False
    finally:
        if client:
            client.close()

# 7. Search MongoDB
def search_mongo(query_embedding, collection_name=MONGO_COLL, index_name='default', field_name='embedding', limit=3):
    if not query_embedding:
        return []
    if not check_search_index(collection_name, index_name):
        print(f"Vector search index '{index_name}' not configured.")
        return []
    
    client = None
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB]
        collection = db[collection_name]
        
        pipeline = [
            {
                '$vectorSearch': {
                    'index': index_name,
                    'path': field_name,
                    'queryVector': query_embedding,
                    'numCandidates': 50,
                    'limit': limit
                }
            }
        ]
        results = list(collection.aggregate(pipeline))
        return results
    except Exception as e:
        print(f"Error searching MongoDB: {e}")
        return []
    finally:
        if client:
            client.close()

# 8. Cosine similarity
def cosine_similarity(a, b):
    try:
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x ** 2 for x in a) ** 0.5
        norm_b = sum(x ** 2 for x in b) ** 0.5
        return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0

# 9. Redis storage
def store_to_redis(key, value, ttl=300):
    r = None
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASS, decode_responses=True)
        r.setex(key, ttl, json.dumps(value, default=str))
        print(f"Stored in Redis - Key: {key}, TTL: {ttl}")
    except Exception as e:
        print(f"Error storing to Redis: {e}")
    finally:
        if r:
            r.close()

# 10. Document processing
async def process_document(file_id, query, user_id):
    print(f"Processing query: {query}")
    
    if not DOCUMENT_READY:
        return [{"text": "Document not ready.", "similarity": 0}]
    
    query_embedding = get_embedding(query)
    if not query_embedding:
        return [{"text": "Failed to generate query embedding", "similarity": 0}]
    
    results = search_mongo(query_embedding, limit=3)
    similarities = [
        {"text": r['text'], "similarity": cosine_similarity(query_embedding, r['embedding'])}
        for r in results if 'embedding' in r
    ]
    
    similarities.sort(key=lambda x: x['similarity'], reverse=True)
    
    high_similarities = [s for s in similarities if s['similarity'] > 0.3]
    if high_similarities:
        store_to_redis(f"chat:{user_id}", high_similarities)
    
    return high_similarities if high_similarities else similarities[:3]

# 10.1 Chat response with retry
async def get_chat_response(query, context_chunks=None, user_id=None):
    max_retries = 3
    retry_delay = 2
    try:
        instruction_prompt = (
            "You are a helpful assistant that answers questions based on provided document context. "
            "Use the following context to provide accurate and concise answers. If the answer is not in the context, "
            "state 'The document does not contain this information' and provide a general answer if possible. "
            "Summarize the context and make a clear and concise answer with a clear explanation or evaluation. "
            "Do not mention anything about the context or similarity scores in your final answer.\n\n"
            "Context:\n"
        )
        
        if context_chunks:
            for i, chunk in enumerate(context_chunks, 1):
                similarity = chunk.get('similarity', 0)
                text_preview = chunk['text'][:800] if len(chunk['text']) > 800 else chunk['text']
                instruction_prompt += f"Chunk {i}:\n{text_preview}\n\n"
        else:
            instruction_prompt += "No relevant document chunks found.\n\n"
        
        instruction_prompt += f"User Query: {query}\n\nAnswer:"
        
        for attempt in range(max_retries):
            try:
                if not check_ollama_server():
                    print(f"Ollama server not available, attempt {attempt + 1}/{max_retries}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                        continue
                    return "Ollama server is not available. Please try again later."
                
                print(f"Sending chat request to Ollama at {OLLAMA_HOST}, attempt {attempt + 1}")
                
                response = ollama.chat(
                    model=LANGUAGE_MODEL,
                    messages=[
                        {'role': 'system', 'content': instruction_prompt},
                        {'role': 'user', 'content': query},
                    ],
                    stream=False,
                )
                
                if response and 'message' in response and 'content' in response['message']:
                    answer = response['message']['content'].strip()
                    
                    if user_id:
                        store_to_redis(f"chat:{user_id}", [{"text": answer, "similarity": 0}])
                    
                    return answer if answer else "No response generated by the model."
                else:
                    print(f"Unexpected response structure: {response}")
                    return "Unexpected response from the model."
                    
            except Exception as e:
                print(f"Chat attempt {attempt + 1} failed: {type(e).__name__}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                else:
                    raise
        
        return "Failed to get response after multiple attempts."
        
    except Exception as e:
        print(f"Ollama chat error after {max_retries} attempts: {type(e).__name__}: {e}")
        return "Sorry, I couldn't generate a response due to a server connection issue. Please try again later."

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
                return None

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
                "period_description": description
            }).execute()

            return response.data[0]["period_id"] if response.data else None
        except (ValueError, Exception):
            return None

    def get_periods(self) -> List[Dict]:
        response = self.supabase.table("period_tracking").select("*").eq("patient_id", self.patient_id).execute()
        return response.data

    def average_cycle_length(self) -> Optional[int]:
        periods = sorted(
            [(datetime.fromisoformat(p["start_date"]), p["cycle_length"]) for p in self.get_periods()],
            key=lambda x: x[0]
        )
        if len(periods) < 2:
            return None
        cycles = [(periods[i][0] - periods[i-1][0]).days for i in range(1, len(periods))]
        return sum(cycles) // len(cycles) if cycles else self.cycle_length

    def predict_next_period(self) -> Optional[datetime]:
        periods = self.get_periods()
        if not periods:
            return None
        last_period = max([datetime.fromisoformat(p["start_date"]) for p in periods])
        cycle_length = self.average_cycle_length() or self.cycle_length
        return last_period + timedelta(days=cycle_length)

    def update_predictions(self, period_id: str, predictions: Dict):
        try:
            self.supabase.table("period_tracking").update({
                "predictions": json.dumps(predictions),
                "updated_at": datetime.utcnow().isoformat()
            }).eq("period_id", period_id).eq("patient_id", self.patient_id).execute()
            return True
        except Exception:
            return False

# AI Agent for period tracking
async def process_period_query(query: str, patient_id: str) -> str:
    tracker = PeriodTracker(SUPABASE_URL, SUPABASE_KEY, patient_id)
    
    instruction_prompt = (
        "You are a period tracking AI assistant. Interpret the user's query and provide appropriate responses "
        "based on period tracking data. Use clear, empathetic, and professional language. "
        "Do not mention internal system details or processes.\n\n"
        "User Query: {query}\n\n"
        "Available actions:\n"
        "- Add period: expects start_date (YYYY-MM-DD), optional end_date, flow_intensity (light/medium/heavy), symptoms, description\n"
        "- Get periods: retrieve period history\n"
        "- Predict next period: estimate next period date\n"
        "- Get average cycle length: calculate average cycle duration\n\n"
        "Answer:"
    ).format(query=query)

    try:
        if not check_ollama_server():
            return "Sorry, I'm unable to process your request right now. Please try again later."

        response = ollama.chat(
            model=LANGUAGE_MODEL,
            messages=[
                {'role': 'system', 'content': instruction_prompt},
                {'role': 'user', 'content': query},
            ],
            stream=False
        )

        answer = response['message']['content'].strip() if response and 'message' in response else "No response generated."

        if "add period" in query.lower():
            start_date_match = re.search(r'\d{4}-\d{2}-\d{2}', query)
            start_date = start_date_match.group(0) if start_date_match else None
            flow_intensity = "medium"
            if "light" in query.lower():
                flow_intensity = "light"
            elif "heavy" in query.lower():
                flow_intensity = "heavy"
            
            symptoms = []
            if "symptoms" in query.lower():
                symptoms = [s.strip() for s in query.lower().split("symptoms")[1].split(",") if s.strip()]
            
            if start_date:
                period_id = tracker.add_period(start_date, flow_intensity=flow_intensity, symptoms=symptoms)
                return f"Period added successfully for {start_date}. ID: {period_id}" if period_id else "Failed to add period. Please check the date format (YYYY-MM-DD)."
            else:
                return "Please provide a start date in YYYY-MM-DD format."

        elif "predict next" in query.lower():
            next_period = tracker.predict_next_period()
            return f"Your next period is predicted to start around {next_period.strftime('%Y-%m-%d')}" if next_period else "No period data available to predict."

        elif "history" in query.lower() or "get periods" in query.lower():
            periods = tracker.get_periods()
            if not periods:
                return "No period history found."
            response = "Period History:\n"
            for period in periods[:5]:
                start = datetime.fromisoformat(period['start_date']).strftime('%Y-%m-%d')
                end = datetime.fromisoformat(period['end_date']).strftime('%Y-%m-%d') if period['end_date'] else "N/A"
                response += f"Start: {start}, End: {end}, Flow: {period['flow_intensity']}, Symptoms: {period['symptoms']}\n"
            return response

        elif "average cycle" in query.lower():
            avg_cycle = tracker.average_cycle_length()
            return f"Your average cycle length is {avg_cycle} days." if avg_cycle else "Not enough data to calculate average cycle length."

        return answer

    except Exception as e:
        return f"Error processing request: {str(e)}"

# 11. Discord bot
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')
    if check_ollama_server():
        await initialize_document()
    else:
        print("Ollama server not available, skipping document initialization.")

@bot.command(name='search')
async def search_command(ctx, *, query):
    if ctx.channel.id != DISCORD_CHANNEL:
        return
    
    await ctx.send(f"Searching for: '{query}'...")
    
    if not DOCUMENT_READY:
        await ctx.send("Document not ready. Please wait for initialization to complete.")
        return

    try:
        similarities = await process_document(FILE_ID, query, str(ctx.author.id))
    
        if similarities and similarities[0]['similarity'] > 0.2:
            response = f"**Top Results for: '{query}'**\n\n"
            for i, result in enumerate(similarities[:3], 1):
                similarity_score = result['similarity']
                text_preview = result['text'][:500] + "..." if len(result['text']) > 500 else result['text']
                response += f"**{i}. Match (Similarity: {similarity_score:.3f})**\n{text_preview}\n\n"
        else:
            response = "No results found with sufficient similarity."
        
        if len(response) > 2000:
            response = response[:1997] + "..."
        
        await ctx.send(response)
        
    except Exception as e:
        await ctx.send(f"Error processing request: {str(e)}")

@bot.command(name='chat')
async def chat_command(ctx, *, query):
    if ctx.channel.id != DISCORD_CHANNEL:
        return
    
    await ctx.send(f"Processing query: '{query}'...")
    
    if not DOCUMENT_READY:
        await ctx.send("Document not ready. Please wait for initialization to complete.")
        return

    try:
        similarities = await process_document(FILE_ID, query, str(ctx.author.id))
        ollama_response = await get_chat_response(query, similarities[:3], str(ctx.author.id))
        
        if len(ollama_response) > 2000:
            for i in range(0, len(ollama_response), 2000):
                chunk = ollama_response[i:i+2000]
                await ctx.send(chunk)
        else:
            await ctx.send(ollama_response)
        
    except Exception as e:
        await ctx.send(f"Error processing chat request: {str(e)}")

@bot.command(name='period')
async def period_command(ctx, *, query):
    if ctx.channel.id != DISCORD_CHANNEL:
        return

    await ctx.send(f"Processing period tracking request: '{query}'...")

    try:
        response = await process_period_query(query, str(ctx.author.id))
        
        if len(response) > 2000:
            for i in range(0, len(response), 2000):
                await ctx.send(response[i:i+2000])
        else:
            await ctx.send(response)
            
    except Exception as e:
        await ctx.send(f"Error processing period tracking request: {str(e)}")

@bot.command(name='info')
async def info_command(ctx):
    if ctx.channel.id != DISCORD_CHANNEL:
        return
    
    status = "Ready" if DOCUMENT_READY else "Not Ready"
    server_status = "Online" if check_ollama_server() else "Offline"
    
    await ctx.send(
        f"**PDF Search and Period Tracking Bot**\n"
        f"Document Status: {status}\n"
        f"Ollama Server: {server_status}\n"
        f"Commands: `!search <query>`, `!chat <query>`, `!period <query>`, `!info`, `!stop`\n"
        f"Using {MODEL} for embeddings and {LANGUAGE_MODEL} for chat\n"
        f"Period Examples:\n"
        f"- `!period add period 2025-06-01 heavy symptoms cramps, fatigue`\n"
        f"- `!period predict next`\n"
        f"- `!period get periods`\n"
        f"- `!period average cycle`"
    )

@bot.command(name='stop')
async def stop_command(ctx):
    if ctx.channel.id != DISCORD_CHANNEL:
        return
    
    await ctx.send("Shutting down the bot...")
    try:
        await bot.close()
        print(f"Bot stopped by {ctx.author.name}")
    except Exception as e:
        await ctx.send(f"Error stopping the bot: {str(e)}")

# Main
if __name__ == "__main__":
    try:
        bot.run(DISCORD_TOKEN)
    except KeyboardInterrupt:
        print("\nBot stopped by user")
    except Exception as e:
        print(f"Bot crashed: {e}")