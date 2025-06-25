import { PipelineRun, ActionInputs } from "./types";
/**
 * Azure DevOps REST API client for pipeline operations
 */
export declare class AzureDevOpsClient {
    private readonly baseUrl;
    private readonly accessToken;
    private readonly apiVersion;
    constructor(organization: string, accessToken: string);
    /**
     * Runs a pipeline in Azure DevOps
     * @param inputs The action inputs containing pipeline configuration
     * @returns Promise<PipelineRun> The created pipeline run
     * @throws Error if the pipeline run fails to start
     */
    runPipeline(inputs: ActionInputs): Promise<PipelineRun>;
    /**
     * Gets a pipeline run by ID
     * @param project The project name or ID
     * @param pipelineId The pipeline ID
     * @param runId The run ID
     * @returns Promise<PipelineRun> The pipeline run details
     */
    getPipelineRun(project: string, pipelineId: string, runId: number): Promise<PipelineRun>;
    /**
     * Validates that the pipeline exists and is accessible
     * @param project The project name or ID
     * @param pipelineId The pipeline ID
     * @returns Promise<boolean> True if the pipeline is accessible
     */
    validatePipelineAccess(project: string, pipelineId: string): Promise<boolean>;
}
/**
 * Creates an Azure DevOps client instance
 * @param organization The Azure DevOps organization name
 * @param accessToken The access token for authentication
 * @returns AzureDevOpsClient instance
 */
export declare function createAzureDevOpsClient(organization: string, accessToken: string): AzureDevOpsClient;
