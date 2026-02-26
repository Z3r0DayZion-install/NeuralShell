# Custom LLM Training Guide

## Prerequisites
- Python 3.10+
- A machine with a decent GPU (at least 16GB VRAM for 7B/8B models) OR use Google Colab (T4 GPU).
- Your ChatGPT data export (`conversations.json`).

## Step 1: Data Conversion
1.  Run the conversion script:
    ```bash
    bash convert_data.sh
    ```
2.  This creates `my_digital_clone_data.jsonl` in your NeuralShell folder.
    - This file contains sensitive personal data. Keep it local (it is ignored by git) and do not upload/share it unless you intend to.

## Step 2: Fine-Tuning with Unsloth (Recommended)
Unsloth is the fastest way to fine-tune Llama 3 locally or on Colab.

1.  **Open Unsloth Colab Notebook:**
    - [Unsloth Llama-3 8B Notebook](https://colab.research.google.com/drive/135dwPgYeZROGITdbEtG2lpD_SQjTmprr?usp=sharing)
    - File > Save a copy in Drive.

2.  **Upload Data:**
    - Upload `my_digital_clone_data.jsonl` to the Colab environment.

3.  **Configure Training:**
    - Modify the dataset loading block:
      ```python
      dataset = load_dataset("json", data_files="my_digital_clone_data.jsonl", split="train")
      ```
    - Adjust hyperparameters if needed (learning rate, epochs).
    - Start Training!

4.  **Save GGUF:**
    - At the end of the notebook, run the GGUF export cell.
    - Choose `q4_k_m` (4-bit quantization) for a balance of speed and quality.
    - Download the `.gguf` file (e.g., `unsloth.Q4_K_M.gguf`).

## Step 3: Serve with Ollama
1.  **Create Modelfile:**
    Create a file named `Modelfile` (no extension) in the same folder as your GGUF:
    ```dockerfile
    FROM ./unsloth.Q4_K_M.gguf
    SYSTEM You are a digital clone of [Your Name]. Answer as if you were them based on their chat history.
    PARAMETER temperature 0.7
    ```

2.  **Create Model:**
    ```bash
    ollama create my-clone -f Modelfile
    ```

3.  **Test:**
    ```bash
    ollama run my-clone "Who are you?"
    ```

## Step 4: Integrate into NeuralShell
1.  Edit `config.yaml` in NeuralShell root:
    ```yaml
    endpoints:
      - name: "my-digital-clone"
        url: "http://localhost:11434/api/chat"
        model: "my-clone" # Must match Ollama model name
        weight: 10
        priority: 1
    ```
2.  NeuralShell is already configured to prioritize this model if it's available.
