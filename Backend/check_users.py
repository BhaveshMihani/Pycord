"""Simple script to check users in MongoDB"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_users():
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "pycord")
    
    client = AsyncIOMotorClient(mongodb_url)
    db = client[db_name]
    
    try:
        count = await db.users.count_documents({})
        print(f"\nTotal users in database: {count}\n")
        
        if count > 0:
            users = await db.users.find({}).to_list(10)
            print("Users found:")
            for u in users:
                print(f"  - Username: {u.get('username', 'N/A')}")
                print(f"    Clerk ID: {u.get('clerk_id', 'N/A')}")
                print(f"    Email: {u.get('email', 'N/A')}")
                print(f"    Created: {u.get('created_at', 'N/A')}")
                print()
        else:
            print("No users found in database")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_users())

