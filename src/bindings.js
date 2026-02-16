window.addEventListener('DOMContentLoaded', () => {
  if (window.neuralShellBound) return;
  window.neuralShellBound = true;

  const connectBtn   = document.getElementById('connectBtn');
  const sendBtn      = document.getElementById('sendBtn');          // or consoleRunBtn
  const promptBox    = document.getElementById('consoleInput');
  const outputBox    = document.getElementById('consoleOutput');
  const statusLabel  = document.getElementById('llmStatus');

  // Highlight buttons on hover/active
  document.querySelectorAll('button').forEach(b=>{
    b.onmouseover = ()=>b.style.background='#222';
    b.onmouseout  = ()=>b.style.background='';
    b.onmousedown = ()=>b.style.background='#0af';
    b.onmouseup   = ()=>b.style.background='#222';
  });

  connectBtn.addEventListener('click', async () => {
    statusLabel.textContent = 'checking…';
    statusLabel.style.color = '#fc0';
    const ok = await window.llmBridge.ping();
    statusLabel.textContent = ok ? 'connected' : 'failed';
    statusLabel.style.color = ok ? '#0f0' : '#f33';
  });

  sendBtn.addEventListener('click', async () => {
    const q = promptBox.value.trim();
    if (!q) return;
    outputBox.value += `\\n> ${q}`;
    try {
      const res = await window.llmBridge.chat({
        model: 'llama3',
        messages:[{role:'user',content:q}]
      });
      outputBox.value += `\\n→ ${res.choices[0].message.content}\\n`;
    } catch(err){
      outputBox.value += `\\n[Error] ${err.message}\\n`;
    }
    outputBox.scrollTop = outputBox.scrollHeight;
  });
});
