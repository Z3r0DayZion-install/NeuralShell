# Contributing to NeuralShell

Thank you for your interest in contributing to NeuralShell!

## Code of Conduct

Please be respectful and professional. We welcome contributors from all backgrounds.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a detailed issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Suggesting Features

1. Open an issue with `[FEATURE]` prefix
2. Describe the feature and its use case
3. Explain why this would be beneficial

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/neuralshell.git
cd neuralshell

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server
npm run dev

# Run tests
npm test
```

### Coding Standards

- Use JavaScript ES6+ features
- Follow existing code style
- Add tests for new features
- Update documentation
- Use meaningful variable names

### Commit Messages

- Use imperative mood
- Start with verb (Add, Fix, Update, Remove)
- Keep under 72 characters
- Reference issues: `Fix #123`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
