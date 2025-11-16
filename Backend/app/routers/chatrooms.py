from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List
from datetime import datetime
from bson import ObjectId
import traceback
import logging

from app.database import get_db
from app.models import ChatroomCreate, ChatroomJoin, Chatroom, MessageCreate, Message
from app.utils import verify_clerk_token, get_user_id_from_token, generate_room_code

router = APIRouter()
logger = logging.getLogger(__name__)

# IMPORTANT: Specific routes must be defined BEFORE parameterized routes
# to ensure FastAPI matches them correctly
# FastAPI matches routes in order, so /create must come before /{chatroom_id}

@router.post("/create", response_model=Chatroom, name="create_chatroom")
async def create_chatroom(
    chatroom_data: ChatroomCreate,
    token_data: dict = Depends(verify_clerk_token)
):
    """Create a new chatroom with a unique code"""
    logger.info("Create chatroom endpoint called")
    try:
        clerk_id = get_user_id_from_token(token_data)
        logger.info(f"Extracted clerk_id: {clerk_id}")
        db = get_db()
        
        # Verify user exists - if not, create them (for development)
        # In production, users should be created via Clerk webhooks
        logger.info(f"Checking if user {clerk_id} exists in database...")
        user = await db.users.find_one({"clerk_id": clerk_id})
        logger.info(f"User lookup result: {'Found' if user else 'Not found'}")
        
        if not user:
            logger.warning(f"⚠️ User {clerk_id} not found in database, auto-creating user...")
            logger.info(f"Token data keys: {list(token_data.keys())}")
            logger.info(f"Full token data: {token_data}")
            
            # Try to get user info from token - try multiple fields
            username = (token_data.get("username") or 
                       token_data.get("name") or 
                       token_data.get("given_name") or 
                       token_data.get("first_name") or
                       token_data.get("preferred_username") or
                       "User")
            email = token_data.get("email") or token_data.get("email_address") or f"{clerk_id}@example.com"
            
            # If username is still "User", try to extract from email
            if username == "User" and email and "@" in email:
                username = email.split("@")[0]  # Use email prefix as username
            
            logger.info(f"Creating user with email: {email}, username: {username}")
            
            # Create user in database
            user_doc = {
                "clerk_id": clerk_id,
                "email": email,
                "username": username,
                "avatar_url": token_data.get("picture") or token_data.get("image_url") or None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            logger.info(f"User document to insert: {user_doc}")
            
            try:
                result = await db.users.insert_one(user_doc)
                inserted_id = str(result.inserted_id)
                user = user_doc
                logger.info(f"✅ SUCCESS: Auto-created user {clerk_id} in database with ID: {inserted_id}")
                
                # Verify it was actually inserted
                verify_user = await db.users.find_one({"_id": result.inserted_id})
                if verify_user:
                    logger.info(f"✅ VERIFIED: User exists in database after insertion")
                else:
                    logger.error(f"❌ VERIFICATION FAILED: User not found after insertion!")
                    
            except Exception as e:
                logger.error(f"❌ FAILED to create user: {str(e)}")
                logger.error(f"Error type: {type(e).__name__}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
        else:
            logger.info(f"✅ User {clerk_id} already exists in database")
        
        # Generate unique room code
        code = generate_room_code()
        while await db.chatrooms.find_one({"code": code}):
            code = generate_room_code()
        
        # Create chatroom
        chatroom_doc = {
            "code": code,
            "name": chatroom_data.name or f"Room {code}",
            "created_by": clerk_id,
            "created_at": datetime.utcnow(),
            "member_count": 0
        }
        
        result = await db.chatrooms.insert_one(chatroom_doc)
        chatroom_id = str(result.inserted_id)
        
        # Add creator as member
        await db.chatroom_members.insert_one({
            "chatroom_id": chatroom_id,
            "user_id": clerk_id,
            "joined_at": datetime.utcnow()
        })
        
        # Update member count
        await db.chatrooms.update_one(
            {"_id": ObjectId(chatroom_id)},
            {"$inc": {"member_count": 1}}
        )
        
        chatroom_doc["id"] = chatroom_id
        chatroom_doc["created_at"] = chatroom_doc["created_at"].isoformat()
        
        return Chatroom(**chatroom_doc)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating chatroom: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create chatroom: {str(e)}")

@router.post("/join", response_model=Chatroom)
async def join_chatroom(
    join_data: ChatroomJoin,
    token_data: dict = Depends(verify_clerk_token)
):
    """Join a chatroom using a code"""
    try:
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        # Verify user exists - if not, create them (for development)
        user = await db.users.find_one({"clerk_id": clerk_id})
        if not user:
            logger.warning(f"User {clerk_id} not found, auto-creating...")
            logger.info(f"Token data keys: {list(token_data.keys())}")
            username = (token_data.get("username") or 
                       token_data.get("name") or 
                       token_data.get("given_name") or 
                       token_data.get("first_name") or
                       token_data.get("preferred_username") or
                       "User")
            email = token_data.get("email") or token_data.get("email_address") or f"{clerk_id}@example.com"
            
            # If username is still "User", try to extract from email
            if username == "User" and email and "@" in email:
                username = email.split("@")[0]  # Use email prefix as username
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
                logger.info(f"✅ Auto-created user {clerk_id} in database with ID: {result.inserted_id}")
            except Exception as e:
                logger.error(f"❌ Failed to create user: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
        
        # Find chatroom by code
        chatroom = await db.chatrooms.find_one({"code": join_data.code.upper()})
        if not chatroom:
            raise HTTPException(status_code=404, detail="Chatroom not found")
        
        chatroom_id = str(chatroom["_id"])
        
        # Check if user is already a member
        existing_member = await db.chatroom_members.find_one({
            "chatroom_id": chatroom_id,
            "user_id": clerk_id
        })
        
        if not existing_member:
            # Add user as member
            await db.chatroom_members.insert_one({
                "chatroom_id": chatroom_id,
                "user_id": clerk_id,
                "joined_at": datetime.utcnow()
            })
            
            # Update member count
            await db.chatrooms.update_one(
                {"_id": ObjectId(chatroom_id)},
                {"$inc": {"member_count": 1}}
            )
        
        # Return chatroom
        chatroom["id"] = chatroom_id
        chatroom["created_at"] = chatroom["created_at"].isoformat()
        if isinstance(chatroom.get("created_at"), datetime):
            chatroom["created_at"] = chatroom["created_at"].isoformat()
        
        return Chatroom(**chatroom)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join chatroom: {str(e)}")

@router.get("/my-rooms", response_model=List[Chatroom])
async def get_my_chatrooms(token_data: dict = Depends(verify_clerk_token)):
    """Get all chatrooms the user is a member of"""
    try:
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        # Get all chatrooms user is a member of
        member_records = await db.chatroom_members.find({"user_id": clerk_id}).to_list(None)
        chatroom_ids = [ObjectId(m["chatroom_id"]) for m in member_records]
        
        if not chatroom_ids:
            return []
        
        # Get chatroom details
        chatrooms = await db.chatrooms.find({"_id": {"$in": chatroom_ids}}).to_list(None)
        
        # Format response
        result = []
        for chatroom in chatrooms:
            chatroom["id"] = str(chatroom["_id"])
            del chatroom["_id"]
            if isinstance(chatroom.get("created_at"), datetime):
                chatroom["created_at"] = chatroom["created_at"].isoformat()
            result.append(Chatroom(**chatroom))
        
        return result
    
    except Exception as e:
        logger.error(f"Error getting chatrooms: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get chatrooms: {str(e)}")

@router.get("/{chatroom_id}/messages")
async def get_messages(
    chatroom_id: str,
    token_data: dict = Depends(verify_clerk_token)
):
    """Get messages from a chatroom"""
    try:
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        # Verify user is a member
        member = await db.chatroom_members.find_one({
            "chatroom_id": chatroom_id,
            "user_id": clerk_id
        })
        
        if not member:
            raise HTTPException(status_code=403, detail="You are not a member of this chatroom")
        
        # Get messages
        messages = await db.messages.find(
            {"chatroom_id": chatroom_id}
        ).sort("created_at", 1).to_list(None)
        
        # Format response
        result = []
        for msg in messages:
            msg["id"] = str(msg["_id"])
            del msg["_id"]
            
            # Ensure sender_username is populated - look up from users table if missing
            sender_username = msg.get("sender_username")
            if not sender_username or sender_username == "Unknown" or sender_username == "User":
                sender_id = msg.get("sender_id")
                if sender_id:
                    user = await db.users.find_one({"clerk_id": sender_id})
                    if user:
                        username = user.get("username")
                        if username and username != "User" and username != "Unknown":
                            sender_username = username
                        else:
                            # Try to get from email
                            email = user.get("email", "")
                            if email and "@" in email:
                                sender_username = email.split("@")[0]
                            else:
                                sender_username = f"User_{sender_id[-8:]}" if sender_id else "Unknown"
                    else:
                        sender_username = f"User_{sender_id[-8:]}" if sender_id else "Unknown"
                else:
                    sender_username = "Unknown"
            
            msg["sender_username"] = sender_username
            
            # Ensure created_at is in ISO format string with Z for UTC
            created_at = msg.get("created_at")
            if isinstance(created_at, datetime):
                msg["created_at"] = created_at.isoformat() + "Z"
            elif created_at:
                # If it's already a string, ensure it has Z suffix
                if not created_at.endswith("Z") and not created_at.endswith("+00:00"):
                    try:
                        # Try to parse and reformat
                        dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                        msg["created_at"] = dt.isoformat() + "Z"
                    except:
                        # If invalid, use current time
                        msg["created_at"] = datetime.utcnow().isoformat() + "Z"
            else:
                # If missing, use current time
                msg["created_at"] = datetime.utcnow().isoformat() + "Z"
            
            # Create Message object and serialize with aliases (camelCase)
            try:
                message_obj = Message(**msg)
                # Use model_dump with by_alias=True to get camelCase field names
                message_dict = message_obj.model_dump(by_alias=True, mode='json')
                result.append(message_dict)
            except Exception as e:
                logger.error(f"Error creating message object: {str(e)}")
                # Fallback: manually convert field names
                msg_dict = {
                    "id": msg.get("id"),
                    "chatroomId": msg.get("chatroom_id"),
                    "senderId": msg.get("sender_id"),
                    "senderUsername": msg.get("sender_username"),
                    "content": msg.get("content"),
                    "createdAt": msg.get("created_at")
                }
                result.append(msg_dict)
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")

@router.post("/{chatroom_id}/messages")
async def send_message(
    chatroom_id: str,
    message_data: MessageCreate,
    token_data: dict = Depends(verify_clerk_token)
):
    """Send a message to a chatroom"""
    try:
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        # Verify user is a member
        member = await db.chatroom_members.find_one({
            "chatroom_id": chatroom_id,
            "user_id": clerk_id
        })
        
        if not member:
            raise HTTPException(status_code=403, detail="You are not a member of this chatroom")
        
        # Get user info - auto-create if doesn't exist
        user = await db.users.find_one({"clerk_id": clerk_id})
        if not user:
            logger.warning(f"User {clerk_id} not found when sending message, auto-creating...")
            # Try multiple fields for username
            username = (token_data.get("username") or 
                       token_data.get("name") or 
                       token_data.get("given_name") or 
                       token_data.get("first_name") or
                       token_data.get("preferred_username") or
                       "User")
            email = token_data.get("email") or token_data.get("email_address") or f"{clerk_id}@example.com"
            
            # If username is still "User", try to extract from email
            if username == "User" and email and "@" in email:
                username = email.split("@")[0]  # Use email prefix as username
            
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
                logger.info(f"✅ Auto-created user {clerk_id} when sending message with ID: {result.inserted_id}, username: {username}")
            except Exception as e:
                logger.error(f"❌ Failed to create user when sending message: {str(e)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                username = email.split("@")[0] if email and "@" in email else "User"
        else:
            # Get username from database, with fallbacks
            username = user.get("username")
            if not username or username == "User" or username == "Unknown":
                # Try to get from email
                email = user.get("email", "")
                if email and "@" in email:
                    username = email.split("@")[0]
                else:
                    username = f"User_{clerk_id[-8:]}"  # Use last 8 chars of clerk_id
            logger.info(f"Using username: {username} for user {clerk_id}")
        
        # Create message
        created_at = datetime.utcnow()
        message_doc = {
            "chatroom_id": chatroom_id,
            "sender_id": clerk_id,
            "sender_username": username,
            "content": message_data.content,
            "created_at": created_at
        }
        
        result = await db.messages.insert_one(message_doc)
        message_id = str(result.inserted_id)
        
        # Format for response - ensure ISO format string
        message_doc["id"] = message_id
        message_doc["created_at"] = created_at.isoformat() + "Z"  # Add Z for UTC
        
        # Create Message object and serialize with aliases (camelCase)
        try:
            message_obj = Message(**message_doc)
            # Use model_dump with by_alias=True to get camelCase field names
            return message_obj.model_dump(by_alias=True, mode='json')
        except Exception as e:
            logger.error(f"Error creating message object: {str(e)}")
            # Fallback: manually convert field names
            return {
                "id": message_doc.get("id"),
                "chatroomId": message_doc.get("chatroom_id"),
                "senderId": message_doc.get("sender_id"),
                "senderUsername": message_doc.get("sender_username"),
                "content": message_doc.get("content"),
                "createdAt": message_doc.get("created_at")
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@router.delete("/{chatroom_id}/messages/{message_id}")
async def delete_message(
    chatroom_id: str,
    message_id: str,
    token_data: dict = Depends(verify_clerk_token)
):
    """Delete a message - only the sender can delete their own message"""
    try:
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        # Verify user is a member
        member = await db.chatroom_members.find_one({
            "chatroom_id": chatroom_id,
            "user_id": clerk_id
        })
        
        if not member:
            raise HTTPException(status_code=403, detail="You are not a member of this chatroom")
        
        # Get message
        message = await db.messages.find_one({"_id": ObjectId(message_id)})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Verify message belongs to this chatroom
        if message.get("chatroom_id") != chatroom_id:
            raise HTTPException(status_code=400, detail="Message does not belong to this chatroom")
        
        # Verify user is the sender
        if message.get("sender_id") != clerk_id:
            raise HTTPException(status_code=403, detail="You can only delete your own messages")
        
        # Delete message
        await db.messages.delete_one({"_id": ObjectId(message_id)})
        
        return JSONResponse(
            status_code=200,
            content={"message": "Message deleted successfully"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete message: {str(e)}")

@router.delete("/{chatroom_id}")
async def delete_chatroom(
    chatroom_id: str,
    token_data: dict = Depends(verify_clerk_token)
):
    """Delete a chatroom - only the creator can delete"""
    try:
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        # Get chatroom
        chatroom = await db.chatrooms.find_one({"_id": ObjectId(chatroom_id)})
        if not chatroom:
            raise HTTPException(status_code=404, detail="Chatroom not found")
        
        # Verify user is the creator
        if chatroom.get("created_by") != clerk_id:
            raise HTTPException(status_code=403, detail="Only the creator can delete this chatroom")
        
        # Delete chatroom and all related data
        await db.chatrooms.delete_one({"_id": ObjectId(chatroom_id)})
        await db.chatroom_members.delete_many({"chatroom_id": chatroom_id})
        await db.messages.delete_many({"chatroom_id": chatroom_id})
        
        logger.info(f"Chatroom {chatroom_id} deleted by {clerk_id}")
        
        return JSONResponse(
            status_code=200,
            content={"message": "Chatroom deleted successfully"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chatroom: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete chatroom: {str(e)}")

# This route must be LAST to avoid matching "create", "join", "my-rooms" as chatroom_id
@router.get("/{chatroom_id}")
async def get_chatroom(
    chatroom_id: str,
    token_data: dict = Depends(verify_clerk_token)
):
    """Get chatroom details"""
    try:
        # Prevent matching specific routes
        if chatroom_id in ["create", "join", "my-rooms"]:
            raise HTTPException(status_code=404, detail="Route not found")
        
        clerk_id = get_user_id_from_token(token_data)
        db = get_db()
        
        # Verify user is a member
        member = await db.chatroom_members.find_one({
            "chatroom_id": chatroom_id,
            "user_id": clerk_id
        })
        
        if not member:
            raise HTTPException(status_code=403, detail="You are not a member of this chatroom")
        
        # Get chatroom
        chatroom = await db.chatrooms.find_one({"_id": ObjectId(chatroom_id)})
        if not chatroom:
            raise HTTPException(status_code=404, detail="Chatroom not found")
        
        chatroom["id"] = str(chatroom["_id"])
        del chatroom["_id"]
        if isinstance(chatroom.get("created_at"), datetime):
            chatroom["created_at"] = chatroom["created_at"].isoformat()
        
        return Chatroom(**chatroom)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chatroom: {str(e)}")

