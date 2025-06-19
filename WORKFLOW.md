# GitHub Actions CI/CD Workflow

This repository uses automated CI/CD workflows to build, test, and deploy the GitHub Action with semantic versioning.

## Workflows Overview

### 1. CI/CD Workflow (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Pull requests to `main` branch
- Pushes to `main` branch (after PR merge)

**Jobs:**
- **test-and-build**: Runs on all triggers
  - Installs dependencies
  - Runs linting
  - Executes tests
  - Builds TypeScript
  - Packages for distribution
  - Validates dist/ directory is up-to-date
  - Uploads build artifacts

- **release**: Runs only on pushes to `main`
  - Determines semantic version based on commit messages
  - Builds and packages the action
  - Commits updated dist/ directory
  - Creates semantic release with changelog
  - Updates package.json version

- **update-major-version-tag**: Runs after successful release
  - Updates major version tags (v1, v2, etc.)
  - Makes the action available to users

- **validate-pr**: Runs only on pull requests
  - Downloads build artifacts
  - Validates action.yml structure
  - Validates dist/ directory
  - Comments on PR with validation results

### 2. PR Check Workflow (`.github/workflows/check-pr.yml`)

**Triggers:**
- Pull requests to `main` branch (opened, updated, ready for review)

**Jobs:**
- **check-conventional-commits**: Validates commit messages follow conventional commit format
- **check-semantic-version**: Analyzes what version would be released and comments on PR

### 3. Manual Release Workflow (`.github/workflows/manual-release.yml`)

**Triggers:**
- Manual workflow dispatch

**Options:**
- Release type: patch, minor, major
- Pre-release flag

## Semantic Versioning

This project uses [Semantic Versioning](https://semver.org/) with [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Version Bump Rules

| Commit Type | Example | Version Bump |
|-------------|---------|--------------|
| `fix:` | `fix: resolve authentication issue` | **Patch** (1.0.1) |
| `feat:` | `feat: add pipeline parameters support` | **Minor** (1.1.0) |
| `feat!:` or `BREAKING CHANGE:` | `feat!: change API interface` | **Major** (2.0.0) |
| `docs:`, `chore:`, `style:`, `test:`, etc. | `docs: update readme` | **No release** |

### Supported Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks
- `revert`: Revert previous changes
- `security`: Security fixes

## Release Process

### Automatic Releases (Recommended)

1. **Create a Pull Request** with conventional commit messages
2. **PR Validation** runs automatically:
   - Builds and tests the code
   - Validates commit messages
   - Shows version impact in comments
3. **Merge to Main** triggers automatic release if there are semantic changes
4. **Release Created** with:
   - New version tag (e.g., v1.2.3)
   - Updated major version tag (e.g., v1)
   - Release notes from commit messages
   - Updated CHANGELOG.md

### Manual Releases

Use the "Manual Release" workflow for:
- Emergency releases
- Pre-releases
- Specific version bumps

## Action Usage

After a release, users can reference the action using:

```yaml
# Specific version (recommended for production)
uses: wigo4it/github-action-azure-devops-pipeline-runner@v1.2.3

# Major version (gets updates automatically)
uses: wigo4it/github-action-azure-devops-pipeline-runner@v1

# Latest release (not recommended)
uses: wigo4it/github-action-azure-devops-pipeline-runner@main
```

## Development Workflow

### Setting Up

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Package: `npm run package`
5. Test: `npm test`

### Making Changes

1. **Create a branch** from `main`
2. **Make changes** with conventional commit messages
3. **Test locally**: `npm run all`
4. **Create PR** to `main`
5. **Review CI results** and version impact
6. **Merge** when approved

### Commit Message Examples

```bash
# Patch release
git commit -m "fix: handle timeout errors in API calls"

# Minor release  
git commit -m "feat: add support for pipeline variables"

# Major release
git commit -m "feat!: change authentication to use managed identity only"

# No release
git commit -m "docs: update usage examples in README"
git commit -m "chore: update dependencies"
git commit -m "test: add integration tests"
```

## Build Validation

The workflows ensure:

- ✅ TypeScript compiles without errors
- ✅ All tests pass
- ✅ Linting rules are followed
- ✅ Action metadata is valid
- ✅ Distribution files are up-to-date
- ✅ Semantic versioning rules are followed

## Troubleshooting

### Common Issues

1. **"dist/ directory has uncommitted changes"**
   - Run `npm run package` and commit the changes
   - The dist/ directory must be kept in sync with source code

2. **"Invalid commit message format"**
   - Use conventional commit format: `type: description`
   - Check supported types in the list above

3. **"No release triggered"**
   - Ensure commit messages use `feat:` or `fix:` prefixes
   - Other prefixes (`docs:`, `chore:`, etc.) don't trigger releases

### Getting Help

- Check workflow logs in the Actions tab
- Review commit message guidelines
- Use the manual release workflow for urgent releases
- Ensure all required checks pass before merging PRs

## Security

- ✅ No secrets in commit messages or logs
- ✅ Tokens are properly scoped
- ✅ Dependencies are regularly updated via Dependabot
- ✅ Build artifacts are validated before release
