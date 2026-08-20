from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

from app.database import init_db, close_db
from app.routers import webhooks, chatrooms, auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title="Pycord Backend API",
    description="Backend API for Pycord chat application",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
origins = ["http://localhost:5173", "http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(chatrooms.router, prefix="/api/chatrooms", tags=["chatrooms"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

from fastapi.responses import FileResponse
from pathlib import Path

# --- Serve React Frontend ---
# Resolve path to frontend/dist
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    # Ignore API routes - let them be handled by FastAPI (or return 404 if invalid)
    if full_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="API route not found")
        
    # If frontend hasn't been built yet (e.g. local dev), return basic message
    if not frontend_dist.exists():
        if full_path == "":
            return {"message": "Pycord Backend API (Frontend not built yet)", "status": "running"}
        raise HTTPException(status_code=404, detail="Not Found")
        
    # Check if the requested file exists in dist (e.g., /assets/..., /vite.svg)
    requested_file = frontend_dist / full_path
    if full_path and requested_file.is_file():
        return FileResponse(requested_file)
        
    # For any other route (like /login, /room/123), return index.html for React Router
    return FileResponse(frontend_dist / "index.html")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/health")
async def health_check_post():
    """Allow POST for health checks (some monitoring tools use POST)"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )

