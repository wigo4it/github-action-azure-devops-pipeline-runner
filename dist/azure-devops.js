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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureDevOpsClient = void 0;
exports.createAzureDevOpsClient = createAzureDevOpsClient;
const core = __importStar(require("@actions/core"));
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Azure DevOps REST API client for pipeline operations
 */
class AzureDevOpsClient {
    constructor(organization, accessToken) {
        this.apiVersion = "7.2-preview.1";
        this.baseUrl = `https://dev.azure.com/${organization}`;
        this.accessToken = accessToken;
    }
    /**
     * Runs a pipeline in Azure DevOps
     * @param inputs The action inputs containing pipeline configuration
     * @returns Promise<PipelineRun> The created pipeline run
     * @throws Error if the pipeline run fails to start
     */
    async runPipeline(inputs) {
        const { project, pipelineId, pipelineParameters, pipelineVariables, branch, previewRun, } = inputs;
        core.debug(`Starting pipeline run for pipeline ${pipelineId} in project ${project}`);
        const url = `${this.baseUrl}/${project}/_apis/pipelines/${pipelineId}/runs?api-version=${this.apiVersion}`;
        // Prepare the request body
        const requestBody = {
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
            const response = await (0, node_fetch_1.default)(url, {
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
                    const errorData = JSON.parse(responseBody);
                    errorMessage = `${errorMessage}: ${errorData.message}`;
                }
                catch {
                    errorMessage = `${errorMessage}: ${responseBody}`;
                }
                core.error(errorMessage);
                throw new Error(errorMessage);
            }
            const pipelineRun = JSON.parse(responseBody);
            core.info(`Successfully ${previewRun ? "previewed" : "started"} pipeline run with ID: ${pipelineRun.id}`);
            core.debug(`Pipeline run details: ${JSON.stringify(pipelineRun, null, 2)}`);
            return pipelineRun;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
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
    async getPipelineRun(project, pipelineId, runId) {
        const url = `${this.baseUrl}/${project}/_apis/pipelines/${pipelineId}/runs/${runId}?api-version=${this.apiVersion}`;
        try {
            const response = await (0, node_fetch_1.default)(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to get pipeline run: ${response.status} ${response.statusText}`);
            }
            const pipelineRun = (await response.json());
            return pipelineRun;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
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
    async validatePipelineAccess(project, pipelineId) {
        const url = `${this.baseUrl}/${project}/_apis/pipelines/${pipelineId}?api-version=${this.apiVersion}`;
        try {
            const response = await (0, node_fetch_1.default)(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    Accept: "application/json",
                },
            });
            return response.ok;
        }
        catch (error) {
            core.debug(`Pipeline validation failed: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
}
exports.AzureDevOpsClient = AzureDevOpsClient;
/**
 * Creates an Azure DevOps client instance
 * @param organization The Azure DevOps organization name
 * @param accessToken The access token for authentication
 * @returns AzureDevOpsClient instance
 */
function createAzureDevOpsClient(organization, accessToken) {
    return new AzureDevOpsClient(organization, accessToken);
}
//# sourceMappingURL=azure-devops.js.map