# NeuralShell V2.1 Icon Asset Notes

The icon set for NeuralShell V2.1 has been consolidated into a professional, production-ready suite.

## Source Assets
- **`assets/logo-mark.svg`**: The primary source for all icon generation.
- **`assets/logo-primary.svg`**: The full branding with wordmark.
- **`assets/logo-wordmark.svg`**: Wordmark-only asset.

## Generated Icons
The following icons are generated via `npm run icons:generate` (using `tear/generate-icons.js` and `icon-gen`):

- **Windows**: `assets/icon.ico`
- **macOS**: `assets/icon.icns`
- **Linux/Web**: `assets/icon.png`, `assets/icon-512.png`
- **Favicons**: `assets/icon-16.png`, `assets/icon-32.png`, `assets/icon-64.png`, `assets/icon-128.png`, `assets/icon-256.png`

## Build Integration
The icons are automatically linked in `package.json` for Electron builder:
```json
"win": { "icon": "assets/icon.ico" },
"mac": { "icon": "assets/icon.icns" },
"linux": { "icon": "assets/icon.png" }
```

## Maintenance
To update the icons:
1. Modify `assets/logo-mark.svg`.
2. Run `npm run icons:generate`.
3. Rebuild the application using `npm run build`.
