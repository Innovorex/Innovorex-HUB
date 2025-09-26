# Data Mapping Specification
## ERPNext ↔ AI System Integration - Phase 0C

### 🎯 Data Mapping Overview

#### Purpose
This document provides comprehensive mapping between ERPNext Education Module entities and the AI System database structure, ensuring seamless bidirectional data synchronization while maintaining data integrity and relationships.

#### Mapping Principles
```yaml
Data Flow Rules:
  - ERPNext is the authoritative source for all master data
  - AI system adds enhancement fields without modifying core data
  - Bidirectional sync maintains data consistency
  - Conflict resolution favors ERPNext for master data
  - AI insights flow back to ERPNext as custom fields

Relationship Preservation:
  - All ERPNext relationships maintained in AI system
  - Foreign key constraints preserved through mapping
  - Hierarchical data structures replicated
  - Many-to-many relationships properly mapped
```

### 📊 Core Entity Mappings

#### Student Entity Mapping
```yaml
ERPNext Student DocType → AI System student_profiles Table

Direct Field Mappings:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  name (ID)                  → erpnext_student_id           → VARCHAR(140)
  student_name               → student_name                 → VARCHAR(200)
  student_email_id           → student_email                → VARCHAR(150)
  date_of_birth              → date_of_birth                → DATE
  gender                     → gender                       → VARCHAR(20)
  blood_group                → blood_group                  → VARCHAR(10)
  student_mobile_number      → mobile_number                → VARCHAR(20)
  admission_date             → admission_date               → DATE
  student_batch_name         → current_batch                → VARCHAR(100)
  title                      → title                        → VARCHAR(50)
  middle_name                → middle_name                  → VARCHAR(100)
  last_name                  → last_name                    → VARCHAR(100)

Guardian Information Mapping:
  ERPNext Student Guardian   → AI System guardian_info      → JSONB
  {
    "guardians": [
      {
        "guardian_name": "string",
        "relation": "string",
        "email_id": "string",
        "mobile_number": "string",
        "alternate_number": "string",
        "education": "string",
        "occupation": "string"
      }
    ]
  }

AI Enhancement Fields (Custom in ERPNext):
  ai_learning_profile        → learning_profile             → JSONB
  ai_preferences_settings    → preferences_settings         → JSONB
  ai_interaction_summary     → interaction_summary          → TEXT
  ai_performance_insights    → performance_insights         → JSONB
  ai_last_sync_timestamp     → last_sync_timestamp          → TIMESTAMP

Address Information:
  ERPNext Address Link       → AI System address_info       → JSONB
  {
    "addresses": [
      {
        "address_type": "Current/Permanent",
        "address_line1": "string",
        "address_line2": "string",
        "city": "string",
        "state": "string",
        "pincode": "string",
        "country": "string"
      }
    ]
  }
```

#### Instructor Entity Mapping
```yaml
ERPNext Instructor DocType → AI System instructor_profiles Table

Direct Field Mappings:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  name (ID)                  → erpnext_instructor_id        → VARCHAR(140)
  instructor_name            → instructor_name              → VARCHAR(200)
  email                      → email                        → VARCHAR(150)
  mobile_no                  → mobile_number                → VARCHAR(20)
  department                 → department                   → VARCHAR(100)
  employee_id                → employee_id                  → VARCHAR(50)
  date_of_joining            → date_of_joining              → DATE
  designation                → designation                  → VARCHAR(100)

Qualification and Expertise:
  ERPNext Instructor Log     → AI System qualifications     → JSONB
  {
    "qualifications": [
      {
        "qualification": "string",
        "year_of_passing": "integer",
        "class_percentage": "float",
        "institution": "string"
      }
    ],
    "expertise_areas": ["string", "string", ...],
    "certifications": ["string", "string", ...]
  }

AI Enhancement Fields (Custom in ERPNext):
  ai_teaching_profile        → teaching_profile             → JSONB
  ai_assistance_preferences  → assistance_preferences       → JSONB
  ai_insights_config         → insights_config              → JSONB
  ai_performance_metrics     → performance_metrics          → JSONB
```

