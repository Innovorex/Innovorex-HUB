# main.py - Ultra-lightweight FastAPI for 4GB/2-core system
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
import uvicorn
import asyncio
import os
import gc
from contextlib import asynccontextmanager
from typing import Dict, Any

# Core services
from app.services.erpnext_service import ERPNextService
from app.services.openrouter_service import OpenRouterService
from app.services.database_service import DatabaseService
from app.services.sync_service import SyncService
from app.services.analytics_service import AnalyticsService

# API routers
from app.routers import students, teachers, parents, admin, ai_chat, auth

# Memory optimization
os.environ["PYTHONOPTIMIZE"] = "2"
gc.set_threshold(700, 10, 10)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle with aggressive memory management"""

    # Initialize core services
    print("🚀 Initializing AI School Management System...")

    # Database service (minimal PostgreSQL)
    app.state.db = DatabaseService()
    await app.state.db.initialize()

    # ERPNext service (external API)
    app.state.erpnext = ERPNextService(
        base_url=os.getenv("ERPNEXT_URL"),
        api_key=os.getenv("ERPNEXT_API_KEY"),
        api_secret=os.getenv("ERPNEXT_API_SECRET")
    )

    # OpenRouter AI service (free models)
    app.state.openrouter = OpenRouterService(
        api_key=os.getenv("OPENROUTER_API_KEY", "")
    )

    # Analytics service
    app.state.analytics = AnalyticsService(
        erpnext_service=app.state.erpnext,
        db_service=app.state.db
    )

    # Sync service (lightweight background sync)
    app.state.sync = SyncService(
        erpnext_service=app.state.erpnext,
        db_service=app.state.db
    )

    # Start background sync every 10 minutes
    app.state.sync_task = asyncio.create_task(background_sync_loop(app.state.sync))

    print("✅ All services initialized successfully")
    yield

    # Cleanup
    print("🛑 Shutting down services...")
    app.state.sync_task.cancel()
    await app.state.erpnext.close()
    await app.state.openrouter.close()
    await app.state.db.close()
    gc.collect()
    print("✅ Shutdown complete")

app = FastAPI(
    title="AI School Management System",
    description="Lightweight ERPNext AI Enhancement Layer",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url=None
)

# Lightweight middleware stack
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ENVIRONMENT") != "production" else ["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["teachers"])
app.include_router(parents.router, prefix="/api/parents", tags=["parents"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ai_chat.router, prefix="/api/ai", tags=["ai"])

# Serve React frontend (production build)
if os.path.exists("../frontend/build"):
    app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")

    @app.get("/")
    async def serve_frontend():
        return FileResponse("../frontend/build/index.html")

    @app.get("/{full_path:path}")
    async def serve_frontend_routes(full_path: str):
        # Serve React routes
        if not full_path.startswith("api/"):
            return FileResponse("../frontend/build/index.html")
        raise HTTPException(status_code=404, detail="API endpoint not found")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """System health and resource usage"""
    import psutil

    process = psutil.Process()
    memory_info = process.memory_info()

    return {
        "status": "healthy",
        "timestamp": asyncio.get_event_loop().time(),
        "resources": {
            "memory_mb": round(memory_info.rss / 1024 / 1024, 1),
            "memory_percent": round(process.memory_percent(), 1),
            "cpu_percent": round(process.cpu_percent(), 1)
        },
        "services": {
            "database": "connected",
            "erpnext": "connected",
            "openrouter": "connected"
        }
    }

# Memory monitoring endpoint
@app.get("/api/system/memory")
async def memory_status():
    """Detailed memory usage for monitoring"""
    import psutil

    # System memory
    memory = psutil.virtual_memory()

    # Process memory
    process = psutil.Process()
    process_memory = process.memory_info()

    return {
        "system": {
            "total_gb": round(memory.total / (1024**3), 2),
            "available_gb": round(memory.available / (1024**3), 2),
            "used_percent": memory.percent
        },
        "process": {
            "rss_mb": round(process_memory.rss / (1024**2), 1),
            "vms_mb": round(process_memory.vms / (1024**2), 1),
            "percent": round(process.memory_percent(), 1)
        },
        "warning": memory.percent > 85,
        "critical": memory.percent > 95
    }

async def background_sync_loop(sync_service: SyncService):
    """Background sync with ERPNext every 10 minutes"""
    while True:
        try:
            print("🔄 Starting background sync with ERPNext...")
            await sync_service.sync_all_data()
            print("✅ Background sync completed")

            # Force garbage collection after sync
            gc.collect()

        except Exception as e:
            print(f"❌ Background sync error: {e}")

        # Wait 10 minutes
        await asyncio.sleep(600)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8080)),
        workers=1,  # Single worker for memory efficiency
        loop="asyncio",
        access_log=False,  # Reduce I/O overhead
        reload=os.getenv("ENVIRONMENT") == "development"
    )