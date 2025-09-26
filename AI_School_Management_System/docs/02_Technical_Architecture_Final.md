# Final Technical Architecture - AI Enhancement Layer
## AI-Enabled School Management System - 4GB RAM / 2-Core CPU

### 🎯 Architecture Overview

#### System Components
```yaml
Existing Infrastructure:
  ERPNext: Already deployed and running (separate server/instance)
  - Accessed via API Key & Secret
  - Contains all master data (students, teachers, courses, etc.)
  - Handles all core school management functions

New AI Enhancement Layer (4GB/2-core deployment):
  FastAPI Backend: 2GB RAM, 1.5 CPU cores
  PostgreSQL: 1GB RAM, 0.3 CPU cores
  Frontend (React SPA): 500MB RAM, 0.1 CPU cores
  OS + Services: 500MB RAM, 0.1 CPU cores

External Services:
  OpenRouter API: Free AI models (no local resources needed)
  ERPNext API: Existing school data source
```

#### Simplified Architecture Diagram
```yaml
┌─────────────────────────────────────────────────────────────┐
│                External ERPNext System                      │
│            (Already deployed elsewhere)                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │     ERPNext Education Module                           │ │
│  │  • Student Master Data                                │ │
│  │  • Teacher/Instructor Data                            │ │
│  │  • Course & Program Management                        │ │
│  │  • Assessment & Grading                               │ │
│  │  • Attendance Records                                 │ │
│  │  • Scheduling & Timetables                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕️ API Key/Secret Authentication
┌─────────────────────────────────────────────────────────────┐
│              AI Enhancement System (4GB/2-Core)             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            FastAPI Backend (2GB/1.5 CPU)               │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │          ERPNext API Gateway                       │ │ │
│  │  │  • Authentication & Rate Limiting                 │ │ │
│  │  │  • Data Fetching & Caching                        │ │ │
│  │  │  • Real-time Sync Management                      │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │         OpenRouter AI Integration                  │ │ │
│  │  │  • Free Model API Calls                           │ │ │
│  │  │  • Chat & Tutoring Logic                          │ │ │
│  │  │  • Response Processing                             │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │         Analytics & Insights Engine               │ │ │
│  │  │  • Student Progress Analysis                      │ │ │
│  │  │  • Learning Pattern Detection                     │ │ │
│  │  │  • Recommendation System                          │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           PostgreSQL Database (1GB/0.3 CPU)            │ │
│  │  • AI Chat History & Sessions                          │ │
│  │  • Analytics Cache                                     │ │
│  │  • User Preferences                                    │ │
│  │  • Processed Insights                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         React Frontend SPA (500MB/0.1 CPU)             │ │
│  │  • Student Dashboard                                   │ │
│  │  • Teacher Control Panel                               │ │
│  │  • Parent Monitoring Interface                         │ │
│  │  • Admin Analytics Dashboard                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                    OpenRouter API                           │
│                  (External Service)                         │
│  • Free AI Models (GPT-3.5, Claude, etc.)                  │
│  • No local resource usage                                  │
│  • Pay-per-use or free tier                                 │
└─────────────────────────────────────────────────────────────┘
```

### 💻 FastAPI Backend Implementation