#### Course Entity Mapping
```yaml
ERPNext Course DocType → AI System courses Table

Direct Field Mappings:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  name (ID)                  → erpnext_course_id            → VARCHAR(140)
  course_name                → course_name                  → VARCHAR(200)
  course_code                → course_code                  → VARCHAR(50)
  department                 → department                   → VARCHAR(100)
  course_intro               → course_description           → TEXT
  is_published               → is_active                    → BOOLEAN

Course Content Structure:
  ERPNext Topic             → AI System course_topics       → JSONB
  {
    "topics": [
      {
        "topic_name": "string",
        "topic_description": "string",
        "content_type": "string",
        "content_url": "string",
        "duration_hours": "float",
        "learning_objectives": ["string", ...]
      }
    ]
  }

AI Enhancement Fields (Custom in ERPNext):
  ai_content_mapping         → content_mapping              → JSONB
  ai_difficulty_profile      → difficulty_profile           → JSONB
  ai_learning_objectives     → ai_learning_objectives       → JSONB
  ai_resource_links          → ai_resource_links            → JSONB
```

### 📚 Academic Performance Mapping

#### Assessment Result Mapping
```yaml
ERPNext Assessment Result → AI System assessment_results Table

Direct Field Mappings:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  name (ID)                  → erpnext_assessment_id        → VARCHAR(140)
  student                    → erpnext_student_id           → VARCHAR(140)
  assessment_plan            → assessment_plan_id           → VARCHAR(140)
  result                     → raw_score                    → FLOAT
  grade                      → grade                        → VARCHAR(10)
  grading_scale              → grading_scale                → VARCHAR(50)
  total_score                → total_score                  → FLOAT
  maximum_score              → maximum_score                → FLOAT

Assessment Details:
  ERPNext Assessment Plan    → AI System assessment_details → JSONB
  {
    "assessment_name": "string",
    "assessment_type": "Quiz/Assignment/Exam",
    "course": "string",
    "maximum_assessment_score": "float",
    "assessment_criteria": [
      {
        "assessment_criteria": "string",
        "maximum_score": "float",
        "weightage": "float"
      }
    ]
  }

AI Enhancement Fields:
  ai_performance_analysis    → performance_analysis         → JSONB
  ai_learning_gaps          → learning_gaps                → JSONB
  ai_improvement_suggestions → improvement_suggestions      → JSONB
  ai_mastery_level          → mastery_level                → VARCHAR(50)
```

#### Student Attendance Mapping
```yaml
ERPNext Student Attendance → AI System attendance_records Table

Direct Field Mappings:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  name (ID)                  → erpnext_attendance_id        → VARCHAR(140)
  student                    → erpnext_student_id           → VARCHAR(140)
  course_schedule            → course_schedule_id           → VARCHAR(140)
  status                     → attendance_status            → VARCHAR(20)
  attendance_date            → attendance_date              → DATE
  student_group              → student_group_id             → VARCHAR(140)

Course Context:
  ERPNext Course Schedule    → AI System schedule_context   → JSONB
  {
    "course": "string",
    "instructor": "string",
    "from_time": "string",
    "to_time": "string",
    "room": "string",
    "subject": "string"
  }

AI Enhancement Fields:
  ai_engagement_score        → engagement_score             → FLOAT
  ai_participation_level     → participation_level          → VARCHAR(50)
  ai_attention_metrics       → attention_metrics            → JSONB
```

### 🗓️ Scheduling and Enrollment Mapping

