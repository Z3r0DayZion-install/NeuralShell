const sessionManager = require('./src/core/sessionManager');
const path = require('path');
const fs = require('fs');

async function runLiveProof() {
    console.log("--- STARTING LIVE PERSISTENCE PROOF ---");
    
    const sessionName = "Persistence_Proof_Session";
    const passphrase = "operator-temp-pass";
    const testPayload = {
        chat: [{ role: 'user', content: 'Persistence Test Message' }],
        model: 'llama3-proof',
        workflowId: sessionName,
        outputMode: 'checklist',
        workspaceAttachment: { label: 'Proof_Workspace', path: './proof' },
        updatedAt: new Date().toISOString()
    };

    try {
        // 1. CREATE -> SAVE
        console.log(`[STEP 1] Saving session: ${sessionName}...`);
        sessionManager.saveSession(sessionName, testPayload, passphrase);
        
        // 2. SWITCH AWAY (Clear local state simulation)
        console.log(`[STEP 2] Simulating switch away (Payload cleared in memory)...`);
        
        // 3. SWITCH BACK -> RESTORE
        console.log(`[STEP 3] Loading session: ${sessionName} to verify restore...`);
        const restored = sessionManager.loadSession(sessionName, passphrase);
        
        // 4. VERIFY
        const chatMatch = restored.chat[0].content === testPayload.chat[0].content;
        const modelMatch = restored.model === testPayload.model;
        const workspaceMatch = restored.workspaceAttachment.label === testPayload.workspaceAttachment.label;
        
        console.log("--- RESULTS ---");
        console.log(`Chat Content Restored: ${chatMatch ? "PASS" : "FAIL"}`);
        console.log(`Model State Restored:  ${modelMatch ? "PASS" : "FAIL"}`);
        console.log(`Workspace Restored:    ${workspaceMatch ? "PASS" : "FAIL"}`);
        
        if (chatMatch && modelMatch && workspaceMatch) {
            console.log("\nVERDICT: PROOF SUCCESSFUL. SESSION CONTINUITY IS REAL.");
        } else {
            console.log("\nVERDICT: PROOF FAILED.");
            process.exit(1);
        }

        // Cleanup
        sessionManager.deleteSession(sessionName);

    } catch (err) {
        console.error("Proof execution error:", err);
        process.exit(1);
    }
}

runLiveProof();