#### Main Application (Ultra-Lightweight)
```python
# main.py - Resource-optimized FastAPI for ERPNext integration
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
import asyncio
import os
import gc
from contextlib import asynccontextmanager

# Import our lightweight modules
from .api.erpnext_client import ERPNextClient
from .api.openrouter_client import OpenRouterClient
from .database.postgres_client import PostgreSQLClient
from .services.analytics_service import AnalyticsService
from .services.sync_service import SyncService

# Memory optimization settings
os.environ["PYTHONOPTIMIZE"] = "2"
gc.set_threshold(700, 10, 10)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup - Initialize all services
    app.state.erpnext_client = ERPNextClient(
        base_url=os.getenv("ERPNEXT_URL"),
        api_key=os.getenv("ERPNEXT_API_KEY"),
        api_secret=os.getenv("ERPNEXT_API_SECRET")
    )

    app.state.openrouter_client = OpenRouterClient(
        api_key=os.getenv("OPENROUTER_API_KEY", "")  # Empty for free tier
    )

    app.state.db_client = PostgreSQLClient()
    await app.state.db_client.initialize()

    app.state.analytics_service = AnalyticsService(
        erpnext_client=app.state.erpnext_client,
        db_client=app.state.db_client
    )

    app.state.sync_service = SyncService(
        erpnext_client=app.state.erpnext_client,
        db_client=app.state.db_client
    )

    # Start background sync task (every 10 minutes)
    app.state.sync_task = asyncio.create_task(
        background_sync(app.state.sync_service)
    )

    yield

    # Shutdown
    app.state.sync_task.cancel()
    await app.state.db_client.close()
    gc.collect()

app = FastAPI(
    title="AI School Enhancement System",
    description="ERPNext AI Integration Layer - 4GB RAM Optimized",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,  # Disable in production
    redoc_url=None
)

# Lightweight middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Serve React frontend
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

async def background_sync(sync_service):
    """Background synchronization with ERPNext"""
    while True:
        try:
            await sync_service.sync_recent_data()
            gc.collect()
        except Exception as e:
            print(f"Background sync error: {e}")
        await asyncio.sleep(600)  # 10 minutes

# Health check
@app.get("/api/health")
async def health_check():
    import psutil
    process = psutil.Process()
    return {
        "status": "healthy",
        "memory_mb": round(process.memory_info().rss / 1024 / 1024, 1),
        "cpu_percent": process.cpu_percent()
    }

# Include API routers
from .routers import students, teachers, parents, admin, ai_chat

app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["teachers"])
app.include_router(parents.router, prefix="/api/parents", tags=["parents"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(ai_chat.router, prefix="/api/ai", tags=["ai"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        workers=1,  # Single worker for 4GB constraint
        loop="asyncio",
        access_log=False  # Reduce logging overhead
    )
```

