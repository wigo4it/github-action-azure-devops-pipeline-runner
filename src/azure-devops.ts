import * as core from "@actions/core";
import fetch from "node-fetch";
import {
  PipelineRun,
  RunPipelineParameters,
  AzureDevOpsError,
  ActionInputs,
} from "./types";

/**
 * Azure DevOps REST API client for pipeline operations
 */
export class AzureDevOpsClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly apiVersion = "7.2-preview.1";

  constructor(organization: string, accessToken: string) {
    this.baseUrl = `https://dev.azure.com/${organization}`;
    this.accessToken = accessToken;
  }

  /**
   * Runs a pipeline in Azure DevOps
   * @param inputs The action inputs containing pipeline configuration
   * @returns Promise<PipelineRun> The created pipeline run
   * @throws Error if the pipeline run fails to start
   */
  async runPipeline(inputs: ActionInputs): Promise<PipelineRun> {
    const {
      project,
      pipelineId,
      pipelineParameters,
      pipelineVariables,
      branch,
      previewRun,
    } = inputs;

    core.debug(
      `Starting pipeline run for pipeline ${pipelineId} in project ${project}`
    );

    const url = `${this.baseUrl}/${project}/_apis/pipelines/${pipelineId}/runs?api-version=${this.apiVersion}`;

    // Prepare the request body
    const requestBody: RunPipelineParameters = {
      previewRun,
      templateParameters: pipelineParameters,
      variables: pipelineVariables,
    };

    // Add repository resource if branch is specified
    if (branch) {
      requestBody.resources = {
        repositories: {
          self: {
            refName: branch,
          },
        },
      };
    }

    core.debug(`Request URL: ${url}`);
    core.debug(`Request body: ${JSON.stringify(requestBody, null, 2)}`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseBody = await response.text();

      if (!response.ok) {
        let errorMessage = `Azure DevOps API request failed with status ${response.status}`;

        try {
          const errorData = JSON.parse(responseBody) as AzureDevOpsError;
          errorMessage = `${errorMessage}: ${errorData.message}`;
        } catch {
          errorMessage = `${errorMessage}: ${responseBody}`;
        }

        core.error(errorMessage);
        throw new Error(errorMessage);
      }

      const pipelineRun = JSON.parse(responseBody) as PipelineRun;

      core.info(
        `Successfully ${
          previewRun ? "previewed" : "started"
        } pipeline run with ID: ${pipelineRun.id}`
      );
      core.debug(
        `Pipeline run details: ${JSON.stringify(pipelineRun, null, 2)}`
      );

      return pipelineRun;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      core.error(`Failed to run pipeline: ${errorMessage}`);
      throw new Error(`Failed to run pipeline: ${errorMessage}`);
    }
  }

  /**
   * Gets a pipeline run by ID
   * @param project The project name or ID
   * @param pipelineId The pipeline ID
   * @param runId The run ID
   * @returns Promise<PipelineRun> The pipeline run details
   */
  async getPipelineRun(
    project: string,
    pipelineId: string,
    runId: number
  ): Promise<PipelineRun> {
    const url = `${this.baseUrl}/${project}/_apis/pipelines/${pipelineId}/runs/${runId}?api-version=${this.apiVersion}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to get pipeline run: ${response.status} ${response.statusText}`
        );
      }

      const pipelineRun = (await response.json()) as PipelineRun;
      return pipelineRun;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      core.error(`Failed to get pipeline run: ${errorMessage}`);
      throw new Error(`Failed to get pipeline run: ${errorMessage}`);
    }
  }

  /**
   * Validates that the pipeline exists and is accessible
   * @param project The project name or ID
   * @param pipelineId The pipeline ID
   * @returns Promise<boolean> True if the pipeline is accessible
   */
  async validatePipelineAccess(
    project: string,
    pipelineId: string
  ): Promise<boolean> {
    const url = `${this.baseUrl}/${project}/_apis/pipelines/${pipelineId}?api-version=${this.apiVersion}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      core.debug(
        `Pipeline validation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }
}

/**
 * Creates an Azure DevOps client instance
 * @param organization The Azure DevOps organization name
 * @param accessToken The access token for authentication
 * @returns AzureDevOpsClient instance
 */
export function createAzureDevOpsClient(
  organization: string,
  accessToken: string
): AzureDevOpsClient {
  return new AzureDevOpsClient(organization, accessToken);
}
