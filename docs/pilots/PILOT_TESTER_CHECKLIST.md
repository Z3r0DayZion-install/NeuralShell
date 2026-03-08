# NeuralShell Pilot Tester Instructions

Thank you for participating in the NeuralShell Technical Pilot. This process is designed to verify the integrity of the software before execution.

## Pilot Steps
1. **Download:** Acquire the distribution ZIP (`NeuralShell_IP_Gold_Master_DISTRIBUTION_v1.0.0-OMEGA.zip`).
2. **Hash Verification:** Verify the SHA256 hash of the ZIP file matches the published value.
3. **Extract:** Extract the bundle to a local directory.
4. **Audit:** Run the verification script: `powershell .\scripts\VERIFY_RELEASE.ps1`.
5. **Anchor Check:** Confirm the root fingerprints in the terminal match the published trust anchors.
6. **Launch:** Execute `NeuralShell.exe` from the `dist/win-unpacked` folder or run the installer.
7. **Report:** Fill out the feedback form and report any issues or friction.

## Key Data Points to Observe
- Windows SmartScreen behavior (Blue "Windows protected your PC" dialogs).
- Antivirus / EDR alerts.
- Friction or confusion during the verification script execution.
- Total time from download to the first successful prompt.
- Any trust concerns regarding the "Silicon Anchor" (hardware binding).
