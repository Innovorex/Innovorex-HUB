# Resource-Optimized Technical Architecture
## AI-Enabled School Management System - 4GB RAM / 2-Core CPU

### 🎯 Resource Constraint Overview

#### Hardware Specifications
```yaml
Target Environment:
  RAM: 4GB total system memory
  CPU: 2 cores (likely Intel i3 or equivalent)
  Storage: 256GB SSD (assumed)
  Network: Standard broadband (10-50 Mbps)

Resource Allocation Strategy:
  ERPNext: 2GB RAM, 1.2 CPU cores
  AI System (API Gateway): 1GB RAM, 0.3 CPU cores
  PostgreSQL: 512MB RAM, 0.2 CPU cores
  OS + Services: 512MB RAM, 0.3 CPU cores

Note: AI processing handled by OpenRouter API (external),
saving ~1GB RAM previously allocated for local AI models
```

#### Architectural Principles for Low Resources
- **Microservices → Monolithic**: Single FastAPI application to reduce overhead
- **Event-driven → Polling**: Reduce real-time complexity, use scheduled sync
- **Local AI → External API**: Use OpenRouter free models instead of hosting AI locally
- **Multiple databases → Single PostgreSQL**: Unified data storage
- **Real-time → Near-real-time**: 5-15 minute sync intervals acceptable

### 🏗️ Optimized System Architecture

#### Simplified Architecture Diagram
```yaml
┌─────────────────────────────────────────────────────────────┐
│                    Single Server (4GB/2-Core)               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│  │   ERPNext       │  │         AI Enhancement System       │ │
│  │   (1.5GB/1CPU)  │  │         (1.5GB/0.5CPU)            │ │
│  │                 │  │  ┌─────────────────────────────────┐ │ │
│  │ • Student Data  │◄─┤  │      FastAPI Backend           │ │ │
│  │ • Course Info   │  │  │  • Lightweight AI Models       │ │ │
│  │ • Assessments   │  │  │  • Data Sync Service           │ │ │
│  │ • Attendance    │  │  │  • API Gateway                 │ │ │
│  │ • Schedules     │  │  │  • Caching Layer               │ │ │
│  └─────────────────┘  │  └─────────────────────────────────┘ │ │
│                       │  ┌─────────────────────────────────┐ │ │
│                       │  │     PostgreSQL Database        │ │ │
│                       │  │  • AI Insights Cache           │ │ │
│                       │  │  • Session Data                │ │ │
│                       │  │  • Analytics                   │ │ │
│                       │  └─────────────────────────────────┘ │ │
│                       │  ┌─────────────────────────────────┐ │ │
│                       │  │      Frontend (SPA)            │ │ │
│                       │  │  • React (production build)    │ │ │
│                       │  │  • Served by FastAPI           │ │ │
│                       │  │  • Aggressive caching          │ │ │
│                       │  └─────────────────────────────────┘ │ │
│                       └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              OS + Services (1GB/0.5CPU)                     │
└─────────────────────────────────────────────────────────────┘
```

### 💾 Memory-Optimized Components

#### FastAPI Backend (Resource-Optimized)
```python
# main.py - Ultra-lightweight FastAPI setup
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
import asyncio
from contextlib import asynccontextmanager
import gc
import os

# Memory optimization settings
os.environ["PYTHONOPTIMIZE"] = "2"  # Remove docstrings and debug info
gc.set_threshold(700, 10, 10)  # Aggressive garbage collection

# Lightweight AI components
from .ai.lightweight_models import LightweightTutor, SimpleAnalytics
from .sync.erpnext_sync import ERPNextSyncService
from .database.connection import get_db_pool
from .cache.memory_cache import MemoryCache

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with memory optimization"""
    # Startup
    app.state.db_pool = await get_db_pool(max_connections=5)  # Limited connections
    app.state.cache = MemoryCache(max_size_mb=100)  # 100MB cache
    app.state.ai_tutor = LightweightTutor()
    app.state.analytics = SimpleAnalytics()
    app.state.sync_service = ERPNextSyncService()

    # Start background sync (every 10 minutes instead of real-time)
    app.state.sync_task = asyncio.create_task(
        periodic_sync(app.state.sync_service)
    )

    yield

    # Shutdown
    app.state.sync_task.cancel()
    await app.state.db_pool.close()
    gc.collect()

app = FastAPI(
    title="AI School Management System",
    description="Resource-Optimized for 4GB RAM / 2-Core CPU",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,  # Disable docs in production to save memory
    redoc_url=None
)

# Memory-efficient middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Serve React frontend
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

async def periodic_sync(sync_service: ERPNextSyncService):
    """Background sync every 10 minutes instead of real-time"""
    while True:
        try:
            await sync_service.sync_all_data()
            gc.collect()  # Clean up after sync
        except Exception as e:
            print(f"Sync error: {e}")
        await asyncio.sleep(600)  # 10 minutes

# Lightweight API endpoints
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "memory_usage": get_memory_usage()}

def get_memory_usage():
    """Monitor memory usage"""
    import psutil
    process = psutil.Process()
    return {
        "rss_mb": process.memory_info().rss / 1024 / 1024,
        "percent": process.memory_percent()
    }
```

