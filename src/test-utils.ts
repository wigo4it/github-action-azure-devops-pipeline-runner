/**
 * Test utilities and helpers for Azure DevOps Pipeline Runner tests
 */

import { PipelineRun, ActionInputs, Variable } from "./types";

/**
 * Creates a mock PipelineRun object for testing
 */
export function createMockPipelineRun(overrides: Partial<PipelineRun> = {}): PipelineRun {
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
      folder: ""
    },
    url: "https://dev.azure.com/test-org/test-project/_apis/pipelines/123/runs/456",
    _links: {
      web: {
        href: "https://dev.azure.com/test-org/test-project/_build/results?buildId=456"
      },
      self: {
        href: "https://dev.azure.com/test-org/test-project/_apis/pipelines/123/runs/456"
      }
    },
    ...overrides
  };
}

/**
 * Creates a mock ActionInputs object for testing
 */
export function createMockActionInputs(overrides: Partial<ActionInputs> = {}): ActionInputs {
  return {
    organization: "test-org",
    project: "test-project",
    pipelineId: "123",
    pipelineParameters: {},
    pipelineVariables: {},
    previewRun: false,
    ...overrides
  };
}

/**
 * Creates mock variables in the correct format
 */
export function createMockVariables(variables: Record<string, string | Variable>): Record<string, Variable> {
  const result: Record<string, Variable> = {};
  
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === "string") {
      result[key] = { value, isSecret: false };
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Mock Response class that mimics fetch Response for testing
 */
export class MockResponse {
  constructor(
    private body: string | object,
    private status: number = 200,
    private statusText: string = "OK"
  ) {}

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  async text(): Promise<string> {
    return typeof this.body === "string" ? this.body : JSON.stringify(this.body);
  }

  async json(): Promise<any> {
    return typeof this.body === "object" ? this.body : JSON.parse(this.body);
  }
}

/**
 * Helper to create a timeout promise for testing async operations
 */
export function createTimeoutPromise(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to advance Jest fake timers and flush promises
 */
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  jest.advanceTimersByTime(ms);
  // Allow promises to resolve
  await new Promise(resolve => setImmediate(resolve));
}

/**
 * Common test constants
 */
export const TEST_CONSTANTS = {
  ORGANIZATION: "test-org",
  PROJECT: "test-project", 
  PIPELINE_ID: "123",
  ACCESS_TOKEN: "test-token-12345",
  RUN_ID: 456,
  IMDS_ENDPOINT: "http://169.254.169.254/metadata/identity/oauth2/token",
  AZURE_DEVOPS_RESOURCE: "https://app.vssps.visualstudio.com/"
} as const;