#### Program Enrollment Mapping
```yaml
ERPNext Program Enrollment → AI System program_enrollments Table

Direct Field Mappings:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  name (ID)                  → erpnext_enrollment_id        → VARCHAR(140)
  student                    → erpnext_student_id           → VARCHAR(140)
  program                    → program_id                   → VARCHAR(140)
  academic_year              → academic_year                → VARCHAR(20)
  academic_term              → academic_term                → VARCHAR(50)
  enrollment_date            → enrollment_date              → DATE
  student_batch_name         → batch_name                   → VARCHAR(100)

Program Details:
  ERPNext Program           → AI System program_details     → JSONB
  {
    "program_name": "string",
    "program_code": "string",
    "department": "string",
    "duration": "integer",
    "description": "string"
  }

AI Enhancement Fields:
  ai_progress_tracking       → progress_tracking            → JSONB
  ai_learning_path          → learning_path                → JSONB
  ai_intervention_history    → intervention_history         → JSONB
```

#### Course Schedule Mapping
```yaml
ERPNext Course Schedule → AI System course_schedules Table

Direct Field Mappings:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  name (ID)                  → erpnext_schedule_id          → VARCHAR(140)
  course                     → erpnext_course_id            → VARCHAR(140)
  instructor                 → erpnext_instructor_id        → VARCHAR(140)
  student_group              → student_group_id             → VARCHAR(140)
  schedule_date              → schedule_date                → DATE
  from_time                  → start_time                   → TIME
  to_time                    → end_time                     → TIME
  room                       → room                         → VARCHAR(100)
  color                      → color_code                   → VARCHAR(20)

Student Group Context:
  ERPNext Student Group     → AI System group_context       → JSONB
  {
    "group_name": "string",
    "batch": "string",
    "academic_year": "string",
    "academic_term": "string",
    "max_strength": "integer",
    "student_count": "integer"
  }

AI Enhancement Fields:
  ai_optimal_timing         → optimal_timing               → JSONB
  ai_engagement_prediction  → engagement_prediction        → FLOAT
  ai_resource_suggestions   → resource_suggestions         → JSONB
```

### 🔗 Relationship Mapping

#### Student Group Membership
```yaml
ERPNext Student Group Student → AI System group_memberships Table

Mapping Structure:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  parent (Student Group)     → student_group_id             → VARCHAR(140)
  student                    → erpnext_student_id           → VARCHAR(140)
  group_roll_number          → roll_number                  → VARCHAR(20)
  active                     → is_active                    → BOOLEAN

Relationship Context:
  group_type                 → group_type                   → VARCHAR(50)
  academic_year              → academic_year                → VARCHAR(20)
  academic_term              → academic_term                → VARCHAR(50)
```

#### Student-Parent Relationships
```yaml
ERPNext Student Guardian → AI System parent_relationships Table

Mapping Structure:
  ERPNext Field               → AI System Field              → Data Type
  ─────────────────────────────────────────────────────────────────────
  student                    → erpnext_student_id           → VARCHAR(140)
  guardian                   → erpnext_guardian_id          → VARCHAR(140)
  relation                   → relationship_type            → VARCHAR(50)

Guardian Details from ERPNext Guardian DocType:
  guardian_name              → guardian_name                → VARCHAR(200)
  email_id                   → email                        → VARCHAR(150)
  mobile_number              → mobile_number                → VARCHAR(20)
  date_of_birth              → date_of_birth                → DATE
  occupation                 → occupation                   → VARCHAR(100)

AI Enhancement Fields:
  ai_communication_preferences → communication_preferences   → JSONB
  ai_involvement_score       → involvement_score            → FLOAT
```

### 🤖 AI-Specific Data Structures