#### ERPNext API Client
```python
# api/erpnext_client.py - Optimized ERPNext integration
import httpx
import asyncio
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class ERPNextConfig:
    base_url: str
    api_key: str
    api_secret: str
    timeout: int = 30
    max_connections: int = 3  # Limited for 4GB system

class ERPNextClient:
    """Lightweight ERPNext API client"""

    def __init__(self, base_url: str, api_key: str, api_secret: str):
        self.config = ERPNextConfig(base_url, api_key, api_secret)

        # Lightweight HTTP client
        self.client = httpx.AsyncClient(
            base_url=self.config.base_url,
            headers={
                "Authorization": f"token {api_key}:{api_secret}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            limits=httpx.Limits(
                max_connections=self.config.max_connections,
                max_keepalive_connections=1
            ),
            timeout=httpx.Timeout(self.config.timeout)
        )

    async def get_students(self,
                          limit: int = 50,
                          fields: List[str] = None,
                          filters: Dict = None) -> List[Dict]:
        """Fetch students from ERPNext"""
        try:
            params = {
                "limit_page_length": limit,
                "fields": json.dumps(fields or [
                    "name", "student_name", "student_email_id",
                    "student_batch_name", "date_of_birth"
                ])
            }

            if filters:
                params["filters"] = json.dumps(filters)

            response = await self.client.get("/api/resource/Student", params=params)
            response.raise_for_status()

            return response.json().get("data", [])

        except Exception as e:
            print(f"Error fetching students: {e}")
            return []

    async def get_student_details(self, student_id: str) -> Optional[Dict]:
        """Get detailed student information"""
        try:
            response = await self.client.get(f"/api/resource/Student/{student_id}")
            response.raise_for_status()
            return response.json().get("data")
        except Exception as e:
            print(f"Error fetching student {student_id}: {e}")
            return None

    async def get_student_enrollments(self, student_id: str) -> List[Dict]:
        """Get student program enrollments"""
        try:
            filters = [["student", "=", student_id]]
            params = {
                "filters": json.dumps(filters),
                "fields": json.dumps([
                    "name", "program", "academic_year", "academic_term",
                    "enrollment_date", "student_batch_name"
                ])
            }

            response = await self.client.get("/api/resource/Program Enrollment", params=params)
            response.raise_for_status()

            return response.json().get("data", [])

        except Exception as e:
            print(f"Error fetching enrollments for {student_id}: {e}")
            return []

    async def get_student_assessments(self,
                                    student_id: str,
                                    limit: int = 20) -> List[Dict]:
        """Get recent assessment results"""
        try:
            filters = [["student", "=", student_id]]
            params = {
                "filters": json.dumps(filters),
                "limit_page_length": limit,
                "order_by": "modified desc",
                "fields": json.dumps([
                    "name", "assessment_plan", "result", "grade",
                    "total_score", "maximum_score", "creation"
                ])
            }

            response = await self.client.get("/api/resource/Assessment Result", params=params)
            response.raise_for_status()

            return response.json().get("data", [])

        except Exception as e:
            print(f"Error fetching assessments for {student_id}: {e}")
            return []

    async def get_teachers(self, limit: int = 50) -> List[Dict]:
        """Fetch instructors from ERPNext"""
        try:
            params = {
                "limit_page_length": limit,
                "fields": json.dumps([
                    "name", "instructor_name", "email", "mobile_no",
                    "department", "employee_id"
                ])
            }

            response = await self.client.get("/api/resource/Instructor", params=params)
            response.raise_for_status()

            return response.json().get("data", [])

        except Exception as e:
            print(f"Error fetching teachers: {e}")
            return []

    async def get_courses(self, limit: int = 100) -> List[Dict]:
        """Fetch courses from ERPNext"""
        try:
            params = {
                "limit_page_length": limit,
                "fields": json.dumps([
                    "name", "course_name", "course_code",
                    "department", "course_intro"
                ])
            }

            response = await self.client.get("/api/resource/Course", params=params)
            response.raise_for_status()

            return response.json().get("data", [])

        except Exception as e:
            print(f"Error fetching courses: {e}")
            return []

    async def get_academic_year(self, year_name: str = None) -> Optional[Dict]:
        """Get academic year configuration"""
        try:
            if not year_name:
                # Get current academic year
                filters = [["is_default", "=", 1]]
                params = {
                    "filters": json.dumps(filters),
                    "limit_page_length": 1,
                    "fields": json.dumps([
                        "name", "year_start_date", "year_end_date", "is_default"
                    ])
                }
                response = await self.client.get("/api/resource/Academic Year", params=params)
            else:
                response = await self.client.get(f"/api/resource/Academic Year/{year_name}")

            response.raise_for_status()
            data = response.json().get("data")
            return data[0] if isinstance(data, list) and data else data

        except Exception as e:
            print(f"Error fetching academic year: {e}")
            return None

    async def get_academic_term(self, academic_year: str) -> List[Dict]:
        """Get academic terms for a year"""
        try:
            filters = [["academic_year", "=", academic_year]]
            params = {
                "filters": json.dumps(filters),
                "fields": json.dumps([
                    "name", "term_name", "term_start_date", "term_end_date",
                    "academic_year"
                ])
            }

            response = await self.client.get("/api/resource/Academic Term", params=params)
            response.raise_for_status()

            return response.json().get("data", [])

        except Exception as e:
            print(f"Error fetching academic terms: {e}")
            return []

    async def get_holiday_list(self, academic_year: str) -> List[Dict]:
        """Get holiday list for academic year"""
        try:
            # First get the holiday list for the academic year
            filters = [["academic_year", "=", academic_year]]
            params = {
                "filters": json.dumps(filters),
                "limit_page_length": 1
            }

            response = await self.client.get("/api/resource/Holiday List", params=params)
            response.raise_for_status()

            holiday_lists = response.json().get("data", [])
            if not holiday_lists:
                return []

            # Get the actual holidays
            holiday_list_name = holiday_lists[0]["name"]
            response = await self.client.get(f"/api/resource/Holiday List/{holiday_list_name}")
            response.raise_for_status()

            holiday_data = response.json().get("data", {})
            return holiday_data.get("holidays", [])

        except Exception as e:
            print(f"Error fetching holiday list: {e}")
            return []

    async def get_program_curriculum(self, program: str) -> Optional[Dict]:
        """Get program curriculum structure"""
        try:
            response = await self.client.get(f"/api/resource/Program/{program}")
            response.raise_for_status()

            program_data = response.json().get("data", {})

            # Get associated courses
            if program_data.get("courses"):
                course_details = []
                for course_item in program_data["courses"]:
                    course_response = await self.client.get(f"/api/resource/Course/{course_item['course']}")
                    if course_response.status_code == 200:
                        course_details.append(course_response.json().get("data", {}))

                program_data["course_details"] = course_details

            return program_data

        except Exception as e:
            print(f"Error fetching program curriculum: {e}")
            return None

    async def get_course_schedules(self,
                                  student_group: str = None,
                                  instructor: str = None,
                                  date_from: str = None,
                                  academic_year: str = None,
                                  academic_term: str = None) -> List[Dict]:
        """Get course schedules with yearly curriculum context"""
        try:
            filters = []
            if student_group:
                filters.append(["student_group", "=", student_group])
            if instructor:
                filters.append(["instructor", "=", instructor])
            if date_from:
                filters.append(["schedule_date", ">=", date_from])
            if academic_year:
                filters.append(["academic_year", "=", academic_year])
            if academic_term:
                filters.append(["academic_term", "=", academic_term])

            params = {
                "limit_page_length": 500,  # Increased for yearly view
                "fields": json.dumps([
                    "name", "course", "instructor", "student_group",
                    "schedule_date", "from_time", "to_time", "room",
                    "academic_year", "academic_term", "color"
                ])
            }

            if filters:
                params["filters"] = json.dumps(filters)

            response = await self.client.get("/api/resource/Course Schedule", params=params)
            response.raise_for_status()

            return response.json().get("data", [])

        except Exception as e:
            print(f"Error fetching schedules: {e}")
            return []

    async def get_instructor_schedule(self, instructor: str, academic_year: str = None) -> List[Dict]:
        """Get instructor's complete schedule including leaves"""
        try:
            # Get course schedules
            schedules = await self.get_course_schedules(
                instructor=instructor,
                academic_year=academic_year
            )

            # Get instructor leaves
            filters = [["employee", "=", instructor]]
            if academic_year:
                # Get academic year dates to filter leaves
                academic_year_data = await self.get_academic_year(academic_year)
                if academic_year_data:
                    filters.extend([
                        ["from_date", ">=", academic_year_data["year_start_date"]],
                        ["to_date", "<=", academic_year_data["year_end_date"]]
                    ])

            params = {
                "filters": json.dumps(filters),
                "fields": json.dumps([
                    "name", "employee", "from_date", "to_date",
                    "leave_type", "status", "description"
                ])
            }

            leave_response = await self.client.get("/api/resource/Leave Application", params=params)
            leaves = []
            if leave_response.status_code == 200:
                leaves = leave_response.json().get("data", [])

            return {
                "schedules": schedules,
                "leaves": leaves
            }

        except Exception as e:
            print(f"Error fetching instructor schedule: {e}")
            return {"schedules": [], "leaves": []}

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
```

