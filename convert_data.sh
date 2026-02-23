#!/bin/bash

# Custom LLM Data Conversion Script for Git Bash
# Processes ChatGPT conversations.json into ShareGPT training format

CONVERTER_SCRIPT="/c/Users/KickA/NeuralShell/scripts/convert_chatgpt.py"
INPUT_FILE="/c/Users/KickA/Downloads/Compressed/f4e57260b04e8b78f511d534f23608107702948101cbb8325f9c99af1fcdcb95-2026-02-14-20-24-40-457b389071e1458fbf1d4d188f495a15/conversations.json"
OUTPUT_FILE="/c/Users/KickA/NeuralShell/my_digital_clone_data.jsonl"

echo "-------------------------------------------------------"
echo "🚀 Starting Digital Clone Data Conversion..."
echo "📂 Input: $INPUT_FILE"
echo "💾 Output: $OUTPUT_FILE"
echo "-------------------------------------------------------"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ ERROR: Input file not found! Please check the path."
    exit 1
fi

echo "⏳ Processing (this may take a minute for 250MB+)..."

python "$CONVERTER_SCRIPT" "$INPUT_FILE" "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "-------------------------------------------------------"
    echo "✅ SUCCESS: Your data is ready for training!"
    echo "📍 File located at: $OUTPUT_FILE"
    echo "-------------------------------------------------------"
    echo "Next Step: Follow the guide at:"
    echo "NeuralShell/docs/training_guide.md"
else
    echo "❌ ERROR: Conversion failed. Ensure Python is installed."
fi
