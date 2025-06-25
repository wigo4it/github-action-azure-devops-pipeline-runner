"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActionInputs = getActionInputs;
const core = __importStar(require("@actions/core"));
const auth_1 = require("./auth");
const azure_devops_1 = require("./azure-devops");
/**
 * Parses action inputs and validates them
 * @returns ActionInputs The parsed and validated inputs
 * @throws Error if required inputs are missing or invalid
 */
function getActionInputs() {
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
        throw new Error("Invalid organization name. Organization names must start and end with alphanumeric characters.");
    }
    // Validate pipeline ID is numeric
    if (!/^\d+$/.test(pipelineId)) {
        throw new Error("Pipeline ID must be a numeric value.");
    }
    // Parse and validate pipeline parameters
    let pipelineParameters;
    try {
        pipelineParameters = JSON.parse(pipelineParametersInput);
    }
    catch (error) {
        throw new Error(`Invalid pipeline-parameters JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Parse and validate pipeline variables
    let pipelineVariables;
    try {
        const parsedVariables = JSON.parse(pipelineVariablesInput);
        pipelineVariables = {};
        // Convert to Variable format
        for (const [key, value] of Object.entries(parsedVariables)) {
            if (typeof value === "object" && value !== null && "value" in value) {
                // Already in Variable format
                pipelineVariables[key] = value;
            }
            else {
                // Convert simple value to Variable format
                pipelineVariables[key] = {
                    value: String(value),
                    isSecret: false,
                };
            }
        }
    }
    catch (error) {
        throw new Error(`Invalid pipeline-variables JSON: ${error instanceof Error ? error.message : String(error)}`);
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
async function run() {
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
        const isManagedIdentityAvailable = await (0, auth_1.validateManagedIdentityAvailability)();
        if (!isManagedIdentityAvailable) {
            throw new Error("Managed Identity is not available. This action must run on a self-hosted runner with Managed Identity enabled.");
        }
        core.info("Managed Identity is available");
        // Get access token using Managed Identity
        core.info("Acquiring access token...");
        const accessToken = await (0, auth_1.getManagedIdentityToken)();
        core.info("Successfully acquired access token");
        // Create Azure DevOps client
        const azureDevOpsClient = (0, azure_devops_1.createAzureDevOpsClient)(inputs.organization, accessToken);
        // Validate pipeline access
        core.info("Validating pipeline access...");
        const hasAccess = await azureDevOpsClient.validatePipelineAccess(inputs.project, inputs.pipelineId);
        if (!hasAccess) {
            throw new Error(`Cannot access pipeline ${inputs.pipelineId} in project ${inputs.project}. ` +
                "Please check that the pipeline exists and the Managed Identity has the required permissions.");
        }
        core.info("Pipeline access validated successfully");
        // Run the pipeline
        core.info(`${inputs.previewRun ? "Previewing" : "Starting"} pipeline run...`);
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
        core.info(`✅ Pipeline run ${inputs.previewRun ? "preview" : "execution"} completed successfully!`);
        core.info(`Run ID: ${pipelineRun.id}`);
        core.info(`Run Name: ${pipelineRun.name}`);
        core.info(`Status: ${pipelineRun.state}`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.setFailed(`Action failed: ${errorMessage}`);
    }
}
// Run the action
run();
//# sourceMappingURL=main.js.map