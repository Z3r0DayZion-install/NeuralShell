# Install Guide: Windows (NSIS)

## Requirements
- Windows 10 or later (x64)
- ~200 MB disk space

## Download
Download `NeuralShell Setup 2.1.29.exe` from the release page.

## Verify Integrity (Optional)
```powershell
# Compare against checksums.txt
certutil -hashfile "NeuralShell Setup 2.1.29.exe" SHA256
```

## Install
1. Double-click the installer
2. If SmartScreen appears: click **More info** → **Run anyway**
3. Follow the NSIS wizard (default path: `C:\Users\<you>\AppData\Local\Programs\NeuralShell`)

## Silent Install
```powershell
"NeuralShell Setup 2.1.29.exe" /S
```

## First Launch
1. Launch NeuralShell from the Start Menu or desktop shortcut
2. Complete the onboarding wizard (set up your LLM connection profile)
3. The app will persist your settings to `%APPDATA%\neuralshell-v5\`

## Upgrade
Run the new installer over the existing installation. User data is preserved.

## Uninstall
Use **Settings → Apps → NeuralShell → Uninstall**, or run:
```powershell
"C:\Users\<you>\AppData\Local\Programs\NeuralShell\Uninstall NeuralShell.exe" /S
```
User data in `%APPDATA%\neuralshell-v5\` is preserved by default.