#### AI Chat Interactions
```yaml
AI System Exclusive Table: ai_chat_interactions

Field Structure:
  id                         → UUID PRIMARY KEY
  erpnext_student_id         → VARCHAR(140) [Foreign Key]
  session_id                 → UUID
  interaction_timestamp      → TIMESTAMP WITH TIME ZONE
  question_text              → TEXT
  ai_response               → TEXT
  context_data              → JSONB
  {
    "current_course": "string",
    "current_topic": "string",
    "difficulty_level": "string",
    "learning_objective": "string",
    "prior_interactions": ["string", ...]
  }
  academic_integrity_score   → FLOAT (0.0 to 1.0)
  learning_objective        → VARCHAR(500)
  subject_area              → VARCHAR(100)
  help_type                 → VARCHAR(50) [explanation, hint, example, etc.]
  independence_level        → VARCHAR(50) [high, medium, low]
```

#### Knowledge Base Content
```yaml
AI System Table: knowledge_base_content

ERPNext Source Mapping:
  Content can be sourced from:
  - Course Topics (ERPNext Topic DocType)
  - Course Content (ERPNext Content DocType)
  - Instructor uploads via AI system
  - External educational resources

Field Structure:
  id                        → UUID PRIMARY KEY
  erpnext_course_id         → VARCHAR(140) [Links to Course]
  erpnext_topic_id          → VARCHAR(140) [Links to Topic if applicable]
  content_title             → VARCHAR(500)
  content_type              → VARCHAR(100) [document, video, exercise, etc.]
  content_url               → TEXT
  content_text              → TEXT [Extracted/processed content]
  ai_processed_content      → JSONB
  {
    "summary": "string",
    "key_concepts": ["string", ...],
    "difficulty_keywords": ["string", ...],
    "learning_objectives": ["string", ...],
    "prerequisites": ["string", ...],
    "related_topics": ["string", ...]
  }
  difficulty_level          → INTEGER (1-10 scale)
  estimated_duration        → INTEGER [minutes]
  subject_tags              → TEXT[] [Array of subject areas]
```

#### AI Insights and Analytics
```yaml
AI System Table: ai_insights

Insight Target Mapping:
  target_type               → VARCHAR(50) [student, instructor, course, class]
  target_erpnext_id         → VARCHAR(140) [ID of target entity in ERPNext]

Insight Data Structure:
  insight_type              → VARCHAR(100)
    - performance_analysis
    - learning_recommendation
    - intervention_alert
    - teaching_suggestion
    - scheduling_optimization
    - resource_recommendation

  insight_data              → JSONB
  For Student Insights:
  {
    "student_id": "string",
    "performance_trends": {
      "improving_areas": ["string", ...],
      "struggling_areas": ["string", ...],
      "overall_trajectory": "improving/stable/declining"
    },
    "learning_patterns": {
      "optimal_learning_times": ["string", ...],
      "preferred_content_types": ["string", ...],
      "interaction_frequency": "high/medium/low"
    },
    "recommendations": {
      "study_strategies": ["string", ...],
      "resource_suggestions": ["string", ...],
      "peer_collaboration": ["string", ...]
    }
  }

  For Instructor Insights:
  {
    "instructor_id": "string",
    "teaching_effectiveness": {
      "student_engagement_score": "float",
      "concept_clarity_rating": "float",
      "teaching_pace_feedback": "string"
    },
    "suggestions": {
      "content_recommendations": ["string", ...],
      "teaching_method_suggestions": ["string", ...],
      "professional_development": ["string", ...]
    }
  }
```

### 🔄 Synchronization Mapping Rules

#### Sync Direction Rules
```yaml
ERPNext → AI System (Pull Updates):
  Always Sync:
    - Student master data updates
    - Instructor profile changes
    - Course information modifications
    - Academic record entries
    - Attendance records
    - Schedule changes
    - Enrollment updates

  Conditional Sync:
    - Only when AI system is active
    - Only for enrolled program students
    - Only during academic periods

AI System → ERPNext (Push Updates):
  AI Enhancement Fields:
    - ai_learning_profile updates
    - ai_performance_insights
    - ai_engagement_metrics
    - ai_recommendation_data

  New AI-Generated Records:
    - AI Insight records (custom DocType)
    - AI Engagement Logs (custom DocType)
    - AI Performance Analytics (custom DocType)

  Never Sync to ERPNext:
    - AI chat conversation details
    - Temporary session data
    - Debug and logging information
    - Intermediate calculation data
```

