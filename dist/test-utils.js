"use strict";
/**
 * Test utilities and helpers for Azure DevOps Pipeline Runner tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONSTANTS = exports.MockResponse = void 0;
exports.createMockPipelineRun = createMockPipelineRun;
exports.createMockActionInputs = createMockActionInputs;
exports.createMockVariables = createMockVariables;
exports.createTimeoutPromise = createTimeoutPromise;
exports.advanceTimersAndFlush = advanceTimersAndFlush;
/**
 * Creates a mock PipelineRun object for testing
 */
function createMockPipelineRun(overrides = {}) {
    return {
        id: 456,
        name: "Test Pipeline Run",
        state: "inProgress",
        createdDate: "2023-12-01T10:00:00Z",
        pipeline: {
            id: 123,
            name: "Test Pipeline",
            revision: 1,
            url: "https://dev.azure.com/test-org/test-project/_apis/pipelines/123",
            folder: "",
        },
        url: "https://dev.azure.com/test-org/test-project/_apis/pipelines/123/runs/456",
        _links: {
            web: {
                href: "https://dev.azure.com/test-org/test-project/_build/results?buildId=456",
            },
            self: {
                href: "https://dev.azure.com/test-org/test-project/_apis/pipelines/123/runs/456",
            },
        },
        ...overrides,
    };
}
/**
 * Creates a mock ActionInputs object for testing
 */
function createMockActionInputs(overrides = {}) {
    return {
        organization: "test-org",
        project: "test-project",
        pipelineId: "123",
        pipelineParameters: {},
        pipelineVariables: {},
        previewRun: false,
        ...overrides,
    };
}
/**
 * Creates mock variables in the correct format
 */
function createMockVariables(variables) {
    const result = {};
    for (const [key, value] of Object.entries(variables)) {
        if (typeof value === "string") {
            result[key] = { value, isSecret: false };
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Mock Response class that mimics fetch Response for testing
 */
class MockResponse {
    constructor(body, status = 200, statusText = "OK") {
        this.body = body;
        this.status = status;
        this.statusText = statusText;
    }
    get ok() {
        return this.status >= 200 && this.status < 300;
    }
    async text() {
        return typeof this.body === "string" ? this.body : JSON.stringify(this.body);
    }
    async json() {
        return typeof this.body === "object" ? this.body : JSON.parse(this.body);
    }
}
exports.MockResponse = MockResponse;
/**
 * Helper to create a timeout promise for testing async operations
 */
function createTimeoutPromise(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Helper to advance Jest fake timers and flush promises
 */
async function advanceTimersAndFlush(ms) {
    jest.advanceTimersByTime(ms);
    // Allow promises to resolve
    await new Promise(resolve => setImmediate(resolve));
}
/**
 * Common test constants
 */
exports.TEST_CONSTANTS = {
    ORGANIZATION: "test-org",
    PROJECT: "test-project",
    PIPELINE_ID: "123",
    ACCESS_TOKEN: "test-token-12345",
    RUN_ID: 456,
    IMDS_ENDPOINT: "http://169.254.169.254/metadata/identity/oauth2/token",
    AZURE_DEVOPS_RESOURCE: "https://app.vssps.visualstudio.com/",
};
//# sourceMappingURL=test-utils.js.map