#### Lightweight AI Models
```python
# ai/lightweight_models.py - Memory-efficient AI components
import numpy as np
from typing import Dict, List, Optional
import pickle
import os
from dataclasses import dataclass

@dataclass
class StudentContext:
    student_id: str
    subject: str
    current_topic: str
    difficulty_level: int  # 1-5
    recent_performance: float  # 0-1

class LightweightTutor:
    """Memory-efficient AI tutor using rule-based + tiny ML models"""

    def __init__(self):
        self.memory_usage_mb = 50  # Target: 50MB max
        self.response_templates = self._load_templates()
        self.concept_graph = self._load_concept_graph()

        # Tiny sentiment analysis (scikit-learn)
        self.sentiment_model = self._load_tiny_sentiment_model()

    def _load_templates(self) -> Dict:
        """Load pre-written response templates (rule-based)"""
        return {
            "explanation": [
                "Let me break this down into simpler steps...",
                "Think of it this way...",
                "Here's another way to look at it..."
            ],
            "encouragement": [
                "Great question! This shows you're thinking deeply.",
                "You're on the right track! Let's explore this further.",
                "I can see you're working hard on this."
            ],
            "hints": [
                "What if you tried thinking about the previous step?",
                "Remember what we learned about [topic]?",
                "Can you break this into smaller parts?"
            ]
        }

    def _load_concept_graph(self) -> Dict:
        """Load subject concept relationships (static data)"""
        return {
            "math": {
                "algebra": {"prerequisites": ["arithmetic"], "next": ["geometry"]},
                "geometry": {"prerequisites": ["algebra"], "next": ["trigonometry"]},
                # ... more concepts
            },
            "science": {
                "chemistry": {"prerequisites": ["math_basics"], "next": ["physics"]},
                # ... more concepts
            }
        }

    def _load_tiny_sentiment_model(self):
        """Load a tiny sentiment model (< 5MB)"""
        try:
            # Use a pre-trained tiny model or simple rule-based
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.naive_bayes import MultinomialNB

            # This would be pre-trained and saved
            return {
                "vectorizer": TfidfVectorizer(max_features=1000),
                "classifier": MultinomialNB()
            }
        except ImportError:
            return None  # Fallback to rule-based

    async def generate_response(self,
                              question: str,
                              context: StudentContext) -> Dict:
        """Generate AI response with minimal memory footprint"""

        # Memory-efficient response generation
        response_type = self._classify_question_type(question)
        sentiment = self._analyze_sentiment(question)

        # Rule-based response selection
        if sentiment < 0.3:  # Student seems frustrated
            template_type = "encouragement"
        elif "explain" in question.lower() or "how" in question.lower():
            template_type = "explanation"
        else:
            template_type = "hints"

        base_response = np.random.choice(self.response_templates[template_type])

        # Personalize based on context
        personalized_response = self._personalize_response(
            base_response, context
        )

        return {
            "response": personalized_response,
            "confidence": 0.8,  # Fixed confidence for simplicity
            "type": template_type,
            "memory_usage_mb": self._get_memory_usage()
        }

    def _classify_question_type(self, question: str) -> str:
        """Simple rule-based question classification"""
        question_lower = question.lower()

        if any(word in question_lower for word in ["what", "define", "meaning"]):
            return "definition"
        elif any(word in question_lower for word in ["how", "explain", "why"]):
            return "explanation"
        elif any(word in question_lower for word in ["help", "stuck", "don't understand"]):
            return "help"
        else:
            return "general"

    def _analyze_sentiment(self, text: str) -> float:
        """Lightweight sentiment analysis"""
        if self.sentiment_model:
            try:
                # Use tiny ML model
                features = self.sentiment_model["vectorizer"].transform([text])
                sentiment = self.sentiment_model["classifier"].predict_proba(features)[0][1]
                return sentiment
            except:
                pass

        # Fallback: simple rule-based sentiment
        negative_words = ["confused", "stuck", "don't understand", "hard", "difficult"]
        positive_words = ["understand", "got it", "clear", "thanks", "helpful"]

        text_lower = text.lower()
        negative_count = sum(1 for word in negative_words if word in text_lower)
        positive_count = sum(1 for word in positive_words if word in text_lower)

        return max(0, min(1, 0.5 + (positive_count - negative_count) * 0.2))

    def _personalize_response(self, base_response: str, context: StudentContext) -> str:
        """Add context-specific personalization"""
        personalized = base_response

        # Add subject-specific context
        if context.subject in self.concept_graph:
            subject_info = self.concept_graph[context.subject]
            if context.current_topic in subject_info:
                topic_info = subject_info[context.current_topic]
                if "prerequisites" in topic_info:
                    prereqs = ", ".join(topic_info["prerequisites"])
                    personalized += f" Remember, this builds on {prereqs}."

        return personalized

    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        import psutil
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024

class SimpleAnalytics:
    """Lightweight analytics engine"""

    def __init__(self):
        self.metrics_cache = {}
        self.memory_limit_mb = 30

    async def analyze_student_progress(self, student_id: str) -> Dict:
        """Simple progress analysis without heavy ML"""

        # Get recent data from cache or database
        cache_key = f"student_progress_{student_id}"

        if cache_key in self.metrics_cache:
            return self.metrics_cache[cache_key]

        # Simple statistical analysis
        progress_data = await self._get_student_data(student_id)

        analysis = {
            "overall_trend": self._calculate_trend(progress_data.get("grades", [])),
            "strong_subjects": self._identify_strengths(progress_data),
            "improvement_areas": self._identify_weaknesses(progress_data),
            "engagement_level": self._calculate_engagement(progress_data),
            "ai_usage_health": self._analyze_ai_usage(progress_data)
        }

        # Cache result (with memory limit)
        if len(self.metrics_cache) < 100:  # Limit cache size
            self.metrics_cache[cache_key] = analysis

        return analysis

    def _calculate_trend(self, grades: List[float]) -> str:
        """Simple trend calculation"""
        if len(grades) < 2:
            return "insufficient_data"

        recent_avg = np.mean(grades[-5:]) if len(grades) >= 5 else np.mean(grades[-2:])
        earlier_avg = np.mean(grades[:5]) if len(grades) >= 10 else np.mean(grades[:-2])

        if recent_avg > earlier_avg + 0.1:
            return "improving"
        elif recent_avg < earlier_avg - 0.1:
            return "declining"
        else:
            return "stable"

    async def _get_student_data(self, student_id: str) -> Dict:
        """Get student data from database with minimal memory usage"""
        # This would query the PostgreSQL database
        # Return minimal required data
        return {
            "grades": [0.85, 0.82, 0.88, 0.90, 0.87],  # Example
            "subjects": ["math", "science", "english"],
            "ai_interactions": 15,
            "independent_work": 0.75
        }
```

