# app/services/erpnext_service.py - Optimized ERPNext API integration
import httpx
import asyncio
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class ERPNextConfig:
    base_url: str
    api_key: str
    api_secret: str
    timeout: int = 30
    max_connections: int = 3  # Limited for 4GB system
    rate_limit_per_minute: int = 60

class ERPNextService:
    """Memory-efficient ERPNext API service"""

    def __init__(self, base_url: str, api_key: str, api_secret: str):
        self.config = ERPNextConfig(base_url, api_key, api_secret)
        self._rate_limiter = asyncio.Semaphore(5)  # Max 5 concurrent requests

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

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict]:
        """Rate-limited API request with error handling"""
        async with self._rate_limiter:
            try:
                response = await self.client.request(method, endpoint, **kwargs)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"ERPNext API error {e.response.status_code}: {e.response.text}")
                return None
            except Exception as e:
                logger.error(f"ERPNext connection error: {e}")
                return None

    # STUDENT OPERATIONS
    async def get_students(self, limit: int = 50, modified_since: str = None) -> List[Dict]:
        """Fetch students with optional date filter"""
        params = {
            "limit_page_length": limit,
            "fields": json.dumps([
                "name", "student_name", "student_email_id", "student_batch_name",
                "date_of_birth", "gender", "student_mobile_number", "modified"
            ])
        }

        if modified_since:
            params["filters"] = json.dumps([["modified", ">=", modified_since]])

        result = await self._make_request("GET", "/api/resource/Student", params=params)
        return result.get("data", []) if result else []

    async def get_student_detail(self, student_id: str) -> Optional[Dict]:
        """Get detailed student information"""
        result = await self._make_request("GET", f"/api/resource/Student/{student_id}")
        return result.get("data") if result else None

    async def get_student_enrollments(self, student_id: str) -> List[Dict]:
        """Get student program enrollments"""
        params = {
            "filters": json.dumps([["student", "=", student_id]]),
            "fields": json.dumps([
                "name", "program", "academic_year", "academic_term",
                "enrollment_date", "student_batch_name"
            ])
        }

        result = await self._make_request("GET", "/api/resource/Program Enrollment", params=params)
        return result.get("data", []) if result else []

    async def get_student_assessments(self, student_id: str, limit: int = 20) -> List[Dict]:
        """Get recent assessment results"""
        params = {
            "filters": json.dumps([["student", "=", student_id]]),
            "limit_page_length": limit,
            "order_by": "creation desc",
            "fields": json.dumps([
                "name", "assessment_plan", "result", "grade",
                "total_score", "maximum_score", "creation"
            ])
        }

        result = await self._make_request("GET", "/api/resource/Assessment Result", params=params)
        return result.get("data", []) if result else []

    async def get_student_attendance(self, student_id: str, from_date: str = None) -> List[Dict]:
        """Get student attendance records"""
        filters = [["student", "=", student_id]]
        if from_date:
            filters.append(["attendance_date", ">=", from_date])

        params = {
            "filters": json.dumps(filters),
            "limit_page_length": 100,
            "order_by": "attendance_date desc",
            "fields": json.dumps([
                "name", "attendance_date", "status", "course_schedule", "student_group"
            ])
        }

        result = await self._make_request("GET", "/api/resource/Student Attendance", params=params)
        return result.get("data", []) if result else []

    # TEACHER OPERATIONS
    async def get_instructors(self, limit: int = 50) -> List[Dict]:
        """Fetch instructors/teachers"""
        params = {
            "limit_page_length": limit,
            "fields": json.dumps([
                "name", "instructor_name", "email", "mobile_no",
                "department", "employee_id"
            ])
        }

        result = await self._make_request("GET", "/api/resource/Instructor", params=params)
        return result.get("data", []) if result else []

    async def get_instructor_detail(self, instructor_id: str) -> Optional[Dict]:
        """Get detailed instructor information"""
        result = await self._make_request("GET", f"/api/resource/Instructor/{instructor_id}")
        return result.get("data") if result else None

    async def get_instructor_courses(self, instructor_id: str) -> List[Dict]:
        """Get courses assigned to instructor"""
        params = {
            "filters": json.dumps([["instructor", "=", instructor_id]]),
            "fields": json.dumps([
                "name", "course", "student_group", "schedule_date",
                "from_time", "to_time", "room"
            ])
        }

        result = await self._make_request("GET", "/api/resource/Course Schedule", params=params)
        return result.get("data", []) if result else []

    # COURSE OPERATIONS
    async def get_courses(self, limit: int = 100) -> List[Dict]:
        """Fetch courses"""
        params = {
            "limit_page_length": limit,
            "fields": json.dumps([
                "name", "course_name", "course_code", "department",
                "course_intro", "is_published"
            ])
        }

        result = await self._make_request("GET", "/api/resource/Course", params=params)
        return result.get("data", []) if result else []

    async def get_course_detail(self, course_id: str) -> Optional[Dict]:
        """Get detailed course information"""
        result = await self._make_request("GET", f"/api/resource/Course/{course_id}")
        return result.get("data") if result else None

    # SCHEDULE OPERATIONS
    async def get_course_schedules(self,
                                 student_group: str = None,
                                 instructor: str = None,
                                 from_date: str = None,
                                 to_date: str = None) -> List[Dict]:
        """Get course schedules with filters"""
        filters = []
        if student_group:
            filters.append(["student_group", "=", student_group])
        if instructor:
            filters.append(["instructor", "=", instructor])
        if from_date:
            filters.append(["schedule_date", ">=", from_date])
        if to_date:
            filters.append(["schedule_date", "<=", to_date])

        params = {
            "limit_page_length": 200,
            "fields": json.dumps([
                "name", "course", "instructor", "student_group",
                "schedule_date", "from_time", "to_time", "room", "color"
            ])
        }

        if filters:
            params["filters"] = json.dumps(filters)

        result = await self._make_request("GET", "/api/resource/Course Schedule", params=params)
        return result.get("data", []) if result else []

    # STUDENT GROUP OPERATIONS
    async def get_student_groups(self, academic_year: str = None) -> List[Dict]:
        """Get student groups/classes"""
        params = {
            "limit_page_length": 100,
            "fields": json.dumps([
                "name", "group_name", "batch", "academic_year",
                "academic_term", "max_strength"
            ])
        }

        if academic_year:
            params["filters"] = json.dumps([["academic_year", "=", academic_year]])

        result = await self._make_request("GET", "/api/resource/Student Group", params=params)
        return result.get("data", []) if result else []

    async def get_student_group_members(self, group_id: str) -> List[Dict]:
        """Get students in a group"""
        result = await self._make_request("GET", f"/api/resource/Student Group/{group_id}")
        if result and result.get("data"):
            group_data = result["data"]
            return group_data.get("students", [])
        return []

    # GUARDIAN/PARENT OPERATIONS
    async def get_student_guardians(self, student_id: str) -> List[Dict]:
        """Get student's guardians/parents"""
        result = await self.get_student_detail(student_id)
        if result and "guardians" in result:
            return result["guardians"]
        return []

    async def get_guardian_detail(self, guardian_id: str) -> Optional[Dict]:
        """Get guardian information"""
        result = await self._make_request("GET", f"/api/resource/Guardian/{guardian_id}")
        return result.get("data") if result else None

    # ASSESSMENT OPERATIONS
    async def get_assessment_plans(self, course: str = None, academic_year: str = None) -> List[Dict]:
        """Get assessment plans"""
        filters = []
        if course:
            filters.append(["course", "=", course])
        if academic_year:
            filters.append(["academic_year", "=", academic_year])

        params = {
            "limit_page_length": 100,
            "fields": json.dumps([
                "name", "assessment_name", "course", "maximum_assessment_score",
                "assessment_criteria", "grading_scale"
            ])
        }

        if filters:
            params["filters"] = json.dumps(filters)

        result = await self._make_request("GET", "/api/resource/Assessment Plan", params=params)
        return result.get("data", []) if result else []

    # UTILITY METHODS
    async def search_students(self, query: str, limit: int = 10) -> List[Dict]:
        """Search students by name or email"""
        filters = [
            "or",
            ["student_name", "like", f"%{query}%"],
            ["student_email_id", "like", f"%{query}%"]
        ]

        params = {
            "filters": json.dumps(filters),
            "limit_page_length": limit,
            "fields": json.dumps(["name", "student_name", "student_email_id", "student_batch_name"])
        }

        result = await self._make_request("GET", "/api/resource/Student", params=params)
        return result.get("data", []) if result else []

    async def get_academic_years(self) -> List[Dict]:
        """Get available academic years"""
        params = {
            "fields": json.dumps(["name", "academic_year_name", "year_start_date", "year_end_date"])
        }

        result = await self._make_request("GET", "/api/resource/Academic Year", params=params)
        return result.get("data", []) if result else []

    async def get_academic_terms(self, academic_year: str = None) -> List[Dict]:
        """Get academic terms"""
        params = {
            "fields": json.dumps(["name", "academic_year", "term_name", "term_start_date", "term_end_date"])
        }

        if academic_year:
            params["filters"] = json.dumps([["academic_year", "=", academic_year]])

        result = await self._make_request("GET", "/api/resource/Academic Term", params=params)
        return result.get("data", []) if result else []

    # BATCH OPERATIONS FOR SYNC
    async def get_recent_updates(self, entity_type: str, since: str) -> List[Dict]:
        """Get recently updated records for sync"""
        entity_map = {
            "students": "Student",
            "instructors": "Instructor",
            "courses": "Course",
            "assessments": "Assessment Result",
            "attendance": "Student Attendance",
            "schedules": "Course Schedule"
        }

        if entity_type not in entity_map:
            return []

        doctype = entity_map[entity_type]
        params = {
            "filters": json.dumps([["modified", ">=", since]]),
            "limit_page_length": 100,
            "order_by": "modified desc"
        }

        result = await self._make_request("GET", f"/api/resource/{doctype}", params=params)
        return result.get("data", []) if result else []

    async def test_connection(self) -> bool:
        """Test ERPNext API connection"""
        try:
            result = await self._make_request("GET", "/api/method/frappe.auth.get_logged_user")
            return result is not None
        except:
            return False

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()