#### OpenRouter AI Integration
```python
# api/openrouter_client.py - OpenRouter free models integration
import httpx
import json
from typing import Dict, List, Optional, AsyncGenerator
import asyncio

class OpenRouterClient:
    """Client for OpenRouter free AI models"""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key  # Can be empty for free tier
        self.base_url = "https://openrouter.ai/api/v1"

        # Free models available on OpenRouter
        self.free_models = [
            "mistralai/mistral-7b-instruct:free",
            "huggingfaceh4/zephyr-7b-beta:free",
            "openchat/openchat-7b:free",
            "gryphe/mythomist-7b:free"
        ]

        self.default_model = self.free_models[0]  # Use Mistral as default

        # Lightweight HTTP client
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}" if self.api_key else "",
                "Content-Type": "application/json"
            },
            timeout=httpx.Timeout(60.0)  # Longer timeout for AI responses
        )

    async def chat_completion(self,
                            messages: List[Dict[str, str]],
                            model: str = None,
                            max_tokens: int = 500,
                            temperature: float = 0.7) -> Optional[str]:
        """Get chat completion from OpenRouter free models"""
        try:
            model = model or self.default_model

            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "stream": False
            }

            response = await self.client.post("/chat/completions", json=payload)

            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                print(f"OpenRouter API error: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Error calling OpenRouter API: {e}")
            return None

    async def educational_chat(self,
                             student_question: str,
                             context: Dict,
                             subject: str = "general") -> Optional[str]:
        """Educational AI chat optimized for learning"""

        # Create educational prompt
        system_prompt = self._create_educational_prompt(subject, context)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": student_question}
        ]

        response = await self.chat_completion(
            messages=messages,
            temperature=0.5,  # Lower temperature for educational content
            max_tokens=400
        )

        return response

    def _create_educational_prompt(self, subject: str, context: Dict) -> str:
        """Create educational system prompt"""

        base_prompt = """You are an AI tutor helping a student learn. Your role is to:

1. Guide students to understand concepts rather than giving direct answers
2. Ask clarifying questions to assess understanding
3. Provide hints and explanations that promote learning
4. Encourage critical thinking and problem-solving
5. Be supportive and patient

Important guidelines:
- DO NOT solve homework problems directly
- DO provide explanations of concepts and methods
- DO ask questions to guide student thinking
- DO encourage students to try solving problems themselves
- Keep responses concise and age-appropriate"""

        if subject != "general":
            base_prompt += f"\n\nSubject context: You are helping with {subject}."

        if context.get("grade_level"):
            base_prompt += f"\nStudent grade level: {context['grade_level']}"

        if context.get("current_topic"):
            base_prompt += f"\nCurrent topic: {context['current_topic']}"

        return base_prompt

    async def analyze_student_question(self, question: str) -> Dict:
        """Analyze student question for intent and appropriateness"""

        analysis_prompt = f"""Analyze this student question and respond with JSON:

Question: "{question}"

Analyze for:
1. intent (explanation, help, homework, quiz, general)
2. subject (math, science, english, history, general)
3. appropriateness (appropriate, needs_guidance, inappropriate)
4. complexity_level (1-5 scale)

Respond only with valid JSON."""

        messages = [
            {"role": "system", "content": "You are an educational content analyzer. Respond only with valid JSON."},
            {"role": "user", "content": analysis_prompt}
        ]

        response = await self.chat_completion(
            messages=messages,
            temperature=0.1,  # Very low for consistent analysis
            max_tokens=150
        )

        try:
            return json.loads(response) if response else {}
        except:
            return {"error": "Unable to analyze question"}

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()
```

