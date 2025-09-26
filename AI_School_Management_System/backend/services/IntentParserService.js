// IntentParserService.js - AI-powered intent parsing for portal actions
const axios = require('axios');

// OpenRouter configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const AI_MODEL = 'meta-llama/llama-3.3-8b-instruct:free';

class IntentParserService {
  constructor() {
    this.actionPatterns = this.initializeActionPatterns();
  }

  initializeActionPatterns() {
    return {
      // User Management
      create_user: {
        patterns: [
          /(?:add|create|register|enroll)\s+(?:a\s+)?(?:new\s+)?(?:student|teacher|user|instructor)/i,
          /(?:add|create)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:as|to|in)/i,
        ],
        entityExtractors: {
          first_name: (text) => {
            const match = text.match(/(?:add|create|register)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?/i);
            return match ? match[1] : null;
          },
          last_name: (text) => {
            const match = text.match(/(?:add|create|register)\s+[A-Z][a-z]+\s+([A-Z][a-z]+)/i);
            return match ? match[1] : null;
          },
          fullName: (text) => {
            const match = text.match(/(?:add|create|register)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          grade: (text) => {
            const match = text.match(/(\d+)(?:th|st|nd|rd)?\s*(?:grade|class|std|standard)/i);
            return match ? match[1] : null;
          },
          gender: (text) => {
            const match = text.match(/\b(male|female|boy|girl|man|woman)\b/i);
            if (match) {
              const gender = match[1].toLowerCase();
              if (gender === 'boy' || gender === 'man') return 'Male';
              if (gender === 'girl' || gender === 'woman') return 'Female';
              return gender.charAt(0).toUpperCase() + gender.slice(1);
            }
            return null;
          },
          email: (text) => {
            const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            return match ? match[0] : null;
          },
          role: (text) => {
            if (text.toLowerCase().includes('student')) return 'student';
            if (text.toLowerCase().includes('teacher') || text.toLowerCase().includes('instructor')) return 'teacher';
            if (text.toLowerCase().includes('admin')) return 'admin';
            return null;
          },
        }
      },
      update_user: {
        patterns: [
          /(?:update|change|modify|edit)\s+(?:user|email|password|details)/i,
          /(?:update|change|modify)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+to\s+/i,
          /(?:update|upgrade|move)\s+\w+\s+to\s+(?:\d+(?:th|st|nd|rd)?\s*(?:grade|std|standard|class))/i,
        ],
        entityExtractors: {
          userId: (text) => {
            // Try to extract email first
            const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            if (emailMatch) return emailMatch[0];

            // Otherwise extract the name being updated
            const nameMatch = text.match(/(?:update|change|modify)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return nameMatch ? nameMatch[1] : null;
          },
          fullName: (text) => {
            const match = text.match(/(?:update|change|modify)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          grade: (text) => {
            const match = text.match(/to\s+(\d+)(?:th|st|nd|rd)?\s*(?:grade|std|standard|class)/i);
            return match ? match[1] : null;
          },
        }
      },
      search_user: {
        patterns: [
          /(?:search|find|list|show)\s+(?:for\s+)?(?:all\s+)?(?:users|students|teachers)/i,
        ],
        entityExtractors: {
          searchTerm: (text) => {
            if (text.toLowerCase().includes('teacher')) return 'teacher';
            if (text.toLowerCase().includes('student')) return 'student';
            return null;
          },
        }
      },
      delete_user: {
        patterns: [
          /(?:delete|remove|deactivate)\s+(?:user|student|teacher)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
          /(?:delete|remove)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$/i,
          /(?:delete|remove)\s+\w+/i,
        ],
        entityExtractors: {
          userId: (text) => {
            // Extract email if present
            const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
            if (emailMatch) return emailMatch[0];

            // Extract name after delete/remove
            const nameMatch = text.match(/(?:delete|remove|deactivate)\s+(?:user|student|teacher)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return nameMatch ? nameMatch[1] : null;
          },
          fullName: (text) => {
            const match = text.match(/(?:delete|remove|deactivate)\s+(?:user|student|teacher)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
        }
      },

      // Program Management
      create_program: {
        patterns: [
          /(?:create|add|setup|establish)\s+(?:a\s+)?(?:new\s+)?(?:program|course\s+program|academic\s+program)/i,
          /(?:create|add)\s+(?:a\s+)?([A-Za-z\s]+)\s+program/i,
        ],
        entityExtractors: {
          program_name: (text) => {
            const match = text.match(/(?:create|add)\s+(?:a\s+)?([A-Za-z\s]+)\s+program/i);
            return match ? match[1].trim() : null;
          },
          duration: (text) => {
            const match = text.match(/(\d+)\s*(?:year|yr)/i);
            return match ? parseInt(match[1]) : null;
          },
          department: (text) => {
            const depts = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering'];
            for (const dept of depts) {
              if (text.toLowerCase().includes(dept.toLowerCase())) return dept;
            }
            return null;
          },
        }
      },
      enroll_in_program: {
        patterns: [
          /(?:enroll|add|assign)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:in|to)\s+(?:\w+\s+)?program/i,
        ],
        entityExtractors: {
          student: (text) => {
            const match = text.match(/(?:enroll|add)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          program: (text) => {
            const match = text.match(/(?:in|to)\s+(\w+)\s+program/i);
            return match ? match[1] : null;
          },
          academic_year: (text) => {
            const match = text.match(/(\d{4}-\d{4})/);
            return match ? match[1] : null;
          },
        }
      },

      // Course Management
      create_course: {
        patterns: [
          /(?:create|add|setup)\s+(?:a\s+)?(?:new\s+)?course/i,
          /(?:add|create)\s+([A-Za-z\s]+)\s+course/i,
        ],
        entityExtractors: {
          course_name: (text) => {
            const match = text.match(/(?:add|create)\s+(?:a\s+)?([A-Za-z\s]+)\s+course/i);
            return match ? match[1].trim() : null;
          },
          course_code: (text) => {
            const match = text.match(/\b([A-Z]{2,4}\d{3,4})\b/);
            return match ? match[1] : null;
          },
          credits: (text) => {
            const match = text.match(/(\d+)\s*credits?/i);
            return match ? parseInt(match[1]) : null;
          },
        }
      },
      assign_instructor: {
        patterns: [
          /(?:assign|add)\s+(?:Dr\.|Prof\.)?[^to]+\s+to\s+teach/i,
        ],
        entityExtractors: {
          instructor: (text) => {
            const match = text.match(/(?:assign|add)\s+(?:Dr\.|Prof\.)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          course: (text) => {
            const match = text.match(/teach\s+([A-Za-z]+)/i);
            return match ? match[1] : null;
          },
        }
      },
      create_course_schedule: {
        patterns: [
          /(?:create|set|add)\s+schedule\s+for/i,
        ],
        entityExtractors: {
          course: (text) => {
            const match = text.match(/\b([A-Z]{2,4}\d{3,4})\b/);
            return match ? match[1] : null;
          },
          day: (text) => {
            const match = text.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
            return match ? match[1] : null;
          },
          room: (text) => {
            const match = text.match(/room\s+(\w+)/i);
            return match ? match[1] : null;
          },
        }
      },

      // Student Management
      create_student: {
        patterns: [
          /(?:create|add|register)\s+(?:a\s+)?(?:new\s+)?student/i,
        ],
        entityExtractors: {
          first_name: (text) => {
            const match = text.match(/student\s+([A-Z][a-z]+)/i);
            return match ? match[1] : null;
          },
          last_name: (text) => {
            const match = text.match(/student\s+[A-Z][a-z]+\s+([A-Z][a-z]+)/i);
            return match ? match[1] : null;
          },
          date_of_birth: (text) => {
            const match = text.match(/born\s+on\s+(\d{4}-\d{2}-\d{2})/i);
            return match ? match[1] : null;
          },
        }
      },
      create_student_group: {
        patterns: [
          /(?:create|add)\s+student\s+group/i,
        ],
        entityExtractors: {
          group_name: (text) => {
            const match = text.match(/group\s+(Section\s+[A-Z])/i);
            return match ? match[1] : null;
          },
          program: (text) => {
            const match = text.match(/for\s+([A-Za-z\s]+)\s+with/i);
            return match ? match[1].trim() : null;
          },
          max_strength: (text) => {
            const match = text.match(/(\d+)\s+seats/i);
            return match ? match[1] : null;
          },
        }
      },
      create_guardian: {
        patterns: [
          /(?:add|create)\s+guardian/i,
        ],
        entityExtractors: {
          guardian_name: (text) => {
            const match = text.match(/guardian\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          relation: (text) => {
            const match = text.match(/as\s+(father|mother|guardian)/i);
            return match ? match[1] : null;
          },
          student: (text) => {
            const match = text.match(/for\s+student\s+(\S+@\S+)/i);
            return match ? match[1] : null;
          },
        }
      },

      // Instructor Management
      create_instructor: {
        patterns: [
          /(?:add|create|hire)\s+(?:Dr\.|Prof\.)?\s*[^as]+\s+as\s+(?:professor|instructor|teacher)/i,
        ],
        entityExtractors: {
          employee_name: (text) => {
            const match = text.match(/(?:add|create)\s+(?:Dr\.|Prof\.)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          designation: (text) => {
            const match = text.match(/as\s+(Professor|Associate Professor|Assistant Professor|Lecturer)/i);
            return match ? match[1] : null;
          },
          department: (text) => {
            const match = text.match(/in\s+([A-Za-z]+)\s+department/i);
            return match ? match[1] : null;
          },
        }
      },
      assign_course_to_instructor: {
        patterns: [
          /(?:assign|give)\s+(\w+)\s+course\s+to/i,
        ],
        entityExtractors: {
          instructor: (text) => {
            const match = text.match(/to\s+(?:Dr\.|Prof\.)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          course: (text) => {
            const match = text.match(/(?:assign|give)\s+(\w+)\s+course/i);
            return match ? match[1] : null;
          },
          academic_year: (text) => {
            const match = text.match(/for\s+(\d{4}-\d{4})/);
            return match ? match[1] : null;
          },
        }
      },

      // Attendance
      mark_attendance: {
        patterns: [
          /(?:mark|record)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:present|absent)/i,
        ],
        entityExtractors: {
          student: (text) => {
            const match = text.match(/(?:mark|record)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          status: (text) => {
            if (text.includes('present')) return 'present';
            if (text.includes('absent')) return 'absent';
            return null;
          },
          course: (text) => {
            const match = text.match(/for\s+(\w+)\s+class/i);
            return match ? match[1] : null;
          },
        }
      },
      create_leave_application: {
        patterns: [
          /(?:submit|create|apply)\s+leave\s+application/i,
        ],
        entityExtractors: {
          reason: (text) => {
            const match = text.match(/due\s+to\s+([^.]+)/i);
            return match ? match[1] : null;
          },
        }
      },
      bulk_attendance: {
        patterns: [
          /mark\s+all\s+students?\s+in/i,
        ],
        entityExtractors: {
          student_group: (text) => {
            const match = text.match(/in\s+(Section\s+[A-Z])/i);
            return match ? match[1] : null;
          },
        }
      },

      // Assessment
      create_assessment: {
        patterns: [
          /(?:create|schedule)\s+(?:midterm|final|exam|test|assessment)/i,
        ],
        entityExtractors: {
          assessment_name: (text) => {
            const match = text.match(/(?:create|schedule)\s+(\w+)\s+(?:exam|test)/i);
            return match ? match[1] : null;
          },
          course: (text) => {
            const match = text.match(/for\s+(\w+)\s+worth/i);
            return match ? match[1] : null;
          },
          maximum_marks: (text) => {
            const match = text.match(/worth\s+(\d+)\s+marks/i);
            return match ? match[1] : null;
          },
        }
      },
      submit_grades: {
        patterns: [
          /(?:submit|record|enter)\s+grade/i,
        ],
        entityExtractors: {
          student: (text) => {
            const match = text.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          marks_obtained: (text) => {
            const match = text.match(/grade\s+(\d+)/i);
            return match ? match[1] : null;
          },
          assessment: (text) => {
            const match = text.match(/in\s+(\w+)\s+exam/i);
            return match ? match[1] : null;
          },
        }
      },
      generate_report_card: {
        patterns: [
          /(?:generate|create)\s+report\s+card/i,
        ],
        entityExtractors: {
          student: (text) => {
            const match = text.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          academic_term: (text) => {
            const match = text.match(/for\s+(?:Semester|Term)\s+(\d+)/i);
            return match ? match[1] : null;
          },
        }
      },

      // Fees Management
      create_fee_structure: {
        patterns: [
          /(?:create|set|define)\s+(?:tuition\s+)?fee\s+structure/i,
        ],
        entityExtractors: {
          program: (text) => {
            const match = text.match(/for\s+([A-Za-z\s]+)\s+program/i);
            return match ? match[1].trim() : null;
          },
          amount: (text) => {
            const match = text.match(/of\s+(\d+)/i);
            return match ? match[1] : null;
          },
          fee_category: (text) => {
            if (text.includes('tuition')) return 'tuition';
            return null;
          },
        }
      },
      record_payment: {
        patterns: [
          /(?:record|receive)\s+payment/i,
        ],
        entityExtractors: {
          student: (text) => {
            const match = text.match(/from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
            return match ? match[1] : null;
          },
          amount: (text) => {
            const match = text.match(/of\s+(\d+)/i);
            return match ? match[1] : null;
          },
          payment_mode: (text) => {
            if (text.includes('bank transfer')) return 'bank_transfer';
            if (text.includes('cash')) return 'cash';
            if (text.includes('card')) return 'card';
            return null;
          },
        }
      },
      generate_invoice: {
        patterns: [
          /(?:generate|create)\s+invoice/i,
        ],
        entityExtractors: {}
      },

      // Academic Settings
      create_academic_year: {
        patterns: [
          /(?:create|add)\s+academic\s+year/i,
        ],
        entityExtractors: {
          academic_year_name: (text) => {
            const match = text.match(/year\s+(\d{4}-\d{4})/i);
            return match ? match[1] : null;
          },
          year_start_date: (text) => {
            const match = text.match(/from\s+([A-Za-z]+\s+\d+)/i);
            return match ? match[1] : null;
          },
        }
      },
      create_academic_term: {
        patterns: [
          /(?:create|add)\s+(?:Fall|Spring|Summer|Winter)\s+(?:semester|term)/i,
        ],
        entityExtractors: {
          term_name: (text) => {
            const match = text.match(/(?:create|add)\s+([A-Za-z]+)\s+(?:semester|term)/i);
            return match ? match[1] : null;
          },
        }
      },
      create_room: {
        patterns: [
          /(?:add|create)\s+(?:new\s+)?(?:computer\s+lab|classroom|room)/i,
        ],
        entityExtractors: {
          room_name: (text) => {
            const match = text.match(/(?:Room|room)\s+(\w+)/i);
            return match ? `Room ${match[1]}` : null;
          },
          seating_capacity: (text) => {
            const match = text.match(/(\d+)\s+seats/i);
            return match ? match[1] : null;
          },
        }
      },

      // Dashboard
      generate_attendance_report: {
        patterns: [
          /(?:generate|create)\s+attendance\s+report/i,
        ],
        entityExtractors: {
          report_type: () => 'attendance',
        }
      },
      generate_performance_report: {
        patterns: [
          /(?:generate|create)\s+performance\s+report/i,
        ],
        entityExtractors: {
          report_type: () => 'performance',
        }
      },

      // Knowledge Base
      upload_document: {
        patterns: [
          /(?:upload|add)\s+(?:\w+\s+)?(?:notes|document|file)/i,
        ],
        entityExtractors: {
          title: (text) => {
            const match = text.match(/upload\s+(\w+)\s+notes/i);
            return match ? `${match[1]} notes` : null;
          },
          course_id: (text) => {
            const match = text.match(/for\s+grade\s+(\d+)/i);
            return match ? `grade_${match[1]}` : null;
          },
        }
      }
    };
  }

  async parseIntent(message, context) {
    try {
      // First try local pattern matching
      const localParsing = this.parseLocally(message, context);

      // If high confidence local parsing, return it
      if (localParsing && localParsing.confidence > 0.7) {
        return localParsing;
      }

      // Otherwise, use AI for more sophisticated parsing
      const aiParsing = await this.parseWithAI(message, context);

      // Combine results, preferring AI but using local for validation
      return this.combineResults(localParsing, aiParsing);
    } catch (error) {
      console.error('Intent parsing error:', error);
      // Fallback to local parsing only
      return this.parseLocally(message, context) || {
        action: null,
        entities: {},
        confidence: 0,
        missingFields: []
      };
    }
  }

  parseLocally(message, context) {
    const availableActions = context?.availableActions || [];

    // Check each action pattern
    for (const [actionId, config] of Object.entries(this.actionPatterns)) {
      for (const pattern of config.patterns) {
        if (pattern.test(message)) {
          // Extract entities
          const entities = {};
          for (const [field, extractor] of Object.entries(config.entityExtractors)) {
            const value = extractor(message);
            if (value) entities[field] = value;
          }

          // Find the action definition from context
          const actionDef = availableActions.find(a => a.id === actionId);
          if (!actionDef) continue;

          // Determine missing fields
          const missingFields = actionDef.requiredFields
            .filter(field => !entities[field])
            .map(field => field);

          return {
            action: actionId,
            entities,
            confidence: Object.keys(entities).length > 0 ? 0.8 : 0.5,
            missingFields
          };
        }
      }
    }

    return null;
  }

  async parseWithAI(message, context) {
    const systemPrompt = `You are an AI assistant for a school management portal. Parse the user's intent and extract structured data.

Current context:
- Module: ${context?.module || 'unknown'}
- Available actions: ${JSON.stringify(context?.availableActions?.map(a => ({ id: a.id, name: a.name })) || [])}

Analyze the user's message and respond with a JSON object containing:
{
  "action": "action_id or null if no specific action",
  "entities": {
    "field_name": "extracted_value"
  },
  "confidence": 0.0 to 1.0,
  "missingFields": ["field1", "field2"],
  "interpretation": "Brief explanation of what you understood"
}

Important:
- Extract as much information as possible from the message
- For names, preserve the exact capitalization
- For grades, extract just the number (e.g., "9" from "9th grade")
- Identify the action based on keywords like "add", "create", "update", "delete"
- List all required fields that are missing based on the action`;

    try {
      const response = await axios.post(
        `${OPENROUTER_BASE_URL}/chat/completions`,
        {
          model: AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.3, // Lower temperature for more consistent parsing
          max_tokens: 500,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://portal.innovorex.co.in',
            'X-Title': 'AI School Management System',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        try {
          const parsed = JSON.parse(response.data.choices[0].message.content);
          return {
            action: parsed.action || null,
            entities: parsed.entities || {},
            confidence: parsed.confidence || 0.5,
            missingFields: parsed.missingFields || [],
            interpretation: parsed.interpretation
          };
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          return null;
        }
      }
    } catch (error) {
      console.error('AI parsing error:', error);
      return null;
    }
  }

  combineResults(localResult, aiResult) {
    // If no AI result, use local
    if (!aiResult) return localResult || { action: null, entities: {}, confidence: 0, missingFields: [] };

    // If no local result, use AI
    if (!localResult) return aiResult;

    // Combine entities, preferring AI but validating with local
    const combinedEntities = {
      ...localResult.entities,
      ...aiResult.entities
    };

    // Use AI's action if confidence is higher
    const action = aiResult.confidence > localResult.confidence ? aiResult.action : localResult.action;

    // Combine confidence scores
    const confidence = Math.max(localResult.confidence, aiResult.confidence);

    // Use AI's missing fields as it's more comprehensive
    const missingFields = aiResult.missingFields || localResult.missingFields;

    return {
      action,
      entities: combinedEntities,
      confidence,
      missingFields,
      interpretation: aiResult.interpretation
    };
  }

  // Validate extracted entities
  validateEntities(action, entities) {
    const validationRules = {
      create_user: {
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        grade: (value) => /^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 12,
        gender: (value) => ['Male', 'Female', 'Other'].includes(value),
        role: (value) => ['student', 'teacher', 'admin'].includes(value)
      },
      create_program: {
        duration: (value) => !isNaN(value) && value > 0 && value <= 10,
      },
      create_course: {
        credits: (value) => !isNaN(value) && value > 0 && value <= 10,
        course_code: (value) => /^[A-Z]{2,4}\d{3,4}$/.test(value)
      }
    };

    const rules = validationRules[action] || {};
    const validatedEntities = { ...entities };
    const errors = [];

    for (const [field, validator] of Object.entries(rules)) {
      if (validatedEntities[field] && !validator(validatedEntities[field])) {
        errors.push(`Invalid ${field}: ${validatedEntities[field]}`);
        delete validatedEntities[field];
      }
    }

    return { validatedEntities, errors };
  }
}

module.exports = new IntentParserService();