#!/usr/bin/env node

/**
 * Ollama Connection Test Script
 * 
 * This script tests the connection to Ollama and verifies
 * that the required model is available.
 */

const OLLAMA_URL = 'http://localhost:11434';
const MODEL_NAME = 'llama3.1:8b';

console.log('🔍 Testing Ollama Connection...\n');

async function testOllamaConnection() {
  try {
    // Test 1: Check if Ollama is running
    console.log('1️⃣  Checking Ollama server...');
    const versionResponse = await fetch(`${OLLAMA_URL}/api/version`);
    
    if (!versionResponse.ok) {
      throw new Error('Ollama server not responding');
    }
    
    const versionData = await versionResponse.json();
    console.log('   ✅ Ollama is running');
    console.log(`   📦 Version: ${versionData.version || 'unknown'}\n`);

    // Test 2: Check if model is available
    console.log('2️⃣  Checking for model:', MODEL_NAME);
    const tagsResponse = await fetch(`${OLLAMA_URL}/api/tags`);
    
    if (!tagsResponse.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const tagsData = await tagsResponse.json();
    const modelExists = tagsData.models?.some(m => m.name === MODEL_NAME);
    
    if (!modelExists) {
      console.log('   ❌ Model not found');
      console.log(`   💡 Run: ollama pull ${MODEL_NAME}\n`);
      
      console.log('   📋 Available models:');
      if (tagsData.models && tagsData.models.length > 0) {
        tagsData.models.forEach(m => {
          console.log(`      - ${m.name}`);
        });
      } else {
        console.log('      (none)');
      }
      process.exit(1);
    }
    
    console.log('   ✅ Model is installed\n');

    // Test 3: Test generation
    console.log('3️⃣  Testing generation (this may take a moment)...');
    const generateResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: 'Say "Hello, World!" and nothing else.',
        stream: false,
      }),
    });

    if (!generateResponse.ok) {
      throw new Error('Generation test failed');
    }

    const generateData = await generateResponse.json();
    console.log('   ✅ Generation successful');
    console.log(`   💬 Response: ${generateData.response.substring(0, 100)}...\n`);

    // Success
    console.log('━'.repeat(50));
    console.log('✨ All tests passed! Ollama is ready to use.');
    console.log('━'.repeat(50));
    console.log('\n🚀 You can now run:');
    console.log('   npm start      (start both frontend & backend)');
    console.log('   npm run server (backend only)');
    console.log('   npm run dev    (frontend only)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure Ollama is running:');
    console.log('      ollama serve');
    console.log('   2. Install the model:');
    console.log(`      ollama pull ${MODEL_NAME}`);
    console.log('   3. Check Ollama is accessible:');
    console.log(`      curl ${OLLAMA_URL}/api/version\n`);
    process.exit(1);
  }
}

testOllamaConnection();