#### Minimal Database Schema
```sql
-- Minimal PostgreSQL schema for AI enhancement layer
-- ERPNext has all the master data, we just store AI-specific information

CREATE DATABASE ai_school_enhancement;

-- AI-specific student data (linked to ERPNext via student ID)
CREATE TABLE ai_student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    erpnext_student_id VARCHAR(140) UNIQUE NOT NULL,
    learning_preferences JSONB DEFAULT '{}',
    ai_chat_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI chat sessions (temporary storage, auto-cleanup)
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(140) NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    messages JSONB DEFAULT '[]',
    session_summary JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Analytics cache (to avoid repeated ERPNext API calls)
CREATE TABLE analytics_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple sync status tracking
CREATE TABLE sync_status (
    entity_type VARCHAR(50) PRIMARY KEY, -- students, teachers, courses, etc.
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed
    error_message TEXT
);

-- Minimal indexes for performance
CREATE INDEX idx_student_profiles_erpnext_id ON ai_student_profiles(erpnext_student_id);
CREATE INDEX idx_chat_sessions_student_id ON ai_chat_sessions(student_id);
CREATE INDEX idx_chat_sessions_expires ON ai_chat_sessions(expires_at);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Auto-cleanup function for memory management
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS void AS $$
BEGIN
    DELETE FROM ai_chat_sessions WHERE expires_at < NOW();
    DELETE FROM analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

#### Updated Docker Compose (Final)
```yaml
# docker-compose.yml - Final deployment for 4GB/2-core
version: '3.8'

services:
  # PostgreSQL (lightweight)
  postgres:
    image: postgres:13-alpine
    container_name: ai_school_postgres
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.3'
        reservations:
          memory: 512M
    environment:
      POSTGRES_DB: ai_school_enhancement
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--data-checksums"
    command: |
      postgres
      -c shared_buffers=256MB
      -c effective_cache_size=512MB
      -c work_mem=4MB
      -c maintenance_work_mem=64MB
      -c max_connections=20
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ai_school_network

  # AI Enhancement System
  ai_system:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ai_school_system
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.5'
        reservations:
          memory: 1G
    environment:
      # ERPNext connection (external system)
      - ERPNEXT_URL=${ERPNEXT_URL}
      - ERPNEXT_API_KEY=${ERPNEXT_API_KEY}
      - ERPNEXT_API_SECRET=${ERPNEXT_API_SECRET}

      # OpenRouter API (free tier)
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY:-}

      # Database connection
      - DB_HOST=postgres
      - DB_NAME=ai_school_enhancement
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}

      # Python optimization
      - PYTHONOPTIMIZE=2
      - PYTHONUNBUFFERED=1
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - ai_school_network

  # Nginx (minimal)
  nginx:
    image: nginx:alpine
    container_name: ai_school_nginx
    deploy:
      resources:
        limits:
          memory: 100M
          cpus: '0.1'
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/ssl:ro
    depends_on:
      - ai_system
    networks:
      - ai_school_network

