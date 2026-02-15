const { exec } = require('child_process');
exec('ollama serve', (err, stdout, stderr) => {
  if(err){
    console.error(err);
  } else {
    console.log(stdout);
  }
});