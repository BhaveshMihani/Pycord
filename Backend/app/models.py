from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class User(BaseModel):
    id: Optional[str] = None
    clerk_id: str
    email: EmailStr
    username: str
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

# Chatroom Models
class ChatroomCreate(BaseModel):
    name: Optional[str] = None

class ChatroomJoin(BaseModel):
    code: str

class Chatroom(BaseModel):
    id: Optional[str] = None
    code: str
    name: Optional[str] = None
    created_by: str
    created_at: Optional[datetime] = None
    member_count: Optional[int] = 0

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class ChatroomMember(BaseModel):
    id: Optional[str] = None
    chatroom_id: str
    user_id: str
    joined_at: Optional[datetime] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

# Message Models
class MessageCreate(BaseModel):
    content: str
    chatroom_id: str

class Message(BaseModel):
    id: Optional[str] = None
    chatroom_id: str = Field(..., alias="chatroomId")
    sender_id: str = Field(..., alias="senderId")
    sender_username: Optional[str] = Field(None, alias="senderUsername")
    content: str
    created_at: Optional[datetime] = Field(None, alias="createdAt")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        allow_population_by_field_name = True

# Webhook Models
class ClerkWebhookEvent(BaseModel):
    type: str
    data: dict

