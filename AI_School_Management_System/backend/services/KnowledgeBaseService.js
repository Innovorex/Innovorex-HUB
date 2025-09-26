// KnowledgeBaseService.js - Knowledge Base Document Management and AI Chat Service
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const pdf = require('pdf-parse');
const embeddingService = require('./EmbeddingService');

// OpenRouter configuration for free AI models
const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Free models available on OpenRouter (ordered by preference)
const FREE_MODELS = [
  'meta-llama/llama-3.3-8b-instruct:free',   // Primary: Latest Llama 3.3 8B
  'x-ai/grok-4-fast:free',                   // Grok 4 Fast
  'google/gemma-2-9b-it:free',               // Verified working - good for education
  'mistralai/mistral-7b-instruct:free',      // Popular choice
  'meta-llama/llama-3.2-1b-instruct:free',  // Smaller but reliable
  'nousresearch/hermes-3-llama-3.1-8b:free' // Sometimes works
];

// Selected free model for chat - using latest Llama 3.3 8B
const CHAT_MODEL = 'meta-llama/llama-3.3-8b-instruct:free';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.KB_UPLOAD_DIR || path.join(process.cwd(), 'uploads/knowledge-base');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, PPT, and PPTX are allowed.'));
    }
  }
});

class KnowledgeBaseService {
  constructor(erpNextConfig) {
    this.baseURL = erpNextConfig.baseURL;
    this.apiKey = erpNextConfig.apiKey;
    this.apiSecret = erpNextConfig.apiSecret;

    // File-based storage for persistence
    this.dbPath = path.join(__dirname, '..', 'data', 'kb-documents.json');
    this.chunksDbPath = path.join(__dirname, '..', 'data', 'kb-chunks.json');

    // Load documents from file
    this.documents = this.loadDocuments();
    this.documentChunks = this.loadChunks();
    this.chatSessions = new Map();

    // Initialize vector storage for embeddings
    this.vectorStore = new Map();

    // Initialize embedding service on startup
    this.initializeEmbeddings();

    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  loadDocuments() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
    return [];
  }

