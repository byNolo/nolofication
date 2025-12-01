# Contributing to Nolofication

Thank you for your interest in contributing to Nolofication! This is currently a private project as part of the byNolo ecosystem.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/nolofication.git
   cd nolofication
   ```

2. **Set up Backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # Configure .env with your settings
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure .env with your settings
   ```

4. **Run Development Servers**
   ```bash
   # From project root
   ./dev.sh
   ```

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints where possible
- Document functions with docstrings
- Keep functions focused and single-purpose

### JavaScript/React (Frontend)
- Use ESLint configuration
- Functional components with hooks
- Descriptive variable and function names
- Extract reusable components

## Making Changes

1. **Create a branch** for your feature/fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, concise commit messages
   - Test your changes thoroughly
   - Update documentation if needed

3. **Test**
   ```bash
   # Backend
   cd backend
   python3 scripts/test.py
   
   # Frontend
   cd frontend
   npm run build  # Ensure it builds
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

## Commit Message Format

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add webhook notification channel
fix: resolve timezone handling in scheduler
docs: update integration guide with examples
```

## Project Structure

```
nolofication/
├── backend/          # Flask API
├── frontend/         # React UI
├── docs/            # Documentation
└── scripts/         # Deployment scripts
```

## Need Help?

- Check existing documentation in `/docs`
- Review [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- Look at example integrations in `/backend/examples`

## Questions?

Contact: Sam @ byNolo
