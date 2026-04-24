# Install Guide: Linux (AppImage)

> **⚠️ Not yet available.** The Linux AppImage build is planned but has not been published. This guide is provided for when the build ships. Currently only Windows x64 is available.

## Requirements
- Linux x86_64 (Ubuntu 20.04+, Fedora 36+, Arch, etc.)
- FUSE support (`libfuse2` on Ubuntu 22.04+)
- ~200 MB disk space

## Download
Download `NeuralShell-2.1.29.AppImage` from the release page.

## Verify Integrity (Optional)
```bash
sha256sum NeuralShell-2.1.29.AppImage
# Compare against checksums.txt
```

## Install
AppImage is a portable format — no system installation required.

```bash
chmod +x NeuralShell-2.1.29.AppImage
./NeuralShell-2.1.29.AppImage
```

### FUSE Dependency (Ubuntu 22.04+)
If you see a FUSE error:
```bash
sudo apt install libfuse2
```

### Desktop Integration (Optional)
For menu/launcher integration, use `appimaged` or manually create a `.desktop` file:
```bash
# Using appimaged (auto-integrates AppImages in ~/Applications)
wget -qO ~/bin/appimaged https://github.com/AppImage/appimaged/releases/latest/download/appimaged-x86_64.AppImage
chmod +x ~/bin/appimaged && ~/bin/appimaged
```

Or manually:
```bash
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/neuralshell.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=NeuralShell
Exec=/path/to/NeuralShell-2.1.29.AppImage
Icon=neuralshell
Categories=Utility;Development;
EOF
```

## First Launch
1. Run the AppImage
2. Complete the onboarding wizard (set up your LLM connection profile)
3. Settings are stored in `~/.config/neuralshell-v5/`

## Upgrade
Download the new AppImage, `chmod +x`, and replace the old one. User data is preserved.

## Uninstall
Delete the AppImage file. Optionally remove user data:
```bash
rm -rf ~/.config/neuralshell-v5/
```
