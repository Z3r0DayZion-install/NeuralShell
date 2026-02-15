function renderMarkdown(text) {
    const marked = require('marked');
    return marked(text);
}

function displayMarkdown(text) {
    const outputBox = document.getElementById('consoleOutput');
    const markdown = renderMarkdown(text);
    outputBox.innerHTML += markdown;
}
