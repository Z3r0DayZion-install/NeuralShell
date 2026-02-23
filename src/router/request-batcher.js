// Request batching for Ollama to preserve context across messages
export function batchMessagesForOllama(normalizedMessages, maxContextChars = 8000) {
  if (normalizedMessages.length === 0) {
    return { prompt: '', roles: [] };
  }

  const batches = [];
  let currentBatch = [];
  let currentSize = 0;

  for (const msg of normalizedMessages) {
    const msgSize = msg.content.length + msg.role.length + 10; // Account for formatting

    if (currentSize + msgSize > maxContextChars && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }

    currentBatch.push(msg);
    currentSize += msgSize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // Format the primary batch with full context
  const primaryBatch = batches[0];
  const roles = primaryBatch.map((m) => m.role);
  const prompt = formatOllamaPrompt(primaryBatch);

  return {
    prompt,
    roles,
    batchCount: batches.length,
    totalSize: currentSize,
    messages: primaryBatch
  };
}

function formatOllamaPrompt(messages) {
  return messages
    .map((msg) => {
      const roleLabel = msg.role.toUpperCase();
      return `[${roleLabel}]: ${msg.content}`;
    })
    .join('\n\n');
}

export function reconstructOllamaResponse(ollamaResponse, originalMessages) {
  // Extract response and preserve context
  return {
    role: 'assistant',
    content: String(ollamaResponse.response || ''),
    model: ollamaResponse.model,
    context: ollamaResponse.context || [],
    stop_reason: ollamaResponse.stop_reason,
    eval_count: ollamaResponse.eval_count,
    eval_duration: ollamaResponse.eval_duration
  };
}
