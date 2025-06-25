# Azure DevOps Pipeline Runner

[![CI/CD](https://github.com/wigo4it/github-action-azure-devops-pipeline-runner/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/wigo4it/github-action-azure-devops-pipeline-runner/actions/workflows/ci-cd.yml)
[![Check PR](https://github.com/wigo4it/github-action-azure-devops-pipeline-runner/actions/workflows/check-pr.yml/badge.svg)](https://github.com/wigo4it/github-action-azure-devops-pipeline-runner/actions/workflows/check-pr.yml)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/wigo4it/github-action-azure-devops-pipeline-runner)](https://github.com/wigo4it/github-action-azure-devops-pipeline-runner/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A GitHub Action that enables running Azure DevOps pipelines from GitHub workflows using Azure Managed Identity authentication.

## Features

- ✅ **Managed Identity Authentication**: Securely authenticate using Azure Managed Identity (no secrets required)
- 🚀 **Pipeline Execution**: Start Azure DevOps pipelines with custom parameters and variables
- 🔍 **Preview Mode**: Preview pipeline runs without actually executing them
- 📊 **Rich Outputs**: Get pipeline run details including ID, URL, and status
- 🛡️ **Error Handling**: Comprehensive error handling with retry logic for network issues
- 📝 **Detailed Logging**: Debug-friendly logging for troubleshooting

## Prerequisites

- **Self-hosted GitHub Runner**: This action requires a self-hosted runner with Azure Managed Identity enabled
- **Azure DevOps Permissions**: The Managed Identity must have `vso.build_execute` scope for the target Azure DevOps organization
- **Network Access**: The runner must have access to both Azure Instance Metadata Service (IMDS) and Azure DevOps REST API

## Usage

### Basic Example

```yaml
name: Run Azure DevOps Pipeline

on:
  push:
    branches: [main]

jobs:
  run-pipeline:
    runs-on: self-hosted # Must be a self-hosted runner with Managed Identity
    steps:
      - name: Run Azure DevOps Pipeline
        uses: wigo4it/github-action-azure-devops-pipeline-runner@v1
        with:
          azure-devops-organization: "myorg"
          azure-devops-project: "myproject"
          pipeline-id: "123"
```

### Advanced Example with Parameters

```yaml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - name: Deploy via Azure DevOps Pipeline
        uses: wigo4it/github-action-azure-devops-pipeline-runner@v1
        with:
          azure-devops-organization: "myorg"
          azure-devops-project: "myproject"
          pipeline-id: "456"
          branch: "refs/heads/main"
          pipeline-parameters: |
            {
              "environment": "production",
              "version": "${{ github.event.release.tag_name }}",
              "deploymentType": "rolling"
            }
          pipeline-variables: |
            {
              "BUILD_NUMBER": {
                "value": "${{ github.run_number }}",
                "isSecret": false
              },
              "API_KEY": {
                "value": "secret-value",
                "isSecret": true
              }
            }
        id: deploy

      - name: Output Pipeline Details
        run: |
          echo "Pipeline Run ID: ${{ steps.deploy.outputs.run-id }}"
          echo "Pipeline Run URL: ${{ steps.deploy.outputs.run-url }}"
          echo "Pipeline Status: ${{ steps.deploy.outputs.status }}"
```

### Preview Mode Example

```yaml
name: Preview Pipeline Changes

on:
  pull_request:
    branches: [main]

jobs:
  preview:
    runs-on: self-hosted
    steps:
      - name: Preview Pipeline Run
        uses: wigo4it/github-action-azure-devops-pipeline-runner@v1
        with:
          azure-devops-organization: "myorg"
          azure-devops-project: "myproject"
          pipeline-id: "789"
          preview-run: true
          pipeline-parameters: |
            {
              "environment": "staging",
              "branch": "${{ github.head_ref }}"
            }
```

## Inputs

| Input                       | Description                                 | Required | Default |
| --------------------------- | ------------------------------------------- | -------- | ------- |
| `azure-devops-organization` | Azure DevOps organization name              | ✅       |         |
| `azure-devops-project`      | Azure DevOps project name or ID             | ✅       |         |
| `pipeline-id`               | Pipeline ID to run                          | ✅       |         |
| `pipeline-parameters`       | Pipeline template parameters as JSON string | ❌       | `{}`    |
| `pipeline-variables`        | Pipeline variables as JSON string           | ❌       | `{}`    |
| `branch`                    | Branch/ref to run pipeline from             | ❌       |         |
| `preview-run`               | Preview the run without executing           | ❌       | `false` |

### Input Details

#### `pipeline-parameters`

Template parameters passed to the pipeline. Must be valid JSON.

```yaml
pipeline-parameters: |
  {
    "environment": "production",
    "region": "eastus",
    "instanceCount": 3
  }
```

#### `pipeline-variables`

Pipeline variables with optional secret flag. Can be simple key-value pairs or Variable objects.

Simple format:

```yaml
pipeline-variables: |
  {
    "BUILD_NUMBER": "123",
    "ENVIRONMENT": "prod"
  }
```

Advanced format with secret variables:

```yaml
pipeline-variables: |
  {
    "BUILD_NUMBER": {
      "value": "123",
      "isSecret": false
    },
    "API_KEY": {
      "value": "secret-value",
      "isSecret": true
    }
  }
```

#### `branch`

Specify a branch or ref to run the pipeline from. Format examples:

- `refs/heads/main`
- `refs/heads/feature/new-feature`
- `refs/tags/v1.0.0`

## Outputs

| Output     | Description                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| `run-id`   | The ID of the created pipeline run                                                     |
| `run-url`  | Direct URL to the pipeline run in Azure DevOps                                         |
| `status`   | Initial status of the pipeline run (`unknown`, `inProgress`, `canceling`, `completed`) |
| `run-name` | Name of the pipeline run                                                               |

## Authentication

This action uses **Azure Managed Identity** for authentication, which provides several security benefits:

- ✅ **No secrets management**: No need to store Azure DevOps Personal Access Tokens or Service Principal credentials
- ✅ **Automatic token management**: Tokens are automatically acquired and refreshed
- ✅ **Least privilege**: Managed Identity can be assigned only the necessary permissions
- ✅ **Audit trail**: All authentication attempts are logged in Azure

### Setting up Managed Identity

1. **Enable Managed Identity** on your Azure VM or container that hosts the GitHub runner
2. **Assign Azure DevOps permissions** to the Managed Identity:
   - Navigate to Azure DevOps Organization Settings
   - Go to Users and add the Managed Identity
   - Assign the `Build Execute` permission or a custom role with `vso.build_execute` scope

### Required Permissions

The Managed Identity needs the following Azure DevOps permissions:

- **Scope**: `vso.build_execute`
- **Description**: Grants ability to queue builds and access build artifacts

## Error Handling

The action includes comprehensive error handling:

- **Retry Logic**: Automatic retries for transient network failures
- **Validation**: Pre-execution validation of pipeline access and parameters
- **Detailed Errors**: Clear error messages for common issues
- **Debug Logging**: Enable debug logging with `ACTIONS_STEP_DEBUG=true`

### Common Issues

#### Managed Identity Not Available

```
Error: Managed Identity is not available. This action must run on a self-hosted runner with Managed Identity enabled.
```

**Solution**: Ensure the runner is hosted on an Azure VM with Managed Identity enabled.

#### Pipeline Access Denied

```
Error: Cannot access pipeline 123 in project myproject. Please check that the pipeline exists and the Managed Identity has the required permissions.
```

**Solution**: Verify the Managed Identity has `vso.build_execute` permissions in Azure DevOps.

#### Invalid JSON Parameters

```
Error: Invalid pipeline-parameters JSON: Unexpected token } in JSON at position 15
```

**Solution**: Validate your JSON syntax using a JSON validator.

## API Reference

This action uses the Azure DevOps REST API version `7.2-preview.1`. For more details, see:

- [Azure DevOps REST API - Run Pipeline](https://learn.microsoft.com/en-us/rest/api/azure/devops/pipelines/runs/run-pipeline?view=azure-devops-rest-7.2)

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Package for distribution
npm run package

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure

```
/
├── src/                   # TypeScript source code
│   ├── main.ts            # Entry point
│   ├── auth.ts            # Managed Identity authentication
│   ├── azure-devops.ts    # Azure DevOps API client
│   └── types.ts           # TypeScript type definitions
├── dist/                  # Compiled JavaScript (for distribution)
├── action.yml             # GitHub Action metadata
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Development

### Versioning

This project uses [GitVersion](https://gitversion.net/) for automatic semantic versioning based on conventional commits. The versioning behavior is configured in `GitVersion.yml`.

#### Commit Message Format

Follow conventional commit format to ensure proper version bumping:

- `fix: description` → **Patch** version increment (v1.0.X)
- `feat: description` → **Minor** version increment (v1.X.0)
- `feat!: description` or `BREAKING CHANGE:` → **Major** version increment (vX.0.0)

Other prefixes (`docs:`, `chore:`, `style:`, `test:`, etc.) won't trigger a version increment.

#### Release Process

1. Merge pull requests to `main` branch
2. GitVersion automatically calculates the next version based on commit messages
3. GitHub Actions creates a release with the calculated version
4. Major version tags (v1, v2, etc.) are automatically updated

### Building and Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build TypeScript
npm run build

# Package for distribution
npm run package

# Run all checks
npm run all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm run all` to build and package
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

- 🐛 **Bug Reports**: Open an issue with detailed reproduction steps
- 💡 **Feature Requests**: Open an issue with your use case
- 📖 **Documentation**: Check the README and Azure DevOps REST API docs
- 🔍 **Debugging**: Enable debug logging with `ACTIONS_STEP_DEBUG=true`
