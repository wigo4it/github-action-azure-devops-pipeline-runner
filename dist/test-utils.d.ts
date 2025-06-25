/**
 * Test utilities and helpers for Azure DevOps Pipeline Runner tests
 */
import { PipelineRun, ActionInputs, Variable } from "./types";
/**
 * Creates a mock PipelineRun object for testing
 */
export declare function createMockPipelineRun(overrides?: Partial<PipelineRun>): PipelineRun;
/**
 * Creates a mock ActionInputs object for testing
 */
export declare function createMockActionInputs(overrides?: Partial<ActionInputs>): ActionInputs;
/**
 * Creates mock variables in the correct format
 */
export declare function createMockVariables(variables: Record<string, string | Variable>): Record<string, Variable>;
/**
 * Mock Response class that mimics fetch Response for testing
 */
export declare class MockResponse {
    private body;
    private status;
    private statusText;
    constructor(body: string | object, status?: number, statusText?: string);
    get ok(): boolean;
    text(): Promise<string>;
    json(): Promise<any>;
}
/**
 * Helper to create a timeout promise for testing async operations
 */
export declare function createTimeoutPromise(ms: number): Promise<void>;
/**
 * Helper to advance Jest fake timers and flush promises
 */
export declare function advanceTimersAndFlush(ms: number): Promise<void>;
/**
 * Common test constants
 */
export declare const TEST_CONSTANTS: {
    readonly ORGANIZATION: "test-org";
    readonly PROJECT: "test-project";
    readonly PIPELINE_ID: "123";
    readonly ACCESS_TOKEN: "test-token-12345";
    readonly RUN_ID: 456;
    readonly IMDS_ENDPOINT: "http://169.254.169.254/metadata/identity/oauth2/token";
    readonly AZURE_DEVOPS_RESOURCE: "https://app.vssps.visualstudio.com/";
};
