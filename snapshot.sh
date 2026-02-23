#!/bin/bash

# NeuralShell State Snapshot Utility
# Saves the Brain (Vector Store) and Economy (Ledger)

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="./backups"
STATE_DIR="./state"

mkdir -p $BACKUP_DIR

echo "🧠 Freezing Neural State..."
# In a real heavy-load scenario, we might want to pause Redis here, 
# but for file-based JSONs, a direct copy is usually safe enough for now.

ZIP_NAME="neuralshell_state_$TIMESTAMP.zip"

if [ -d "$STATE_DIR" ]; then
    tar -czf "$BACKUP_DIR/$ZIP_NAME" "$STATE_DIR"
    echo "✅ Snapshot saved: $BACKUP_DIR/$ZIP_NAME"
else
    echo "❌ Error: State directory not found!"
fi

# Cleanup old backups (Keep last 10)
cd $BACKUP_DIR
ls -t | tail -n +11 | xargs -I {} rm -- {} 2>/dev/null
echo "🧹 Old backups pruned."
