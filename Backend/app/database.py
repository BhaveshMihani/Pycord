from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None

database = Database()

async def init_db():
    """Initialize database connection"""
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "pycord")
    
    # Log the connection attempt (but hide password)
    safe_url = mongodb_url.split('@')[-1] if '@' in mongodb_url else mongodb_url
    print(f"🔌 Attempting to connect to MongoDB: {safe_url}")
    print(f"📁 Database name: {db_name}")
    
    try:
        database.client = AsyncIOMotorClient(
            mongodb_url,
            serverSelectionTimeoutMS=10000  # 10 second timeout
        )
        database.db = database.client[db_name]
        
        # Test connection
        await database.client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {db_name}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        print(f"⚠️  Warning: Could not connect to MongoDB")
        print(f"   Error: {str(e)}")
        print("   The server will start, but database operations will fail.")
        print("   To fix: Check MONGODB_URL in .env file and ensure MongoDB is accessible")
        # Don't raise - allow server to start without DB for development
        # In production, you might want to raise here

async def close_db():
    """Close database connection"""
    if database.client:
        database.client.close()
        print("✅ MongoDB connection closed")

async def create_indexes():
    """Create database indexes for better performance"""
    db = database.db
    
    # Users collection indexes
    await db.users.create_index("clerk_id", unique=True)
    await db.users.create_index("email")
    
    # Chatrooms collection indexes
    await db.chatrooms.create_index("code", unique=True)
    await db.chatrooms.create_index("created_at")
    
    # Messages collection indexes
    await db.messages.create_index("chatroom_id")
    await db.messages.create_index("created_at")
    await db.messages.create_index([("chatroom_id", 1), ("created_at", 1)])
    
    # Chatroom members index
    await db.chatroom_members.create_index([("chatroom_id", 1), ("user_id", 1)], unique=True)
    await db.chatroom_members.create_index("user_id")
    
    print("✅ Database indexes created")

def get_db():
    """Get database instance"""
    if database.db is None:
        raise RuntimeError(
            "Database not initialized. Please ensure MongoDB is running "
            "and MONGODB_URL is correctly configured in your .env file."
        )
    return database.db

