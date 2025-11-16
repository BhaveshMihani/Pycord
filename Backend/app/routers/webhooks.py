from fastapi import APIRouter, Request, HTTPException, Header
from fastapi.responses import JSONResponse
import hmac
import hashlib
import os
from datetime import datetime
from app.database import get_db
from app.models import User
from bson import ObjectId
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

async def verify_webhook_signature(
    body: bytes,
    svix_id: str,
    svix_timestamp: str,
    svix_signature: str
) -> bool:
    """Verify Clerk webhook signature using Svix format"""
    webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
    if not webhook_secret:
        # In development with ngrok, you might want to skip verification temporarily
        # For production, always verify signatures
        logger.warning("⚠️  WARNING: CLERK_WEBHOOK_SECRET not set - skipping webhook signature verification")
        logger.warning("   This is OK for development, but add the secret for production!")
        return True  # Skip verification in development if no secret
    
    if not svix_id or not svix_timestamp or not svix_signature:
        logger.error("Missing required signature headers")
        return False
    
    # Remove any whitespace from secret
    webhook_secret = webhook_secret.strip()
    
    # Svix secret format: whsec_... - we need to use it as-is
    # But if it starts with whsec_, we might need to handle it differently
    # Actually, Svix expects the full secret including whsec_ prefix
    
    body_str = body.decode('utf-8')
    
    # Clerk uses Svix for webhooks - verify signature
    # Format: v1=<signature> (or multiple signatures separated by spaces)
    signed_payload = f"{svix_id}.{svix_timestamp}.{body_str}"
    
    logger.debug(f"Signed payload length: {len(signed_payload)}")
    logger.debug(f"Secret length: {len(webhook_secret)}, starts with whsec_: {webhook_secret.startswith('whsec_')}")
    
    expected_signature = hmac.new(
        webhook_secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Svix signature format: v1=<signature>
    expected_sig_header = f"v1={expected_signature}"
    
    logger.debug(f"Expected signature header: {expected_sig_header[:50]}...")
    logger.debug(f"Received signature header: {svix_signature[:50]}...")
    
    # Svix can send multiple signatures separated by spaces
    # Check if any of them match
    signatures = svix_signature.split()
    for sig in signatures:
        if sig.startswith("v1="):
            if hmac.compare_digest(expected_sig_header, sig):
                logger.info("✅ Signature matched!")
                return True
            else:
                logger.debug(f"Signature mismatch: expected {expected_sig_header[:30]}..., got {sig[:30]}...")
    
    logger.error("❌ No matching signature found")
    return False

@router.post("/clerk")
async def clerk_webhook(
    request: Request,
    svix_id: str = Header(None, alias="svix-id"),
    svix_timestamp: str = Header(None, alias="svix-timestamp"),
    svix_signature: str = Header(None, alias="svix-signature")
):
    """Handle Clerk webhook events"""
    logger.info("🔔 Webhook received! Processing Clerk webhook...")
    logger.info(f"Headers - svix-id: {svix_id}, svix-timestamp: {svix_timestamp}, svix-signature: {'present' if svix_signature else 'missing'}")
    
    try:
        # Get request body once
        body = await request.body()
        logger.info(f"Webhook body length: {len(body)} bytes")
        
        # Verify webhook signature
        webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
        skip_verification = os.getenv("SKIP_WEBHOOK_VERIFICATION", "false").lower().strip() == "true"
        
        logger.info(f"Skip verification check: SKIP_WEBHOOK_VERIFICATION={os.getenv('SKIP_WEBHOOK_VERIFICATION', 'not set')}, parsed={skip_verification}")
        
        if skip_verification:
            # Explicitly skip verification if flag is set
            logger.warning("⚠️  SKIP_WEBHOOK_VERIFICATION=true - skipping signature verification (development mode)")
        elif webhook_secret:
            # Only verify if secret is set and skip flag is not set
            logger.info(f"Verifying signature with secret (length: {len(webhook_secret)}, starts with whsec_: {webhook_secret.startswith('whsec_')})")
            signature_valid = await verify_webhook_signature(body, svix_id or "", svix_timestamp or "", svix_signature or "")
            if not signature_valid:
                logger.error("❌ Invalid webhook signature!")
                logger.error(f"Secret is set: {bool(webhook_secret)}")
                logger.error(f"Secret preview: {webhook_secret[:10]}...{webhook_secret[-5:] if len(webhook_secret) > 15 else ''}")
                logger.error(f"svix-id: {svix_id}, svix-timestamp: {svix_timestamp}, signature present: {bool(svix_signature)}")
                logger.error("💡 TIP: To skip verification for development, add SKIP_WEBHOOK_VERIFICATION=true to .env")
                logger.error("💡 TIP: Make sure CLERK_WEBHOOK_SECRET in .env matches the Signing Secret from Clerk Dashboard")
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
            logger.info("✅ Webhook signature verified")
        else:
            logger.warning("⚠️  CLERK_WEBHOOK_SECRET not set - skipping signature verification (OK for development)")
        
        # Parse webhook data
        import json
        webhook_data = json.loads(body.decode('utf-8'))
        logger.info(f"Webhook data: {json.dumps(webhook_data, indent=2)}")
        
        event_type = webhook_data.get("type")
        event_data = webhook_data.get("data", {})
        
        logger.info(f"📨 Event type: {event_type}")
        logger.info(f"Event data keys: {list(event_data.keys())}")
        
        db = get_db()
        
        if event_type == "user.created":
            logger.info("👤 Processing user.created event...")
            
            clerk_id = event_data.get("id")
            email_addresses = event_data.get("email_addresses", [])
            email = email_addresses[0].get("email_address", "") if email_addresses else ""
            
            # Try multiple fields for username
            username = (event_data.get("username") or 
                        event_data.get("first_name") or 
                        event_data.get("last_name") or
                        event_data.get("name") or
                        "User")
            
            # If username is still "User", try to extract from email
            if username == "User" and email and "@" in email:
                username = email.split("@")[0]  # Use email prefix as username
            
            # If still "User", use first_name + last_name
            if username == "User":
                first_name = event_data.get("first_name", "")
                last_name = event_data.get("last_name", "")
                if first_name or last_name:
                    username = f"{first_name} {last_name}".strip() or "User"
            
            avatar_url = event_data.get("image_url")
            
            logger.info(f"Creating user - clerk_id: {clerk_id}, email: {email}, username: {username}")
            
            # Create user in MongoDB
            user_doc = {
                "clerk_id": clerk_id,
                "email": email if email else f"{clerk_id}@example.com",
                "username": username,
                "avatar_url": avatar_url,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            logger.info(f"User document: {user_doc}")
            
            try:
                result = await db.users.insert_one(user_doc)
                inserted_id = str(result.inserted_id)
                logger.info(f"✅ SUCCESS: User created in MongoDB with ID: {inserted_id}")
                
                # Verify insertion
                verify_user = await db.users.find_one({"_id": result.inserted_id})
                if verify_user:
                    logger.info(f"✅ VERIFIED: User exists in database after insertion")
                else:
                    logger.error(f"❌ VERIFICATION FAILED: User not found after insertion!")
                
                return JSONResponse(
                    status_code=200,
                    content={"message": "User created", "user_id": inserted_id}
                )
            except Exception as e:
                logger.error(f"❌ FAILED to insert user: {str(e)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                raise
        
        elif event_type == "user.updated":
            # Update user in MongoDB
            clerk_id = event_data.get("id")
            update_doc = {
                "email": event_data.get("email_addresses", [{}])[0].get("email_address"),
                "username": event_data.get("username") or event_data.get("first_name", "User"),
                "avatar_url": event_data.get("image_url"),
                "updated_at": datetime.utcnow()
            }
            
            # Remove None values
            update_doc = {k: v for k, v in update_doc.items() if v is not None}
            
            result = await db.users.update_one(
                {"clerk_id": clerk_id},
                {"$set": update_doc}
            )
            
            return JSONResponse(
                status_code=200,
                content={"message": "User updated", "modified_count": result.modified_count}
            )
        
        elif event_type == "user.deleted":
            # Delete user from MongoDB
            clerk_id = event_data.get("id")
            
            # Delete user and related data
            await db.users.delete_one({"clerk_id": clerk_id})
            await db.chatroom_members.delete_many({"user_id": clerk_id})
            
            return JSONResponse(
                status_code=200,
                content={"message": "User deleted"}
            )
        
        else:
            return JSONResponse(
                status_code=200,
                content={"message": f"Event {event_type} received but not handled"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Webhook error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

@router.get("/clerk/test")
async def test_webhook_endpoint():
    """Test endpoint to verify webhook URL is accessible"""
    return JSONResponse(
        status_code=200,
        content={
            "message": "Webhook endpoint is accessible",
            "endpoint": "/api/webhooks/clerk",
            "method": "POST",
            "note": "This is a test endpoint. The actual webhook is at POST /api/webhooks/clerk"
        }
    )