#### Data Transformation Rules
```yaml
Data Type Conversions:
  ERPNext Date → AI System:
    - Convert to ISO 8601 format
    - Store as DATE type in PostgreSQL
    - Handle timezone conversions

  ERPNext Currency → AI System:
    - Store as DECIMAL with appropriate precision
    - Maintain currency code separately
    - Handle exchange rate considerations

  ERPNext Select Fields → AI System:
    - Map to ENUM types where applicable
    - Maintain option list synchronization
    - Handle custom field additions

  ERPNext JSON Fields → AI System:
    - Direct mapping to JSONB
    - Validate JSON structure
    - Handle schema evolution

Null Value Handling:
  - ERPNext empty strings → AI System NULL
  - Maintain NOT NULL constraints where appropriate
  - Default value assignments for required fields

Text Field Limitations:
  - ERPNext Text field → AI System TEXT (unlimited)
  - ERPNext Data field → AI System VARCHAR with length limit
  - Handle truncation gracefully with warnings
```

### 📊 Validation and Integrity Checks

#### Data Validation Rules
```yaml
Cross-System Validation:
  Student Validation:
    - Email uniqueness across both systems
    - Student ID consistency
    - Guardian relationship integrity
    - Enrollment status consistency

  Academic Record Validation:
    - Grade scale consistency
    - Assessment result ranges
    - Attendance date validity
    - Schedule conflict detection

  Relationship Validation:
    - Student-course enrollments exist
    - Instructor-course assignments valid
    - Student group memberships current
    - Parent-student relationships active

Integrity Constraints:
  Referential Integrity:
    - All foreign keys must resolve
    - Orphaned records detection and cleanup
    - Cascade deletion rules
    - Cross-system reference validation

  Business Rule Validation:
    - Academic year date ranges
    - Enrollment prerequisites
    - Assessment eligibility
    - Schedule time conflicts
```

#### Sync Validation Procedures
```python
class DataMappingValidator:
    """
    Validation procedures for data mapping integrity
    """

    async def validate_student_mapping(self, erpnext_student: dict,
                                     ai_student: dict) -> ValidationResult:
        """Validate student data mapping accuracy"""
        errors = []
        warnings = []

        # Validate required field mappings
        required_fields = [
            ('name', 'erpnext_student_id'),
            ('student_name', 'student_name'),
            ('student_email_id', 'student_email')
        ]

        for erp_field, ai_field in required_fields:
            if erpnext_student.get(erp_field) != ai_student.get(ai_field):
                errors.append(f"Field mismatch: {erp_field} → {ai_field}")

        # Validate guardian data structure
        if 'guardians' in erpnext_student:
            ai_guardians = json.loads(ai_student.get('guardian_info', '{}'))
            if len(erpnext_student['guardians']) != len(ai_guardians.get('guardians', [])):
                warnings.append("Guardian count mismatch")

        return ValidationResult(errors=errors, warnings=warnings)

    async def validate_relationship_integrity(self) -> ValidationResult:
        """Validate all relationship mappings"""
        # Check student-course enrollments
        orphaned_enrollments = await self.find_orphaned_enrollments()

        # Check instructor-course assignments
        invalid_assignments = await self.find_invalid_assignments()

        # Check student group memberships
        stale_memberships = await self.find_stale_memberships()

        return ValidationResult(
            orphaned_records=orphaned_enrollments,
            invalid_records=invalid_assignments,
            stale_records=stale_memberships
        )
```

---

**Document Control:**
- Version: 1.0
- Owner: Data Architecture Team
- Review Cycle: Weekly during Phase 0C
- Distribution: Development team, integration specialists, data analysts