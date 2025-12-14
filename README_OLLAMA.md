# Ollama LLM Integration Guide

This guide explains how to set up and use the Ollama integration with your chatbot frontend.

## 🚀 Quick Start

### Prerequisites

1. **Install Ollama** (if not already installed)
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Pull the llama3.1:8b model**
   ```bash
   ollama pull llama3.1:8b
   ```

3. **Start Ollama server**
   ```bash
   ollama serve
   ```
   
   This will start Ollama on `http://localhost:11434`

### Running the Application

#### Option 1: Run Everything Together (Recommended)
```bash
npm start
```
This will start both the frontend (Vite) and backend (Express) simultaneously.

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

## 📡 API Endpoints

### POST /chat (Streaming)
Sends a message to Ollama and streams the response back using Server-Sent Events (SSE).

**Request:**
```json
{
  "message": "What is the capital of France?"
}
```

**Response:** 
Stream of SSE events with tokens:
```
data: {"token":"The"}
data: {"token":" capital"}
data: {"token":" of"}
data: {"token":" France"}
data: {"token":" is"}
data: {"token":" Paris"}
data: [DONE]
```

### POST /chat/simple (Non-Streaming)
Sends a message to Ollama and returns the complete response.

**Request:**
```json
{
  "message": "What is the capital of France?"
}
```

**Response:**
```json
{
  "response": "The capital of France is Paris.",
  "model": "llama3.1:8b",
  "created_at": "2025-12-14T..."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-14T..."
}
```

## 🏗️ Architecture

```
┌─────────────────┐
│   React Frontend│
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP POST /chat
         │ (SSE Stream)
         ▼
┌─────────────────┐
│  Express Server │
│   (Port 3001)   │
└────────┬────────┘
         │ HTTP POST /api/generate
         │ (Stream: true)
         ▼
┌─────────────────┐
│  Ollama Server  │
│  (Port 11434)   │
│ Model: llama3.1 │
└─────────────────┘
```

## 🔧 Configuration

### Backend Configuration (server.js)

- **Port:** `3001` (change via `PORT` env variable)
- **Ollama URL:** `http://localhost:11434`
- **Model:** `llama3.1:8b`
- **CORS:** Enabled for all origins (restrict in production)

### Frontend Configuration (App.jsx)

- **API URL:** `http://localhost:3001/chat`
- **Streaming:** Uses Fetch API with ReadableStream
- **Display:** Real-time token streaming with visual effects

## 🎨 Features

### Streaming Response
- Real-time token-by-token display
- Visual pulsing animation during generation
- Smooth particle effects synchronized with chat

### Error Handling
- Connection errors caught and displayed to user
- Ollama server status validation
- Clear error messages with troubleshooting hints

### Production Ready
- Clean code with comprehensive comments
- Request logging for debugging
- CORS enabled for security
- Health check endpoint for monitoring

## 🐛 Troubleshooting

### "Failed to fetch" Error
**Cause:** Backend server not running

**Solution:**
```bash
npm run server
```

### "Ollama API error: 404"
**Cause:** Ollama not running or model not installed

**Solution:**
```bash
# Start Ollama
ollama serve

# Pull the model
ollama pull llama3.1:8b
```

### "Connection refused" Error
**Cause:** Ollama server not accessible

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama if not running
ollama serve
```

### Slow Response Times
**Cause:** Model size or system resources

**Solution:**
- Use a smaller model: `ollama pull llama3.1:7b` or `phi3`
- Close resource-intensive applications
- Consider GPU acceleration if available

## 📦 Dependencies

### Backend
- `express` - Web framework
- `cors` - CORS middleware

### Frontend
- `react` - UI framework
- `three` - 3D graphics
- `gsap` - Animations

### Development
- `concurrently` - Run multiple commands
- `vite` - Frontend build tool

## 🔐 Security Notes

⚠️ **For Production:**

1. **Restrict CORS:**
   ```javascript
   app.use(cors({
     origin: 'https://yourdomain.com'
   }));
   ```

2. **Add Rate Limiting:**
   ```bash
   npm install express-rate-limit
   ```

3. **Add Authentication:**
   Implement JWT or API keys for chat endpoint

4. **Environment Variables:**
   ```bash
   # .env
   PORT=3001
   OLLAMA_URL=http://localhost:11434
   MODEL_NAME=llama3.1:8b
   ```

## 📚 Additional Resources

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Express.js Guide](https://expressjs.com/)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🤝 Support

For issues or questions:
1. Check Ollama is running: `ollama serve`
2. Verify model is installed: `ollama list`
3. Test API directly: `curl http://localhost:11434/api/version`
4. Check backend logs in terminal

---

**Happy Chatting! 🎉**
