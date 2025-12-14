# API Quick Reference

## Backend Endpoints

### 1. Health Check
```bash
curl http://localhost:3001/health
```
**Response:**
```json
{"status":"ok","timestamp":"2025-12-14T..."}
```

---

### 2. Streaming Chat
```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me a joke"}'
```
**Response:** SSE Stream
```
data: {"token":"Why"}
data: {"token":" did"}
data: {"token":" the"}
...
data: [DONE]
```

---

### 3. Simple Chat (Non-Streaming)
```bash
curl -X POST http://localhost:3001/chat/simple \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me a joke"}'
```
**Response:**
```json
{
  "response": "Why did the chicken cross the road?...",
  "model": "llama3.1:8b",
  "created_at": "2025-12-14T..."
}
```

---

## Test Ollama Directly

### Check Ollama Version
```bash
curl http://localhost:11434/api/version
```

### List Available Models
```bash
curl http://localhost:11434/api/tags
```

### Generate (Non-Streaming)
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Hello!",
    "stream": false
  }'
```

### Generate (Streaming)
```bash
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "prompt": "Hello!",
    "stream": true
  }'
```

---

## Common Commands

### Start Everything
```bash
npm start
```

### Start Backend Only
```bash
npm run server
```

### Start Frontend Only
```bash
npm run dev
```

### Test Ollama Connection
```bash
npm run test:ollama
```

### Pull a Different Model
```bash
ollama pull mistral
ollama pull phi3
ollama pull codellama
```

---

## Environment Variables

Create `.env` file:
```bash
PORT=3001
OLLAMA_API_URL=http://localhost:11434
MODEL_NAME=llama3.1:8b
```

---

## Frontend Integration Example

```javascript
// Send message with streaming
const response = await fetch('http://localhost:3001/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const parsed = JSON.parse(data);
      if (parsed.token) {
        console.log(parsed.token); // Display token
      }
    }
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check port 3001 is free: `lsof -i :3001` |
| Ollama not responding | Start Ollama: `ollama serve` |
| Model not found | Pull model: `ollama pull llama3.1:8b` |
| CORS error | Backend should have CORS enabled |
| Slow responses | Use smaller model or check system resources |

---

**Quick Verification:**
```bash
# 1. Test Ollama
curl http://localhost:11434/api/version

# 2. Test Backend
npm run test:ollama

# 3. Start App
npm start
```