#### Memory-Efficient Database Configuration
```python
# database/connection.py - Optimized PostgreSQL connection
import asyncpg
import asyncio
from typing import Dict, Any
import json
import os

class DatabasePool:
    """Memory-optimized database connection pool"""

    def __init__(self):
        self.pool = None
        self.max_connections = 5  # Very limited for 4GB RAM
        self.min_connections = 2

    async def initialize(self):
        """Initialize connection pool with memory optimization"""
        self.pool = await asyncpg.create_pool(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", 5432),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME", "ai_school"),
            min_size=self.min_connections,
            max_size=self.max_connections,
            command_timeout=10,
            server_settings={
                "application_name": "ai_school_system",
                # PostgreSQL memory optimization
                "shared_buffers": "128MB",  # Small buffer
                "effective_cache_size": "512MB",  # Conservative estimate
                "work_mem": "4MB",  # Small work memory
                "maintenance_work_mem": "32MB",
                "checkpoint_completion_target": "0.9",
                "wal_buffers": "16MB",
                "default_statistics_target": "50"  # Reduce statistics
            }
        )

    async def execute_query(self, query: str, *args) -> Any:
        """Execute query with automatic connection management"""
        async with self.pool.acquire() as connection:
            try:
                result = await connection.fetch(query, *args)
                return result
            except Exception as e:
                print(f"Database error: {e}")
                raise

# Optimized database schema
DATABASE_SCHEMA = """
-- Minimal tables for AI system (ERPNext has the master data)

CREATE TABLE IF NOT EXISTS ai_student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    erpnext_student_id VARCHAR(140) UNIQUE NOT NULL,
    learning_preferences JSONB DEFAULT '{}',
    ai_insights JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(140) NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    messages JSONB DEFAULT '[]',
    summary JSONB DEFAULT '{}',
    -- Keep only recent sessions to save space
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE IF NOT EXISTS ai_analytics_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance with minimal overhead
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_profiles_erpnext_id
    ON ai_student_profiles(erpnext_student_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_student_id
    ON ai_chat_sessions(student_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_expires
    ON ai_chat_sessions(expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_expires
    ON ai_analytics_cache(expires_at);

-- Automatic cleanup to prevent memory bloat
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS void AS $$
BEGIN
    DELETE FROM ai_chat_sessions WHERE expires_at < NOW();
    DELETE FROM ai_analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension or external cron)
-- SELECT cron.schedule('cleanup-expired', '0 2 * * *', 'SELECT cleanup_expired_data();');
"""
```

