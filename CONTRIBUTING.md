# 🤝 Contributing to ITIC Portal

Thank you for your interest in contributing to the **ITIC Portal**! We welcome and appreciate contributions from developers of all skill levels to improve, fix, and expand the portal's capabilities.

To maintain a healthy codebase and smooth development flow, please take a moment to review this contribution guide before submitting your first issue or Pull Request.

---

## 🚀 Getting Started

### Prerequisites
Before you start contributing, ensure you have the following installed on your machine:
- **Node.js** (v18.x or later is recommended)
- **pnpm** (preferred package manager) or **npm** (v9.x or later)
- **Git**

### Local Repository Setup
1. **Fork and Clone**:
   Fork the main repository on GitHub, then clone your fork locally:
   ```bash
   git clone https://github.com/your-username/itic-portal.git
   cd itic-portal
   ```
2. **Install Dependencies**:
   Install all package workspace dependencies at the root directory:
   ```bash
   pnpm install
   # or
   npm install
   ```
3. **Configure Environment Variables**:
   Follow instructions in [README.md](./README.md) to set up your Supabase database client and Express API parameters. Ensure you place necessary environment files in respective subdirectories (e.g., `artifacts/mobile/.env`, `artifacts/api-server/.env`).

---

## 🎨 Code Quality & Style Guidelines

### Coding Standards
- **TypeScript**: We enforce strict type-safety. Avoid using the `any` keyword unless absolutely necessary and well-documented. Always define appropriate interfaces, types, or enums.
- **Imports**: All `import` statements must be placed at the top of the file. Use named imports instead of general object destructuring where applicable.
- **Tailwind CSS**: For web components in the mockup sandbox, use standard utility Tailwind classes directly. Avoid creating redundant custom CSS classes or using inline style attributes.
- **React Native Components**: Maintain responsive dimensions. Do not use fixed widths for elements that need to adapt across various iOS and Android form factors. Use the standard mobile padding guides.

### Linting & Formatting
To make sure code remains clean and uniform, run formatting checks before committing your files:
```bash
# Run Prettier format check
pnpm exec prettier --check .

# Run ESLint or Type-Checks
pnpm run typecheck
```
Many sub-packages also include specific configurations. Please navigate to each subdirectory (e.g. `artifacts/mobile`, `artifacts/api-server`) to run individual workspace checks if you're working within a single module.

---

## 📝 Git Commit Guidelines

We use a semantic commit message convention based on [Conventional Commits](https://www.conventionalcommits.org/). This ensures a highly structured and readable repository history.

### Format
Commit messages should adhere to the following structure:
```text
<type>(<scope>): <short summary description>

[optional body details]
```

### Allowed Types
- **`feat`**: A new feature for the user or application.
- **`fix`**: A bug fix for the user or application.
- **`docs`**: Documentation changes only (e.g., modifying `README.md` or code comments).
- **`style`**: Formatting, semi-colons, whitespace, or visual styling changes that do not affect the execution logic.
- **`refactor`**: Code changes that neither fix a bug nor add a feature (restructuring or cleaning up).
- **`perf`**: Code changes that improve runtime execution performance or memory consumption.
- **`test`**: Adding missing tests or correcting existing ones.
- **`chore`**: Maintenance tasks, package configuration updates, or dependency bumping.

### Examples
- `feat(mobile): implement 3D spring flip animation for member ID card`
- `fix(auth): resolve session storage validation crash in mobile app`
- `docs(root): update Supabase setup steps and SQL editor guides`
- `style(sandbox): adjust grid cards layout to improve alignment`

---

## 📥 Pull Request (PR) Workflow

1. **Create a Feature Branch**:
   Always create a new branch from `main` to work on your changes. Use a descriptive name:
   ```bash
   git checkout -b feat/id-card-improvements
   # or
   git checkout -b fix/auth-token-refresh
   ```
2. **Implement Your Changes**:
   Write clean, modular code that addresses the issue or feature. Add brief, helpful comments where the logic is complex.
3. **Validate and Test**:
   - Run type-checks to make sure compile-time safety is maintained.
   - Verify that your changes work seamlessly in your simulator (iOS/Android) or browser window.
4. **Commit and Push**:
   Commit using conventional commit rules and push your branch to your remote fork:
   ```bash
   git add .
   git commit -m "feat(mobile): add portfolio links to back of member card"
   git push origin feat/id-card-improvements
   ```
5. **Open a Pull Request**:
   - Navigate to the original repository on GitHub.
   - Click "Compare & pull request" to initiate a PR from your branch.
   - Provide a clear, detailed explanation of what your code solves, what tests were run, and any potential side effects. Refer to open issue IDs if applicable (e.g., `Closes #42`).
6. **Incorporate Feedback**:
   Maintain active communication with maintainers. Address code review comments promptly by making updates and pushing them to the same branch.

---

## 💬 Code of Conduct
We expect all contributors to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md). Please be respectful, welcoming, and supportive in all public communications.