volumes:
  postgres_data:

networks:
  ai_school_network:
    driver: bridge
```

#### Environment Variables (.env)
```bash
# .env - Configuration for AI Enhancement System

# ERPNext Integration (existing system)
ERPNEXT_URL=https://your-erpnext-instance.com
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here

# OpenRouter API (free tier - can be empty)
OPENROUTER_API_KEY=

# Database
DB_PASSWORD=secure_password_here

# System Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
```

## 📅 Course Scheduling System Architecture

### Yearly Curriculum-Based Scheduling Workflow

The course scheduling system follows ERPNext's education module hierarchy and implements a yearly planning approach:

#### 1. Foundational Setup (Done in ERPNext)
```yaml
Academic Structure (ERPNext Education Module):
  Academic Year:
    - year_start_date: "2024-04-01"
    - year_end_date: "2025-03-31"
    - holidays: Reference to Holiday List

  Academic Terms:
    - Term 1: April-September (6 months)
    - Term 2: October-March (6 months)
    - Each term has specific start/end dates

  Holiday List:
    - National holidays
    - School-specific holidays
    - Festival holidays
    - Emergency closures

  Program & Curriculum:
    - Grade/Class wise programs (Grade 1, Grade 2, etc.)
    - Subject allocation per grade
    - Required hours per subject
    - Learning outcomes per term
```

#### 2. Course Schedule Generation Process
```python
# Enhanced scheduling service for AI system
class SchedulingService:
    """AI-enhanced course scheduling based on ERPNext curriculum"""

    def __init__(self, erpnext_client: ERPNextClient):
        self.erpnext = erpnext_client

    async def generate_yearly_schedule(self, academic_year: str, program: str):
        """Generate complete yearly schedule based on curriculum"""

        # Step 1: Get foundational data from ERPNext
        academic_year_data = await self.erpnext.get_academic_year(academic_year)
        terms = await self.erpnext.get_academic_term(academic_year)
        holidays = await self.erpnext.get_holiday_list(academic_year)
        curriculum = await self.erpnext.get_program_curriculum(program)

        # Step 2: Calculate working days
        working_days = self.calculate_working_days(
            academic_year_data, holidays
        )

        # Step 3: Distribute curriculum across terms
        schedule_template = self.distribute_curriculum(
            curriculum, terms, working_days
        )

        # Step 4: Apply AI optimization
        optimized_schedule = await self.ai_optimize_schedule(
            schedule_template
        )

        return optimized_schedule

    async def handle_instructor_changes(self, academic_year: str):
        """Dynamically adjust schedules for instructor leaves/changes"""

        # Get all instructor schedules with leaves
        instructors = await self.erpnext.get_teachers()

        schedule_adjustments = []
        for instructor in instructors:
            instructor_data = await self.erpnext.get_instructor_schedule(
                instructor["name"], academic_year
            )

            # Check for leave conflicts
            conflicts = self.detect_schedule_conflicts(
                instructor_data["schedules"],
                instructor_data["leaves"]
            )

            if conflicts:
                # Generate AI-powered alternatives
                alternatives = await self.generate_alternatives(conflicts)
                schedule_adjustments.extend(alternatives)

        return schedule_adjustments
```

#### 3. ERPNext Integration Points
```yaml
Data Flow for Scheduling:

1. Base Schedule Creation (ERPNext):
   ERPNext Course Schedule → AI Enhancement Layer

2. Real-time Adjustments (AI System):
   Teacher Leaves → Schedule Conflicts → AI Alternatives → ERPNext Updates

3. Optimization Factors:
   - Curriculum requirements (from ERPNext Programs)
   - Holiday calendar (ERPNext Holiday List)
   - Teacher availability (ERPNext Leave Applications)
   - Room allocation (ERPNext Room booking)
   - Student group assignments (ERPNext Student Groups)