  saveDocuments() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.documents, null, 2));
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  }

  loadChunks() {
    try {
      if (fs.existsSync(this.chunksDbPath)) {
        const data = fs.readFileSync(this.chunksDbPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading chunks:', error);
    }
    return [];
  }

  saveChunks() {
    try {
      fs.writeFileSync(this.chunksDbPath, JSON.stringify(this.documentChunks, null, 2));
    } catch (error) {
      console.error('Error saving chunks:', error);
    }
  }

  // ==================== Document Management ====================

  async uploadDocument(req, res) {
    try {
      console.log('Upload request received:', {
        body: req.body,
        file: req.file,
        headers: req.headers['content-type']
      });

      // File has already been processed by multer middleware in the server route
      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please select a file to upload.'
        });
      }

      const { program_id, course_id, uploaded_by } = req.body;
      console.log('Upload data:', { program_id, course_id, uploaded_by, file: req.file.originalname });

      // Create document record
      const document = {
        id: uuidv4(),
        title: req.file.originalname,
        file_name: req.file.filename,
        file_type: path.extname(req.file.originalname),
        file_size: req.file.size,
        file_path: req.file.path,
        program_id,
        course_id,
        uploaded_by,
        uploaded_at: new Date().toISOString(),
        status: 'pending'
      };

      // Add program and course names (fetch from ERPNext in production)
      document.program_name = program_id; // Should fetch actual name
      document.course_name = course_id; // Should fetch actual name

      // Validate required fields
      if (!program_id || !course_id) {
        return res.status(400).json({
          success: false,
          message: 'Program ID and Course ID are required'
        });
      }

      this.documents.push(document);

      // Save to persistent storage
      this.saveDocuments();

      // Process document asynchronously
      this.processDocument(document).catch(console.error);

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        document: document
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }

  async processDocument(document) {
    try {
      // Update status to processing
      document.status = 'processing';

      // Extract text based on file type
      let text = '';
      if (document.file_type === '.pdf') {
        const dataBuffer = fs.readFileSync(document.file_path);
        const pdfData = await pdf(dataBuffer);
        text = pdfData.text;
      } else if (document.file_type === '.txt') {
        text = fs.readFileSync(document.file_path, 'utf-8');
      } else {
        // For other formats, we'd need additional libraries
        text = `Content of ${document.title}`;
      }

      // Chunk the text
      const chunks = this.chunkText(text, 1000, 200); // 1000 token chunks with 200 overlap

      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = {
          id: uuidv4(),
          document_id: document.id,
          chunk_index: i,
          content: chunks[i],
          metadata: {
            program_id: document.program_id,
            course_id: document.course_id,
            document_title: document.title
          }
        };

        // Generate embedding using local model
        try {
          const embedding = await this.generateEmbedding(chunk.content);
          if (embedding) {
            chunk.embedding = embedding;
            this.vectorStore.set(chunk.id, embedding);
            console.log(`Generated embedding for chunk ${i + 1}/${chunks.length}`);
          }
        } catch (error) {
          console.error('Embedding generation failed for chunk:', error);
        }

        this.documentChunks.push(chunk);
      }

      // Update document status
      document.status = 'processed';

      // Save chunks to persistent storage
      this.saveChunks();

      // Update document in persistent storage
      this.saveDocuments();
    } catch (error) {
      console.error('Document processing error:', error);
      document.status = 'failed';
      this.saveDocuments();
    }
  }

  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    const words = text.split(' ');

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  async generateEmbedding(text) {
    try {
      const embedding = await embeddingService.generateEmbedding(text);
      return embedding;
    } catch (error) {
      console.error('Local embedding error:', error);
      return null;
    }
  }

  async getDocuments(req, res) {
    try {
      const { program_id, course_id, search } = req.query;

      let filteredDocs = [...this.documents];

      // Filter by program
      if (program_id) {
        filteredDocs = filteredDocs.filter(doc => doc.program_id === program_id);
      }

      // Filter by course
      if (course_id) {
        filteredDocs = filteredDocs.filter(doc => doc.course_id === course_id);
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredDocs = filteredDocs.filter(doc =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.course_name.toLowerCase().includes(searchLower) ||
          doc.program_name.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        success: true,
        data: filteredDocs
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  async deleteDocument(req, res) {
    try {
      const { documentId } = req.params;

      // Find document
      const docIndex = this.documents.findIndex(doc => doc.id === documentId);
      if (docIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const document = this.documents[docIndex];

      // Delete file from filesystem
      if (fs.existsSync(document.file_path)) {
        fs.unlinkSync(document.file_path);
      }

      // Remove document chunks
      this.documentChunks = this.documentChunks.filter(chunk => chunk.document_id !== documentId);

      // Remove from documents array
      this.documents.splice(docIndex, 1);

      // Save changes to persistent storage
      this.saveDocuments();
      this.saveChunks();

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  async viewDocument(req, res) {
    try {
      const { documentId } = req.params;

      // Find document
      const document = this.documents.find(doc => doc.id === documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Check if file exists
      if (!fs.existsSync(document.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Set appropriate content type for viewing in browser
      const ext = path.extname(document.file_path).toLowerCase();
      let contentType = 'application/octet-stream';

      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.doc' || ext === '.docx') {
        contentType = 'application/msword';
      } else if (ext === '.xls' || ext === '.xlsx') {
        contentType = 'application/vnd.ms-excel';
      } else if (ext === '.ppt' || ext === '.pptx') {
        contentType = 'application/vnd.ms-powerpoint';
      } else if (ext === '.txt') {
        contentType = 'text/plain';
      } else if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (ext === '.png') {
        contentType = 'image/png';
      }

      // Set headers for inline display
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${document.title}"`);

      // Stream the file
      const fileStream = fs.createReadStream(document.file_path);
      fileStream.pipe(res);
    } catch (error) {
      console.error('View document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to view document',
        error: error.message
      });
    }
  }

  async downloadDocument(req, res) {
    try {
      const { documentId } = req.params;

      // Find document
      const document = this.documents.find(doc => doc.id === documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Check if file exists
      if (!fs.existsSync(document.file_path)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Send file
      res.download(document.file_path, document.title);
    } catch (error) {
      console.error('Download document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error.message
      });
    }
  }

  // ==================== AI Chat ====================

  async sendChatMessage(req, res) {
    try {
      const { message, program_id, course_id, session_id } = req.body;

      if (!message || !course_id) {
        return res.status(400).json({
          success: false,
          message: 'Message and course_id are required'
        });
      }

      // Get or create chat session
      let session = this.chatSessions.get(session_id);
      if (!session) {
        session = {
          id: session_id,
          messages: [],
          context_documents: []
        };
        this.chatSessions.set(session_id, session);
      }

      // Add user message to session
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Check if this is a greeting, casual chat, or course-related query
      const casualPatterns = [
        /^(hi|hello|hey|sup|yo|hola|greetings|good\s+(morning|afternoon|evening|day))$/i,
        /^(how\s+are\s+you|what'?s\s+up|how'?s\s+it\s+going|how\s+do\s+you\s+do)$/i,
        /^(what\s+is\s+your\s+name|who\s+are\s+you|tell\s+me\s+about\s+yourself)$/i,
        /^(help|help\s+me|i\s+need\s+help|can\s+you\s+help)$/i,
        /^(thanks|thank\s+you|thx|ty|appreciate\s+it)$/i,
        /^(bye|goodbye|see\s+you|later|gtg|got\s+to\s+go)$/i,
        /^(cool|nice|awesome|great|good|ok|okay|sure|yes|no|yeah|nah)$/i,
        /^(tell\s+me\s+a\s+joke|make\s+me\s+laugh|say\s+something\s+funny)$/i,
        /^(i'?m\s+bored|entertain\s+me|let'?s\s+chat)$/i,
        /^(what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities)$/i
      ];

      let relevantDocs = [];
      let context = '';
      let isCasualChat = false;

      // Check if message matches any casual pattern
      for (const pattern of casualPatterns) {
        if (pattern.test(message.trim())) {
          isCasualChat = true;
          break;
        }
      }

      // Also check for very short messages (likely casual)
      if (message.trim().length < 15 && !message.includes('?')) {
        isCasualChat = true;
      }

      // Only retrieve documents if it's not casual chat
      if (!isCasualChat) {
        // For educational questions, retrieve relevant documents
        relevantDocs = await this.retrieveRelevantDocuments(message, course_id);
        context = this.buildContext(relevantDocs);

        // If no relevant docs found but question seems educational, mark it
        if (relevantDocs.length === 0 && message.includes('?')) {
          context = 'NO_RELEVANT_DOCS';
        }
      }

      // Generate AI response
      const aiResponse = await this.generateAIResponse(message, context, session.messages);

      // Add assistant message to session
      session.messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        answer: aiResponse,
        sources: relevantDocs.slice(0, 3).map(doc => ({
          id: doc.document_id,
          title: doc.metadata.document_title
        }))
      });
    } catch (error) {
      console.error('Chat message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process chat message',
        error: error.message
      });
    }
  }

  async retrieveRelevantDocuments(query, courseId) {
    // Filter chunks by course
    const courseChunks = this.documentChunks.filter(
      chunk => chunk.metadata.course_id === courseId
    );

    if (courseChunks.length === 0) {
      return [];
    }

    // Try semantic search first if we have embeddings
    const queryEmbedding = await this.generateEmbedding(query);

    if (queryEmbedding && this.vectorStore.size > 0) {
      console.log('Using semantic search with embeddings');

      // Get embeddings for course chunks
      const chunksWithEmbeddings = courseChunks
        .map(chunk => ({
          chunk,
          embedding: this.vectorStore.get(chunk.id)
        }))
        .filter(item => item.embedding);

      if (chunksWithEmbeddings.length > 0) {
        // Calculate similarities - reduced to 3 chunks to avoid token limits
        const similarities = await embeddingService.findMostSimilar(
          queryEmbedding,
          chunksWithEmbeddings.map(item => item.embedding),
          3  // Reduced to avoid hitting token limits on free tier
        );

        // Return chunks sorted by similarity
        return similarities.map(sim => chunksWithEmbeddings[sim.index].chunk);
      }
    }

    // Fallback to keyword search if embeddings not available
    console.log('Falling back to keyword search');
    const queryWords = query.toLowerCase().split(' ');
    const scored = courseChunks.map(chunk => {
      const content = chunk.content.toLowerCase();
      const score = queryWords.reduce((acc, word) => {
        return acc + (content.includes(word) ? 1 : 0);
      }, 0);
      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(item => item.chunk);  // Reduced to 3 to avoid token limits
  }

  async initializeEmbeddings() {
    try {
      await embeddingService.initialize();
      console.log('Embedding service initialized');

      // Process any existing chunks that don't have embeddings
      await this.processExistingChunks();
    } catch (error) {
      console.error('Failed to initialize embeddings:', error);
    }
  }

  async processExistingChunks() {
    const chunksWithoutEmbeddings = this.documentChunks.filter(
      chunk => !this.vectorStore.has(chunk.id)
    );

    if (chunksWithoutEmbeddings.length > 0) {
      console.log(`Processing ${chunksWithoutEmbeddings.length} chunks without embeddings...`);

      for (let i = 0; i < chunksWithoutEmbeddings.length; i++) {
        const chunk = chunksWithoutEmbeddings[i];
        try {
          const embedding = await this.generateEmbedding(chunk.content);
          if (embedding) {
            this.vectorStore.set(chunk.id, embedding);

            // Update chunk in storage
            const chunkIndex = this.documentChunks.findIndex(c => c.id === chunk.id);
            if (chunkIndex >= 0) {
              this.documentChunks[chunkIndex].embedding = embedding;
            }
          }

          // Log progress
          if ((i + 1) % 10 === 0 || i === chunksWithoutEmbeddings.length - 1) {
            console.log(`Processed ${i + 1}/${chunksWithoutEmbeddings.length} embeddings`);
          }
        } catch (error) {
          console.error(`Failed to generate embedding for chunk ${chunk.id}:`, error);
        }
      }

      // Save updated chunks
      this.saveChunks();
      console.log('✓ All existing chunks processed');
    }
  }

  buildContext(documents) {
    if (documents.length === 0) {
      return "No relevant course materials found for this query.";
    }

    const context = documents.map(doc => doc.content).join('\n\n---\n\n');
    return `Based on the following course materials:\n\n${context}`;
  }

  cleanMarkdown(text) {
    // Remove all markdown formatting
    let cleaned = text;

    // Remove bold/italic markers
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');  // **text** → text
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');      // *text* → text
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');      // __text__ → text
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');        // _text_ → text

    // Remove headers
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');        // # Header → Header

    // Remove code blocks and inline code
    cleaned = cleaned.replace(/```[^`]*```/g, '');        // ```code``` → remove
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');        // `code` → code

    // Remove links but keep text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) → text

    // Clean up multiple spaces and newlines
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  }


  async generateAIResponse(query, context, previousMessages) {
    // Determine the type of interaction and set appropriate system prompt
    let systemPrompt;

    if (context === 'NO_RELEVANT_DOCS') {
      systemPrompt = `You are a friendly AI teaching assistant.
       The student asked a question but no relevant course materials were found.
       You should:
       1. Acknowledge that you couldn't find specific information in the course materials
       2. Suggest they rephrase or be more specific about their question
       3. Offer to help with other topics from the course
       4. Be encouraging and helpful

       CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE:
       - NEVER use markdown symbols: no #, ##, ###, **, *, __, _, backticks, etc.
       - NEVER use asterisks (*) for ANY purpose including lists or emphasis
       - NEVER use bold formatting like **text** - write it as TEXT or normally
       - For headings: Use CAPITAL LETTERS or just write normally with a colon
       - For lists: Use only dashes (-) or numbers (1., 2., 3.)
       - For emphasis: Use CAPITAL LETTERS or just normal text
       - For chemical equations: H2O, CO2, Fe3O4 (numbers after elements)
       - Use arrow symbols: → for reactions
       - Write everything in PLAIN TEXT ONLY`;
    } else if (context && context !== '') {
      systemPrompt = `You are an AI teaching assistant helping students understand course materials.
       You should:
       1. Answer based on the provided course materials
       2. If information is not complete in the materials, acknowledge this
       3. Provide clear, educational explanations
       4. Encourage understanding and critical thinking
       5. Be supportive and make learning enjoyable

       CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE:
       - NEVER use markdown symbols: no #, ##, ###, **, *, __, _, backticks, etc.
       - NEVER use asterisks (*) for ANY purpose including lists or emphasis
       - NEVER use bold formatting like **text** - write it as TEXT or normally
       - For headings: Use CAPITAL LETTERS or just write normally with a colon
       - For lists: Use only dashes (-) or numbers (1., 2., 3.)
       - For emphasis: Use CAPITAL LETTERS or just normal text
       - For chemical equations: H2O, CO2, Fe3O4 (numbers after elements)
       - Use arrow symbols: → for reactions
       - Example: 2H2 + O2 → 2H2O
       - Write everything in PLAIN TEXT ONLY`;
    } else {
      // Casual chat mode
      systemPrompt = `You are a friendly and fun AI teaching assistant chatting with students.
       You should:
       1. Be warm, approachable, and engaging
       2. Respond naturally to greetings like a friendly teacher would
       3. Use a conversational tone appropriate for students
       4. If they want to chat casually, be entertaining but appropriate
       5. For "hi" or "hello", greet them warmly and ask how you can help with their studies
       6. Keep responses concise and friendly
       7. If asked for jokes, share educational or science-related humor
       8. Always maintain a helpful, educational focus even in casual chat

       CRITICAL FORMATTING RULES:
       - NEVER use markdown symbols: no #, ##, ###, **, *, __, _, backticks, etc.
       - NEVER use asterisks (*) for ANY purpose
       - Write everything in PLAIN TEXT ONLY
       - Keep responses clean and simple`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add context if available and not a special marker
    if (context && context !== 'NO_RELEVANT_DOCS' && context !== '') {
      messages.push({
        role: 'user',
        content: `Here are relevant excerpts from the course materials:\n\n${context}\n\nBased on these materials, please answer the following question:`
      });
    }

    // Add previous messages for context (last 5 only)
    const recentMessages = previousMessages.slice(-5, -1);
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current query
    messages.push({ role: 'user', content: query });

    // Try multiple models until we get a response
    for (let i = 0; i < FREE_MODELS.length; i++) {
      const currentModel = FREE_MODELS[i];

      try {
        console.log(`Trying model ${i + 1}/${FREE_MODELS.length}: ${currentModel}`);

        // Call OpenRouter API
        const response = await axios.post(
          `${OPENROUTER_BASE_URL}/chat/completions`,
          {
            model: currentModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://portal.innovorex.co.in',
              'X-Title': 'AI School Management System',
              'Content-Type': 'application/json'
            },
            timeout: 15000  // 15 second timeout per model
          }
        );

        if (response.data && response.data.choices && response.data.choices[0]) {
          const content = response.data.choices[0].message.content;
          console.log(`Model ${currentModel} response received, length:`, content ? content.length : 0);

          // Check if response is valid and not empty
          if (content && content.trim() && content.trim().length > 5) {
            // Clean any markdown that might have slipped through
            let cleanedContent = content;

            // Remove markdown formatting
            cleanedContent = cleanedContent.replace(/\*\*([^*]+)\*\*/g, '$1');  // **text** → text
            cleanedContent = cleanedContent.replace(/\*([^*]+)\*/g, '$1');      // *text* → text
            cleanedContent = cleanedContent.replace(/__([^_]+)__/g, '$1');      // __text__ → text
            cleanedContent = cleanedContent.replace(/_([^_]+)_/g, '$1');        // _text_ → text
            cleanedContent = cleanedContent.replace(/^#{1,6}\s+/gm, '');        // # Header → Header
            cleanedContent = cleanedContent.replace(/`([^`]+)`/g, '$1');        // `code` → code

            console.log(`✓ Success with model: ${currentModel}`);
            return cleanedContent;
          } else {
            console.log(`Model ${currentModel} returned empty/invalid response, trying next...`);
          }
        } else {
          console.log(`Model ${currentModel} returned unexpected format, trying next...`);
        }
      } catch (error) {
        console.log(`Model ${currentModel} failed:`, error.message);
        // Continue to next model
      }
    }

    // If all models failed, return a helpful error message
    console.error('All AI models failed to generate a response');
    return "I'm currently having technical difficulties with all AI services. This seems to be a temporary issue. Please try again in a few minutes, or contact your instructor if the problem persists.";
  }

  async getChatHistory(req, res) {
    try {
      const { sessionId } = req.params;

      const session = this.chatSessions.get(sessionId);
      if (!session) {
        return res.json({
          success: true,
          data: []
        });
      }

      res.json({
        success: true,
        data: session.messages
      });
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat history',
        error: error.message
      });
    }
  }

  async clearChatHistory(req, res) {
    try {
      const { sessionId } = req.params;

      this.chatSessions.delete(sessionId);

      res.json({
        success: true,
        message: 'Chat history cleared successfully'
      });
    } catch (error) {
      console.error('Clear chat history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear chat history',
        error: error.message
      });
    }
  }

  // ==================== Stats and Analytics ====================

  async getKnowledgeBaseStats(req, res) {
    try {
      const stats = {
        total_documents: this.documents.length,
        processed_documents: this.documents.filter(d => d.status === 'processed').length,
        pending_documents: this.documents.filter(d => d.status === 'pending').length,
        failed_documents: this.documents.filter(d => d.status === 'failed').length,
        total_chunks: this.documentChunks.length,
        active_sessions: this.chatSessions.size,

        // Group by program
        documents_by_program: {},
        documents_by_course: {}
      };

      // Calculate documents by program and course
      this.documents.forEach(doc => {
        // By program
        if (!stats.documents_by_program[doc.program_name]) {
          stats.documents_by_program[doc.program_name] = 0;
        }
        stats.documents_by_program[doc.program_name]++;

        // By course
        if (!stats.documents_by_course[doc.course_name]) {
          stats.documents_by_course[doc.course_name] = 0;
        }
        stats.documents_by_course[doc.course_name]++;
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get KB stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Knowledge Base statistics',
        error: error.message
      });
    }
  }
}

// Export both the class and the multer upload middleware
KnowledgeBaseService.uploadMiddleware = upload;
module.exports = KnowledgeBaseService;