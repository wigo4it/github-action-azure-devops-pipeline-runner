import * as core from "@actions/core";
import {
  getManagedIdentityToken,
  validateManagedIdentityAvailability,
} from "./auth";
import { createAzureDevOpsClient } from "./azure-devops";
import { ActionInputs, Variable } from "./types";

/**
 * Parses action inputs and validates them
 * @returns ActionInputs The parsed and validated inputs
 * @throws Error if required inputs are missing or invalid
 */
export function getActionInputs(): ActionInputs {
  const organization = core.getInput("azure-devops-organization", {
    required: true,
  });
  const project = core.getInput("azure-devops-project", { required: true });
  const pipelineId = core.getInput("pipeline-id", { required: true });
  const pipelineParametersInput = core.getInput("pipeline-parameters") || "{}";
  const pipelineVariablesInput = core.getInput("pipeline-variables") || "{}";
  const branch = core.getInput("branch") || undefined;
  const previewRun = core.getBooleanInput("preview-run");

  // Validate organization name
  if (!/^[a-zA-Z0-9][\w.-]*[a-zA-Z0-9]$/.test(organization)) {
    throw new Error(
      "Invalid organization name. Organization names must start and end with alphanumeric characters.",
    );
  }

  // Validate pipeline ID is numeric
  if (!/^\d+$/.test(pipelineId)) {
    throw new Error("Pipeline ID must be a numeric value.");
  }

  // Parse and validate pipeline parameters
  let pipelineParameters: Record<string, unknown>;
  try {
    pipelineParameters = JSON.parse(pipelineParametersInput) as Record<
      string,
      unknown
    >;
  } catch (error) {
    throw new Error(
      `Invalid pipeline-parameters JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // Parse and validate pipeline variables
  let pipelineVariables: Record<string, Variable>;
  try {
    const parsedVariables = JSON.parse(pipelineVariablesInput) as Record<
      string,
      unknown
    >;
    pipelineVariables = {};

    // Convert to Variable format
    for (const [key, value] of Object.entries(parsedVariables)) {
      if (typeof value === "object" && value !== null && "value" in value) {
        // Already in Variable format
        pipelineVariables[key] = value as Variable;
      } else {
        // Convert simple value to Variable format
        pipelineVariables[key] = {
          value: String(value),
          isSecret: false,
        };
      }
    }
  } catch (error) {
    throw new Error(
      `Invalid pipeline-variables JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return {
    organization,
    project,
    pipelineId,
    pipelineParameters,
    pipelineVariables,
    branch,
    previewRun,
  };
}

/**
 * Main function that orchestrates the pipeline run
 */
async function run(): Promise<void> {
  try {
    core.info("Starting Azure DevOps Pipeline Runner...");

    // Parse and validate inputs
    const inputs = getActionInputs();
    core.info(`Organization: ${inputs.organization}`);
    core.info(`Project: ${inputs.project}`);
    core.info(`Pipeline ID: ${inputs.pipelineId}`);
    core.info(`Preview Run: ${inputs.previewRun}`);

    if (inputs.branch) {
      core.info(`Branch: ${inputs.branch}`);
    }

    // Check if Managed Identity is available
    const isManagedIdentityAvailable =
      await validateManagedIdentityAvailability();
    if (!isManagedIdentityAvailable) {
      throw new Error(
        "Managed Identity is not available. This action must run on a self-hosted runner with Managed Identity enabled.",
      );
    }

    core.info("Managed Identity is available");

    // Get access token using Managed Identity
    core.info("Acquiring access token...");
    const accessToken = await getManagedIdentityToken();
    core.info("Successfully acquired access token");

    // Create Azure DevOps client
    const azureDevOpsClient = createAzureDevOpsClient(
      inputs.organization,
      accessToken,
    );

    // Validate pipeline access
    core.info("Validating pipeline access...");
    const hasAccess = await azureDevOpsClient.validatePipelineAccess(
      inputs.project,
      inputs.pipelineId,
    );
    if (!hasAccess) {
      throw new Error(
        `Cannot access pipeline ${inputs.pipelineId} in project ${inputs.project}. ` +
          "Please check that the pipeline exists and the Managed Identity has the required permissions.",
      );
    }
    core.info("Pipeline access validated successfully");

    // Run the pipeline
    core.info(
      `${inputs.previewRun ? "Previewing" : "Starting"} pipeline run...`,
    );
    const pipelineRun = await azureDevOpsClient.runPipeline(inputs);

    // Set outputs
    core.setOutput("run-id", pipelineRun.id.toString());
    core.setOutput("run-name", pipelineRun.name);
    core.setOutput("status", pipelineRun.state);

    // Set run URL if available
    if (pipelineRun._links?.web?.href) {
      core.setOutput("run-url", pipelineRun._links.web.href);
      core.info(`Pipeline run URL: ${pipelineRun._links.web.href}`);
    }

    core.info(
      `✅ Pipeline run ${
        inputs.previewRun ? "preview" : "execution"
      } completed successfully!`,
    );
    core.info(`Run ID: ${pipelineRun.id}`);
    core.info(`Run Name: ${pipelineRun.name}`);
    core.info(`Status: ${pipelineRun.state}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

// Run the action
run();
