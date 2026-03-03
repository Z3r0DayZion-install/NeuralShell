window.recovery.onReport((report) => {
  const div = document.getElementById('report');
  let html = 'Integrity Check: FAILED\n\n';
  
  if (report.failedFiles.length > 0) {
    html += 'Corrupted Files:\n';
    report.failedFiles.forEach(f => {
      html += `- ${f.path} (${f.reason})\n`;
    });
  }

  if (report.errors.length > 0) {
    html += '\nGeneral Errors:\n';
    report.errors.forEach(e => {
      html += `- ${e}\n`;
    });
  }

  div.textContent = html;
});

document.getElementById('repairBtn').addEventListener('click', async () => {
  const btn = document.getElementById('repairBtn');
  btn.disabled = true;
  btn.textContent = 'Repairing...';
  
  try {
    const success = await window.recovery.repair();
    if (success) {
      alert('Repair successful. Click Restart to boot NeuralShell.');
      btn.textContent = 'Repair Complete';
    } else {
      alert('Repair failed. Please reinstall NeuralShell.');
      btn.textContent = 'Repair Failed';
    }
  } catch (err) {
    alert('Repair Error: ' + err.message);
    btn.textContent = 'Repair Error';
  }
});

document.getElementById('restartBtn').addEventListener('click', () => {
  window.recovery.restart();
});
