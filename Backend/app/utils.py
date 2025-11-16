import secrets
import string
from typing import Optional
from fastapi import Header, HTTPException, status
import jwt
import os

def generate_room_code(length: int = 6) -> str:
    """Generate a random alphanumeric room code"""
    characters = string.ascii_uppercase + string.digits
    # Exclude confusing characters
    characters = characters.replace('0', '').replace('O', '').replace('I', '').replace('1', '')
    return ''.join(secrets.choice(characters) for _ in range(length))

async def verify_clerk_token(authorization: Optional[str] = Header(None)) -> dict:
    """Verify Clerk JWT token and return user info
    
    Note: This is a simplified implementation for development.
    For production, you should:
    1. Use Clerk's backend SDK (clerk-sdk-python)
    2. Or verify tokens against Clerk's public keys (RS256)
    3. Or use Clerk's verifyToken API endpoint
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    try:
        # Extract token from "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        token = authorization.replace("Bearer ", "").strip()
        
        # For development: decode without verification
        # IMPORTANT: In production, you MUST verify the token signature
        # Clerk tokens use RS256 and should be verified against Clerk's public keys
        # or using Clerk's verifyToken API endpoint
        
        # Decode without verification (development only)
        decoded = jwt.decode(
            token,
            options={"verify_signature": False}
        )
        
        # Basic validation - check if token has required fields
        if not decoded.get("sub") and not decoded.get("user_id") and not decoded.get("id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user identifier"
            )
        
        return decoded
        
    except jwt.DecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format: {str(e)}"
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )

def get_user_id_from_token(token_data: dict) -> str:
    """Extract user ID from decoded token"""
    # Clerk token structure: typically uses "sub" for subject/user ID
    return token_data.get("sub") or token_data.get("user_id") or token_data.get("id") or ""

