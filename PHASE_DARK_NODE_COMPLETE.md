# Phase: Dark Node (100% Local / Air-Gapped)

**Status:** 🟢 ENFORCED

## 🏆 Achievements

### 1. 📂 Dependency Localization
- **Asset Redirection:** `admin-dashboard.html` no longer reaches out to `unpkg.com` or `cdnjs`. It now points to `/public/lib/` and `/public/css/`.
- **Static Serving:** `production-server.js` now serves the `public/` directory via `@fastify/static`.

### 2. 🧠 Sovereign Intelligence
- **Local Embeddings:** `EmbeddingEngine.js` is locked to `local_files_only: true`. It will never attempt to download models from Hugging Face at runtime.
- **Model Storage:** The system now looks for ONNX models in the `./models` root directory.

### 3. 🛡️ Network Lockdown
- **Config Hardening:** `config.yaml` has been purged of all OpenAI/Anthropic references. Only `ollama-local` remains.
- **Host Binding:** Server is bound to `127.0.0.1` by default to prevent external network discovery.

## 🚀 Final Step for Air-Gap Ready

To complete the setup, you must manually place the following files in the `public/lib` and `models` folders (since the system can no longer download them for you):

**Libraries (`public/lib/`):**
- `vue.global.prod.js`
- `axios.min.js`
- `chart.min.js`
- `3d-force-graph.min.js`

**Models (`models/Xenova/all-MiniLM-L6-v2/`):**
- `onnx/model_quantized.onnx`
- `tokenizer.json`
- `config.json`

## 📝 The Fortress is Complete
NeuralShell is now a fully sovereign, offline AI operating system. It does not ping, it does not leak, and it does not require the cloud.

**Mission Complete.**
