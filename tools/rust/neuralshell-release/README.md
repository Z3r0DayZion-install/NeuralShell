# neuralshell-release

Rust CLI that automates producing a reproducible bundle under `out/releases/`.

## Usage

```powershell
cargo run -p neuralshell-release -- bundle
```

Options:

- `--desktop/--no-desktop`
- `--docker/--no-docker`
- `--docker-tag <tag>`
- `--port <hostPort>`

This tool records git status/diff when available.
