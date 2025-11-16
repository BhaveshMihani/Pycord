from fastapi import APIRouter, Depends, HTTPException
from app.utils import verify_clerk_token, get_user_id_from_token
from app.database import get_db
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/me")
async def get_current_user(token_data: dict = Depends(verify_clerk_token)):
    """Get current authenticated user - auto-creates if doesn't exist"""
    try:
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        user = await db.users.find_one({"clerk_id": clerk_id})
        if not user:
            # Auto-create user
            logger.warning(f"User {clerk_id} not found in /me endpoint, auto-creating...")
            username = token_data.get("username") or token_data.get("name") or token_data.get("given_name") or "User"
            email = token_data.get("email") or token_data.get("email_address") or f"{clerk_id}@example.com"
            user_doc = {
                "clerk_id": clerk_id,
                "email": email,
                "username": username,
                "avatar_url": token_data.get("picture") or token_data.get("image_url") or None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            try:
                result = await db.users.insert_one(user_doc)
                user = user_doc
                logger.info(f"✅ Auto-created user {clerk_id} in /me endpoint with ID: {result.inserted_id}")
            except Exception as e:
                logger.error(f"❌ Failed to create user in /me endpoint: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
        
        user["id"] = str(user["_id"])
        del user["_id"]
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in /me endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