#### Resource-Optimized ERPNext Sync
```python
# sync/erpnext_sync.py - Memory-efficient ERPNext synchronization
import httpx
import asyncio
from typing import Dict, List, Optional
import json
from datetime import datetime, timedelta
import gc

class ERPNextSyncService:
    """Memory-efficient ERPNext synchronization service"""

    def __init__(self):
        self.base_url = os.getenv("ERPNEXT_URL", "http://localhost:8000")
        self.api_key = os.getenv("ERPNEXT_API_KEY")
        self.api_secret = os.getenv("ERPNEXT_API_SECRET")

        # Sync configuration for low resources
        self.batch_size = 10  # Small batches to conserve memory
        self.sync_interval = 600  # 10 minutes instead of real-time
        self.max_retries = 3

        # HTTP client with connection limits
        self.client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=2, max_keepalive_connections=1),
            timeout=httpx.Timeout(30.0),
            headers={
                "Authorization": f"token {self.api_key}:{self.api_secret}",
                "Content-Type": "application/json"
            }
        )

    async def sync_all_data(self):
        """Sync all necessary data with memory optimization"""
        try:
            # Sync in sequence to minimize memory usage
            await self._sync_students()
            gc.collect()  # Clean up after each sync

            await self._sync_courses()
            gc.collect()

            await self._sync_assessments()
            gc.collect()

            await self._sync_attendance()
            gc.collect()

        except Exception as e:
            print(f"Sync error: {e}")

    async def _sync_students(self):
        """Sync student data in small batches"""
        try:
            # Get only recently modified students to reduce data transfer
            since_date = (datetime.now() - timedelta(days=1)).isoformat()

            url = f"{self.base_url}/api/resource/Student"
            params = {
                "fields": ["name", "student_name", "student_email_id", "student_batch_name"],
                "filters": [["modified", ">", since_date]],
                "limit_page_length": self.batch_size
            }

            response = await self.client.get(url, params=params)
            response.raise_for_status()

            students_data = response.json().get("data", [])

            # Process in small batches
            for i in range(0, len(students_data), self.batch_size):
                batch = students_data[i:i + self.batch_size]
                await self._process_student_batch(batch)
                gc.collect()

        except Exception as e:
            print(f"Student sync error: {e}")

    async def _process_student_batch(self, students: List[Dict]):
        """Process a batch of students"""
        # Update local AI profiles
        for student in students:
            await self._update_ai_student_profile(student)

    async def _update_ai_student_profile(self, student_data: Dict):
        """Update AI student profile with ERPNext data"""
        # Minimal database update
        query = """
        INSERT INTO ai_student_profiles (erpnext_student_id, last_sync_at)
        VALUES ($1, NOW())
        ON CONFLICT (erpnext_student_id)
        DO UPDATE SET last_sync_at = NOW()
        """

        # Execute with database pool
        # await db_pool.execute_query(query, student_data["name"])

# Memory usage monitoring
async def monitor_memory_usage():
    """Monitor and log memory usage"""
    import psutil

    while True:
        process = psutil.Process()
        memory_info = process.memory_info()

        memory_mb = memory_info.rss / 1024 / 1024
        memory_percent = process.memory_percent()

        print(f"Memory Usage: {memory_mb:.1f}MB ({memory_percent:.1f}%)")

        # Alert if memory usage is too high
        if memory_mb > 3500:  # Alert at 3.5GB (leaving 500MB buffer)
            print("WARNING: High memory usage detected!")
            gc.collect()

        await asyncio.sleep(60)  # Check every minute
```

