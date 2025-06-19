# Test Documentation

## Overview

This project includes comprehensive unit tests for the Azure DevOps Pipeline Runner GitHub Action. The test suite covers authentication, Azure DevOps API integration, input validation, and error handling scenarios.

## Test Structure

### Test Files

- **`auth.test.ts`** - Tests for Managed Identity authentication
- **`azure-devops.test.ts`** - Tests for Azure DevOps API client functionality
- **`main.test.ts`** - Tests for input validation and parsing logic
- **`test-utils.ts`** - Helper utilities and mock factories for testing

### Coverage Areas

The test suite provides coverage for:

1. **Authentication Module (`auth.ts`)**
   - Managed Identity token acquisition
   - Retry logic for failed requests
   - Error handling for various failure scenarios
   - Availability validation

2. **Azure DevOps Client (`azure-devops.ts`)**
   - Pipeline execution with various configurations
   - Pipeline access validation
   - Error handling for API failures
   - Request/response processing

3. **Main Module (`main.ts`)**
   - Input validation and parsing
   - Variable format transformation
   - Organization name validation
   - Pipeline ID validation
   - JSON parameter validation

## Test Categories

### Unit Tests

Each module is tested in isolation with mocked dependencies:

- **Positive Test Cases**: Verify correct behavior with valid inputs
- **Negative Test Cases**: Verify proper error handling with invalid inputs
- **Edge Cases**: Test boundary conditions and unusual scenarios
- **Retry Logic**: Test resilience mechanisms for transient failures

### Mock Strategy

The tests use Jest mocking to isolate components:

- **External APIs**: `node-fetch` is mocked to simulate HTTP responses
- **GitHub Actions Core**: `@actions/core` is mocked for input/output operations
- **Azure Services**: IMDS endpoints are mocked for authentication testing

## Key Test Scenarios

### Authentication Tests

1. **Successful Token Acquisition**
   - Tests normal flow of getting Managed Identity token
   - Verifies correct API calls and token extraction

2. **Retry Mechanisms**
   - Tests automatic retry on network failures
   - Verifies exponential backoff and maximum retry limits

3. **Error Handling**
   - HTTP error responses (401, 404, etc.)
   - Network timeouts and connection failures
   - Malformed responses and missing tokens

4. **Availability Validation**
   - Tests detection of Managed Identity availability
   - Handles scenarios where IMDS is not accessible

### Azure DevOps API Tests

1. **Pipeline Execution**
   - Basic pipeline runs without parameters
   - Pipeline runs with template parameters
   - Pipeline runs with variables (including secrets)
   - Branch-specific pipeline execution
   - Preview runs vs. actual execution

2. **Pipeline Access Validation**
   - Successful validation of accessible pipelines
   - Handling of inaccessible or non-existent pipelines
   - Authentication and authorization failures

3. **Error Scenarios**
   - API errors with structured error responses
   - Network failures during API calls
   - Malformed API responses

### Input Validation Tests

1. **Organization Name Validation**
   - Valid organization name formats
   - Invalid formats (special characters, incorrect patterns)

2. **Pipeline ID Validation**
   - Numeric pipeline IDs (valid)
   - Non-numeric pipeline IDs (invalid)

3. **JSON Parameter Validation**
   - Valid JSON structures for parameters and variables
   - Malformed JSON handling
   - Empty parameter objects

4. **Variable Format Transformation**
   - Simple string values converted to Variable objects
   - Mixed format handling (some already in Variable format)
   - Secret variable handling

## Test Utilities

### Mock Factories

The `test-utils.ts` file provides factory functions for creating test data:

- `createMockPipelineRun()` - Creates realistic pipeline run objects
- `createMockActionInputs()` - Creates valid action input structures
- `createMockVariables()` - Creates properly formatted variable objects

### Mock Response Class

A custom `MockResponse` class simulates HTTP responses:
- Supports both successful and error responses
- Handles JSON and text response bodies
- Mimics the fetch Response interface

## Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test auth.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Test Configuration

The test configuration is defined in `jest.config.js`:

- **TypeScript Support**: Uses `ts-jest` for TypeScript compilation
- **Coverage Reporting**: Generates both text and LCOV reports
- **Test Environment**: Node.js environment for server-side testing
- **Mock Setup**: Automatic mocking of external dependencies

## Coverage Goals

The test suite aims for:

- **Statement Coverage**: > 80%
- **Branch Coverage**: > 70%
- **Function Coverage**: > 90%
- **Line Coverage**: > 80%

Current coverage (as of last run):
- All files: 80.7% statements, 65.95% branches, 83.33% functions, 81.43% lines

## Best Practices Demonstrated

### Test Organization

1. **Descriptive Test Names**: Tests clearly describe what they verify
2. **Arrange-Act-Assert**: Tests follow AAA pattern consistently
3. **Test Isolation**: Each test is independent and can run in any order
4. **Mock Management**: Mocks are reset between tests to prevent interference

### Error Testing

1. **Specific Error Messages**: Tests verify exact error messages
2. **Error Types**: Tests check for appropriate error types
3. **Error Propagation**: Tests verify errors bubble up correctly
4. **Graceful Degradation**: Tests verify fallback behaviors

### Async Testing

1. **Promise Handling**: Proper async/await usage in tests
2. **Timeout Management**: Reasonable timeouts for async operations
3. **Error Rejection**: Tests for both resolved and rejected promises

## Continuous Integration

The test suite is designed to run in CI environments:

- **No External Dependencies**: All external services are mocked
- **Deterministic Results**: Tests produce consistent results across runs
- **Fast Execution**: Tests complete quickly to enable rapid feedback
- **Clear Reporting**: Test results are easy to interpret in CI logs

## Future Enhancements

Potential improvements to the test suite:

1. **Integration Tests**: Add tests that exercise multiple components together
2. **Performance Tests**: Add tests for response time and memory usage
3. **Contract Tests**: Add tests that verify API contract compliance
4. **End-to-End Tests**: Add tests that exercise the complete GitHub Action workflow

## Debugging Tests

When tests fail:

1. **Check Mock Setup**: Verify mocks are configured correctly
2. **Inspect Error Messages**: Look for specific assertion failures
3. **Use Debug Output**: Enable Jest debugging for detailed information
4. **Isolate Failures**: Run individual tests to identify specific issues

```bash
# Run with debug output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="should successfully acquire a token"
```
