# GitHub Copilot Instructions

## Project Overview

This project is a custom **GitHub Action** written in **TypeScript** that enables running Azure DevOps pipelines from GitHub workflows. The action authenticates using **Managed Identity** (when running on custom GitHub runners) and uses the Azure DevOps REST API to trigger pipeline executions with optional parameters.

## Technical Stack

- **Language**: TypeScript (compiled to JavaScript for distribution)
- **Runtime**: Node.js
- **Authentication**: Azure Managed Identity
- **Target API**: Azure DevOps REST API
- **Distribution**: Compiled JavaScript (committed to repository)

## Project Structure Guidelines

Follow this recommended structure for the GitHub Action:

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
├── .gitignore             # Git ignore patterns
└── README.md              # Documentation
```

## Key Components

### 1. Action Metadata (`action.yml`)

- Define inputs for Azure DevOps organization, project, pipeline ID
- Support optional pipeline parameters as JSON input
- Specify Node.js runtime (node20)
- Main entry point should be `dist/index.js`

### 2. Authentication (`src/auth.ts`)

- Implement Managed Identity authentication flow
- Use Azure Instance Metadata Service (IMDS) endpoint
- Handle token acquisition and refresh
- Return valid access token for Azure DevOps API

### 3. Azure DevOps Client (`src/azure-devops.ts`)

- Create REST API client for Azure DevOps
- Implement pipeline run functionality
- Support passing parameters to pipeline runs
- Handle API responses and errors appropriately

### 4. Main Entry Point (`src/main.ts`)

- Parse GitHub Action inputs
- Orchestrate authentication and API calls
- Handle errors and provide meaningful output
- Set action outputs (e.g., run ID, status)

## Development Guidelines

### Authentication Implementation

```typescript
// Use Azure Instance Metadata Service for Managed Identity
const IMDS_ENDPOINT = "http://169.254.169.254/metadata/identity/oauth2/token";
const AZURE_DEVOPS_RESOURCE = "https://app.vssps.visualstudio.com/";

// Implement token acquisition with proper error handling
// Include retry logic for transient failures
// Cache tokens considering expiration times
```

### API Integration

```typescript
// Azure DevOps REST API patterns
const BASE_URL = 'https://dev.azure.com/{organization}';
const API_VERSION = 'api-version=7.1-preview.1';

// Pipeline run endpoint
POST https://dev.azure.com/{organization}/{project}/_apis/pipelines/{pipelineId}/runs
```

### Input Handling

- Validate required inputs (organization, project, pipeline ID)
- Parse optional parameters JSON safely
- Provide clear error messages for invalid inputs

### Error Handling

- Implement comprehensive error handling for all API calls
- Distinguish between authentication, authorization, and API errors
- Provide actionable error messages
- Use GitHub Actions core library for logging

### Dependencies

- `@actions/core` - GitHub Actions toolkit
- `@actions/github` - GitHub API access (if needed)
- `node-fetch` or `axios` - HTTP client for API calls
- Minimal additional dependencies for security

## Build and Distribution

### TypeScript Configuration

- Target ES2020 or later
- Enable strict mode
- Output to `dist/` directory
- Include source maps for debugging

### Build Process

1. Compile TypeScript to JavaScript
2. Bundle dependencies (consider using ncc)
3. Commit compiled output to `dist/` directory
4. Ensure `dist/index.js` is the main entry point

### Package Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "package": "ncc build src/main.ts -o dist",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  }
}
```

## Security Considerations

- **Never log sensitive information** (tokens, credentials)
- Validate all inputs to prevent injection attacks
- Use secure HTTP client configurations
- Handle token expiration gracefully
- Follow principle of least privilege for API permissions

## Testing Strategy

- Unit tests for authentication logic
- Mock Azure DevOps API responses
- Test error scenarios (network failures, auth failures)
- Integration tests with actual API (in separate environment)
- Validate input parsing and parameter handling

## Action Inputs

Define these inputs in `action.yml`:

- `azure-devops-organization` (required): Azure DevOps organization name
- `azure-devops-project` (required): Project name or ID
- `pipeline-id` (required): Pipeline ID to run
- `pipeline-parameters` (optional): JSON string of pipeline parameters
- `branch` (optional): Branch/ref to run pipeline from

## Action Outputs

Provide these outputs:

- `run-id`: The ID of the created pipeline run
- `run-url`: Direct URL to the pipeline run
- `status`: Initial status of the pipeline run

## Usage Example

```yaml
steps:
  - name: Run Azure DevOps Pipeline
    uses: wigo4it/github-action-azure-devops-pipeline-runner@v1
    with:
      azure-devops-organization: "myorg"
      azure-devops-project: "myproject"
      pipeline-id: "123"
      pipeline-parameters: '{"environment": "production", "version": "1.0.0"}'
```

## Code Style and Best Practices

- Use TypeScript strict mode
- Follow consistent naming conventions (camelCase for functions/variables)
- Add JSDoc comments for public functions
- Use async/await for asynchronous operations
- Implement proper logging using `@actions/core`
- Handle promises with proper error catching
- Use environment variables for configuration when appropriate

## Debugging and Troubleshooting

- Enable debug logging with `@actions/core.debug()`
- Log important milestones (auth success, API calls)
- Provide context in error messages
- Include request/response details (without sensitive data)
- Test with various pipeline configurations

## Version Management

- Use semantic versioning (semver)
- Tag releases appropriately
- Maintain compatibility with existing workflows
- Document breaking changes clearly
- Keep `dist/` directory updated with each release
