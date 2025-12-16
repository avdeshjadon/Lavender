import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Ollama API configuration
const OLLAMA_API_URL = 'http://localhost:11434';
const MODEL_NAME = 'llama3.1:8b';

// Track the currently active streaming request to allow cancellation
let activeStream = {
  controller: null,
  res: null,
};

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for frontend communication
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Chat endpoint with streaming support
 * POST /chat
 * 
 * Request body:
 * {
 *   "message": "User's message text"
 * }
 * 
 * Response: Server-Sent Events (SSE) stream
 * Each event contains a chunk of the AI response
 */
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Validate incoming message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ 
      error: 'Message is required and must be a non-empty string' 
    });
  }

  console.log(`[CHAT] Received message: "${message.substring(0, 50)}..."`);

  try {
    // If there is an active stream, abort it before starting a new one
    if (activeStream.controller) {
      console.log('[STREAM] Aborting previous stream for new request');
      try {
        activeStream.controller.abort();
        if (activeStream.res && !activeStream.res.writableEnded) {
          activeStream.res.write('data: [DONE]\n\n');
          activeStream.res.end();
        }
      } catch (abortErr) {
        console.warn('[STREAM] Error during abort:', abortErr.message);
      }
    }

    // Clear active stream before starting new one
    activeStream.controller = null;
    activeStream.res = null;

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create an AbortController for this streaming request
    const controller = new AbortController();

    // Mark this as the currently active stream IMMEDIATELY
    activeStream.controller = controller;
    activeStream.res = res;

    // Prepare request to Ollama API
    const ollamaPayload = {
      model: MODEL_NAME,
      prompt: message,
      stream: true // Enable streaming from Ollama
    };

    console.log(`[OLLAMA] Sending request to ${OLLAMA_API_URL}/api/generate`);

    // Make streaming request to Ollama
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaPayload),
      signal: controller.signal,
    });

    // Check if Ollama API responded successfully
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Process the stream from Ollama
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('[OLLAMA] Streaming response started');

    while (true) {
      // Check if this stream was aborted (new request came in)
      if (controller.signal.aborted) {
        console.log('[STREAM] Stream aborted by new request');
        break;
      }

      const { done, value } = await reader.read();

      if (done) {
        console.log('[OLLAMA] Stream completed');
        // Only send DONE if we're still the active stream
        if (activeStream.controller === controller) {
          res.write('data: [DONE]\n\n');
          res.end();
          activeStream.controller = null;
          activeStream.res = null;
        }
        break;
      }

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });

      // Process complete JSON lines from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim() === '') continue;

        // Check again if aborted during processing
        if (controller.signal.aborted) {
          console.log('[STREAM] Stream aborted during line processing');
          break;
        }

        try {
          const jsonResponse = JSON.parse(line);

          // Extract the response token from Ollama
          if (jsonResponse.response) {
            const token = jsonResponse.response;
            // Only send if we're still the active stream
            if (activeStream.controller === controller) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          }

          // Check if this is the final response
          if (jsonResponse.done) {
            console.log('[OLLAMA] Generation complete');
            console.log(`[STATS] Total duration: ${jsonResponse.total_duration}ns`);
          }
        } catch (parseError) {
          // If aborted, stop immediately
          if (controller.signal.aborted) {
            console.log('[STREAM] Parse stopped due to abort');
            break;
          }
          console.error('[ERROR] Failed to parse Ollama response:', parseError);
          // Continue processing other lines
        }
      }

      // Check if aborted after processing lines
      if (controller.signal.aborted) {
        break;
      }
    }

  } catch (error) {
    // If this was an abort, don't log as error
    if (error.name === 'AbortError') {
      console.log('[STREAM] Request aborted for new chat');
      return;
    }

    console.error('[ERROR] Chat endpoint error:', error.message);
    
    // Only send error if we're still the active stream
    if (activeStream.controller && activeStream.res === res) {
      res.write(`data: ${JSON.stringify({ 
        error: 'Failed to generate response',
        details: error.message 
      })}\n\n`);
      res.end();
    }
  } finally {
    // Clean up if this was the active stream
    if (activeStream.res === res) {
      activeStream.controller = null;
      activeStream.res = null;
    }
  }
});

/**
 * Non-streaming chat endpoint (legacy/fallback)
 * POST /chat/simple
 * 
 * Request body:
 * {
 *   "message": "User's message text"
 * }
 * 
 * Response: JSON
 * {
 *   "response": "AI's complete response"
 * }
 */
app.post('/chat/simple', async (req, res) => {
  const { message } = req.body;

  // Validate incoming message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ 
      error: 'Message is required and must be a non-empty string' 
    });
  }

  console.log(`[CHAT-SIMPLE] Received message: "${message.substring(0, 50)}..."`);

  try {
    // Prepare request to Ollama API (non-streaming)
    const ollamaPayload = {
      model: MODEL_NAME,
      prompt: message,
      stream: false // Disable streaming for simple endpoint
    };

    console.log(`[OLLAMA] Sending non-streaming request to ${OLLAMA_API_URL}/api/generate`);

    // Make request to Ollama
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaPayload),
    });

    // Check if Ollama API responded successfully
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log('[OLLAMA] Response received');

    // Extract and return only the response text
    res.json({ 
      response: data.response || '',
      model: data.model || MODEL_NAME,
      created_at: data.created_at || new Date().toISOString()
    });

  } catch (error) {
    console.error('[ERROR] Simple chat endpoint error:', error.message);
    
    // Return error response
    res.status(500).json({ 
      error: 'Failed to generate response',
      details: error.message,
      suggestion: 'Make sure Ollama is running on http://localhost:11434 with the llama3.1:8b model'
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR] Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Ollama Chat Backend Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🤖 Ollama API: ${OLLAMA_API_URL}`);
  console.log(`🧠 Model: ${MODEL_NAME}`);
  console.log('\n📋 Available endpoints:');
  console.log(`   GET  /health          - Health check`);
  console.log(`   POST /chat            - Streaming chat (SSE)`);
  console.log(`   POST /chat/simple     - Non-streaming chat`);
  console.log('\n💡 Make sure Ollama is running with:');
  console.log(`   ollama serve`);
  console.log(`   ollama pull ${MODEL_NAME}`);
  console.log('='.repeat(50) + '\n');
});
