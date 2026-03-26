# NeuralShell LLM Setup

## 1) Local Ollama (required for local provider)

Windows (PowerShell):

```powershell
& "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe" serve
& "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe" pull mistral:7b-instruct
```

macOS:

```bash
brew install ollama
ollama serve &
ollama pull mistral:7b-instruct
```

Linux:

```bash
# install Ollama from official package, then:
ollama serve &
ollama pull mistral:7b-instruct
```

Default local endpoint:

```text
http://127.0.0.1:11434
```

## 2) Configure provider credentials

Copy `.env.example` values into your shell or CI secret store.

Required hosted keys:

- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `GROQ_API_KEY`
- `TOGETHER_API_KEY`

Optional custom hosted endpoint:

- `CUSTOM_OPENAI_API_KEY`
- `CUSTOM_OPENAI_BASE_URL`

For GitHub Actions, add these in repository settings:

- `Settings -> Secrets and variables -> Actions`

## 3) Run provider sweep

```bash
npm run llm:sweep
```

Strict mode (fails when any provider is not connected):

```bash
npm run llm:sweep:strict
```

Report output:

```text
release/llm-sweep-report.json
```
## 4) Save provider credentials to Vault+

1. Open `Settings -> Providers` in the app.
2. Enter provider API keys and any custom base URL.
3. Click `Save to Vault` to store credentials in encrypted local storage.

## 5) Optional: Export a roaming encrypted vault profile

1. Open `Settings -> Vault+`.
2. Click `Export` to generate an encrypted `vault.json` profile.
3. Store `vault.json` in your approved offline backup location.
4. Use `Import` in the same panel to restore on another machine.
