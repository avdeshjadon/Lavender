# 🚀 Setup Checklist

Follow this checklist to get your Ollama-powered chatbot running.

## ✅ Prerequisites

- [ ] Node.js installed (v18 or higher recommended)
- [ ] npm or yarn package manager
- [ ] Ollama installed on your system

## 📋 Step-by-Step Setup

### 1. Install Ollama
```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

- [ ] Ollama installed successfully

### 2. Pull the Model
```bash
ollama pull llama3.1:8b
```

- [ ] Model downloaded (this may take several minutes depending on your connection)

### 3. Start Ollama Server
```bash
ollama serve
```

- [ ] Ollama server running on http://localhost:11434
- [ ] Leave this terminal window open

### 4. Install Project Dependencies
```bash
npm install
```

- [ ] All npm packages installed successfully

### 5. Test Ollama Connection
```bash
npm run test:ollama
```

Expected output:
```
✅ Ollama is running
✅ Model is installed
✅ Generation successful
```

- [ ] All tests passed

### 6. Start the Application
```bash
npm start
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

- [ ] Both servers started successfully
- [ ] No error messages in console

### 7. Test in Browser

1. Open http://localhost:5173
2. Click "Get Started"
3. Type a message and press Send
4. Verify you receive a streaming response from the AI

- [ ] Frontend loads successfully
- [ ] Can send messages
- [ ] Receive AI responses
- [ ] Streaming works (tokens appear gradually)

## 🔍 Verification Commands

Run these to verify each component:

```bash
# Check Ollama
curl http://localhost:11434/api/version

# Check Backend
curl http://localhost:3001/health

# Check Frontend
# Open browser to http://localhost:5173
```

## 🐛 Common Issues

### Issue: "Ollama server not responding"
**Solution:**
```bash
# Start Ollama in a separate terminal
ollama serve
```

### Issue: "Model not found"
**Solution:**
```bash
ollama pull llama3.1:8b
```

### Issue: "Port 3001 already in use"
**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change port in server.js
```

### Issue: "CORS error in browser"
**Solution:**
- Backend should already have CORS enabled
- Make sure backend is running on port 3001
- Check browser console for exact error

### Issue: "Failed to fetch"
**Solution:**
```bash
# Make sure backend is running
npm run server

# In another terminal, test it
curl http://localhost:3001/health
```

## 📁 File Structure

```
Lavender/
├── server.js              # Express backend with Ollama integration
├── test-ollama.js         # Ollama connection test script
├── README_OLLAMA.md       # Detailed documentation
├── API_REFERENCE.md       # API quick reference
├── package.json           # Dependencies and scripts
├── src/
│   ├── App.jsx           # Frontend with streaming support
│   ├── main.jsx          # React entry point
│   └── style.css         # Styles
└── public/               # Static assets
```

## 🎯 Quick Commands Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start frontend + backend |
| `npm run dev` | Start frontend only |
| `npm run server` | Start backend only |
| `npm run test:ollama` | Test Ollama connection |
| `ollama serve` | Start Ollama server |
| `ollama list` | List installed models |

## ✨ You're All Set!

Once all checkboxes are ticked, you have:
- ✅ Ollama running locally
- ✅ Backend API serving on port 3001
- ✅ Frontend UI on port 5173
- ✅ Streaming chat responses working

## 🎨 Customization

Want to customize? Check these files:

- **Change model:** Edit `MODEL_NAME` in [server.js](server.js#L7)
- **Change port:** Edit `PORT` in [server.js](server.js#L6)
- **Styling:** Edit [src/style.css](src/style.css)
- **UI/UX:** Edit [src/App.jsx](src/App.jsx)

## 📚 Next Steps

1. **Try different models:**
   ```bash
   ollama pull mistral
   ollama pull phi3
   ollama pull codellama
   ```

2. **Add features:**
   - Message history
   - Model selection dropdown
   - Temperature/parameter controls
   - Save conversations

3. **Deploy:**
   - See [README_OLLAMA.md](README_OLLAMA.md) for production notes
   - Consider rate limiting and authentication

## 💬 Need Help?

1. Check logs in terminal
2. Run `npm run test:ollama`
3. Review [README_OLLAMA.md](README_OLLAMA.md)
4. Check [API_REFERENCE.md](API_REFERENCE.md)

---

**Happy Coding! 🎉**
