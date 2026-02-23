
import fetch from 'node-fetch';

async function testProvider(name, url, payload, headers = {}) {
  console.log(`Testing ${name}...`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      console.log(`✅ ${name} is online and responding.`);
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
      return true;
    } else {
      console.log(`❌ ${name} failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} unreachable: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("--- Starting LLM Provider Connectivity Tests ---");

  // 1. Test Local Ollama
  await testProvider(
    "Local Ollama (Llama3)", 
    "http://localhost:11434/api/generate", 
    { model: "llama3", prompt: "Hello", stream: false }
  );

  // 2. Test OpenAI (Mock/Check if reachable)
  // We can't really test auth without a key, but we can check if the endpoint is reachable
  await testProvider(
    "OpenAI API (Connectivity Check)", 
    "https://api.openai.com/v1/models", 
    {}, 
    { "Authorization": "Bearer invalid_key" } // Expect 401, which means reachable
  );

  // 3. Test Anthropic (Mock/Check if reachable)
  await testProvider(
    "Anthropic API (Connectivity Check)", 
    "https://api.anthropic.com/v1/messages", 
    { model: "claude-3-opus-20240229", messages: [{ role: "user", content: "Hi" }] }, 
    { "x-api-key": "invalid_key", "anthropic-version": "2023-06-01" } // Expect 401
  );

  console.log("--- Tests Completed ---");
}

runTests();