### 🚀 Deployment Configuration for Low Resources

#### Docker Compose (Resource-Optimized)
```yaml
# docker-compose.yml - Optimized for 4GB/2-core
version: '3.8'

services:
  # ERPNext (existing, but with resource limits)
  erpnext:
    image: frappe/erpnext:latest
    deploy:
      resources:
        limits:
          memory: 1.5G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.8'
    environment:
      - FRAPPE_ENV=production
      # Memory optimization
      - GUNICORN_WORKERS=2  # Limited workers
      - GUNICORN_THREADS=2
    volumes:
      - erpnext_data:/home/frappe/frappe-bench

  # PostgreSQL (shared between ERPNext and AI system)
  postgres:
    image: postgres:13-alpine  # Alpine for smaller footprint
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.3'
    environment:
      POSTGRES_DB: ai_school
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      # PostgreSQL memory optimization
      POSTGRES_INITDB_ARGS: "--data-checksums"
    command: |
      postgres
      -c shared_buffers=128MB
      -c effective_cache_size=256MB
      -c work_mem=4MB
      -c maintenance_work_mem=32MB
      -c checkpoint_completion_target=0.9
      -c max_connections=20
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # AI System (FastAPI)
  ai_system:
    build:
      context: .
      dockerfile: Dockerfile.lightweight
    deploy:
      resources:
        limits:
          memory: 1.5G
          cpus: '0.7'
        reservations:
          memory: 800M
          cpus: '0.5'
    environment:
      - PYTHONOPTIMIZE=2
      - PYTHONUNBUFFERED=1
      - ERPNEXT_URL=http://erpnext:8000
      - DB_HOST=postgres
      - DB_NAME=ai_school
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - postgres
      - erpnext
    ports:
      - "8080:8080"

  # Nginx (lightweight proxy)
  nginx:
    image: nginx:alpine
    deploy:
      resources:
        limits:
          memory: 100M
          cpus: '0.1'
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - ai_system

volumes:
  erpnext_data:
  postgres_data:
```

#### Lightweight Dockerfile
```dockerfile
# Dockerfile.lightweight - Optimized Python container
FROM python:3.11-slim

# Memory optimization
ENV PYTHONOPTIMIZE=2
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install only essential packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python packages with optimization
RUN pip install --no-cache-dir --compile -r requirements.txt \
    && pip cache purge

# Copy application code
COPY . .

# Build React frontend
WORKDIR /app/frontend
RUN npm ci --only=production \
    && npm run build \
    && rm -rf node_modules

WORKDIR /app

# Non-root user for security
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Optimized startup
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1", "--loop", "asyncio"]
```

#### Requirements.txt (Minimal)
```txt
# requirements.txt - Minimal dependencies for 4GB system
fastapi==0.104.1
uvicorn[standard]==0.24.0
asyncpg==0.29.0
httpx==0.25.2
pydantic==2.5.0
python-multipart==0.0.6

# Lightweight ML (instead of heavy libraries)
scikit-learn==1.3.2
numpy==1.24.4

# Essential utilities
python-dotenv==1.0.0
Pillow==10.1.0  # For basic image processing

# No heavy dependencies like:
# - torch/tensorflow (too memory intensive)
# - transformers (too large)
# - celery + redis (replaced with simple async)
# - elasticsearch (using PostgreSQL full-text search)
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Update technical architecture for 4GB RAM / 2-core CPU optimization", "status": "completed", "activeForm": "Updating technical architecture for 4GB RAM / 2-core CPU optimization"}, {"content": "Optimize ERPNext integration for low-resource environment", "status": "completed", "activeForm": "Optimizing ERPNext integration for low-resource environment"}, {"content": "Update frontend architecture for lightweight deployment", "status": "in_progress", "activeForm": "Updating frontend architecture for lightweight deployment"}, {"content": "Revise AI system requirements for resource constraints", "status": "completed", "activeForm": "Revising AI system requirements for resource constraints"}, {"content": "Update deployment and infrastructure specifications", "status": "completed", "activeForm": "Updating deployment and infrastructure specifications"}, {"content": "Modify database and caching strategies for low memory", "status": "completed", "activeForm": "Modifying database and caching strategies for low memory"}, {"content": "Update all Phase 0 documents with resource constraints", "status": "pending", "activeForm": "Updating all Phase 0 documents with resource constraints"}]