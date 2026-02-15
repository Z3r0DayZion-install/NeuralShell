document.getElementById('sendBtn').addEventListener('click', async () => {
    const userMessage = document.getElementById('consoleInput').value;
    const outputBox = document.getElementById('consoleOutput');
    
    if (userMessage.trim() === "") return;
    
    outputBox.value += "\n> " + userMessage;
    
    const response = await window.llmBridge.chat({
        model: 'llama3',
        messages: [{ role: 'user', content: userMessage }]
    });
    
    outputBox.value += "\n→ " + response.message.content + "\n";
    outputBox.scrollTop = outputBox.scrollHeight;
});