API Endpoints for Schedule Management:
   GET /api/academic-year/{year}/curriculum → Full curriculum structure
   GET /api/schedules/yearly/{academic_year} → Complete yearly schedule
   POST /api/schedules/optimize → AI-powered schedule optimization
   PUT /api/schedules/adjust-for-leaves → Handle instructor absence
   GET /api/schedules/conflicts → Detect scheduling conflicts
```

#### 4. AI Enhancement Features
```python
# AI-powered scheduling enhancements
class AISchedulingEnhancements:

    async def optimize_learning_progression(self, schedule_data):
        """Use AI to optimize subject sequencing for better learning"""

        prompt = f"""
        Analyze this academic schedule and suggest optimizations for:
        1. Subject sequencing (difficult subjects in morning)
        2. Learning gap distribution (avoid back-to-back difficult subjects)
        3. Optimal break placement
        4. Teacher workload distribution

        Schedule data: {json.dumps(schedule_data)}

        Provide specific recommendations with reasoning.
        """

        # Use OpenRouter free models for analysis
        analysis = await self.openrouter_client.educational_analysis(prompt)
        return analysis

    async def predict_schedule_conflicts(self, upcoming_events):
        """Predict potential scheduling conflicts using AI"""

        # Analyze patterns in historical data
        # Predict teacher absence probability
        # Suggest preventive measures
        pass

    async def generate_makeup_schedules(self, missed_classes):
        """AI-generated makeup class schedules"""

        # Consider student availability
        # Teacher schedule gaps
        # Curriculum pacing requirements
        pass
```

#### 5. Schedule Update Workflow
```yaml
Schedule Modification Process:

1. Trigger Events:
   - Teacher submits leave application (ERPNext)
   - Emergency school closure announced
   - Exam schedule changes
   - Infrastructure issues (room unavailable)

2. AI Processing:
   - Detect affected classes
   - Find alternative instructors/rooms/timings
   - Maintain curriculum pacing
   - Minimize student disruption

3. Stakeholder Notification:
   - Auto-notify affected students/parents
   - Send revised schedules
   - Update teacher calendars
   - Sync with ERPNext Course Schedule

4. Feedback Loop:
   - Track schedule change effectiveness
   - Learn from stakeholder preferences
   - Improve future predictions
```

This architecture ensures that:
- **ERPNext remains the single source of truth** for all academic structure
- **Yearly planning is curriculum-driven** as per your requirement
- **AI enhances but doesn't replace** ERPNext's scheduling capabilities
- **Dynamic adjustments** handle real-world changes efficiently
- **All stakeholders stay informed** through automated notifications

This architecture is now perfectly optimized for:
- **4GB RAM / 2-Core CPU** constraint
- **ERPNext as external API** (no local hosting)
- **OpenRouter free models** (no local AI hosting)
- **Minimal resource footprint** while maintaining full functionality
- **Curriculum-based yearly scheduling** with dynamic adjustments

The system acts as a lightweight enhancement layer that enriches ERPNext data with AI capabilities without replacing or duplicating the core school management functions.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Update technical architecture for 4GB RAM / 2-core CPU optimization", "status": "completed", "activeForm": "Updating technical architecture for 4GB RAM / 2-core CPU optimization"}, {"content": "Optimize ERPNext integration for low-resource environment", "status": "completed", "activeForm": "Optimizing ERPNext integration for low-resource environment"}, {"content": "Update frontend architecture for lightweight deployment", "status": "completed", "activeForm": "Updating frontend architecture for lightweight deployment"}, {"content": "Revise AI system requirements for resource constraints", "status": "completed", "activeForm": "Revising AI system requirements for resource constraints"}, {"content": "Update deployment and infrastructure specifications", "status": "completed", "activeForm": "Updating deployment and infrastructure specifications"}, {"content": "Modify database and caching strategies for low memory", "status": "completed", "activeForm": "Modifying database and caching strategies for low memory"}, {"content": "Replace local AI models with OpenRouter API integration", "status": "completed", "activeForm": "Replacing local AI models with OpenRouter API integration"}, {"content": "Update all Phase 0 documents with resource constraints", "status": "in_progress", "activeForm": "Updating all Phase 0 documents with resource constraints"}]