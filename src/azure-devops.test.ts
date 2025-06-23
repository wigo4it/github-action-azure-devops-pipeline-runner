import * as core from "@actions/core";
import fetch from "node-fetch";
import { AzureDevOpsClient, createAzureDevOpsClient } from "./azure-devops";
import { ActionInputs, PipelineRun, AzureDevOpsError } from "./types";

// Mock dependencies
jest.mock("@actions/core");
jest.mock("node-fetch");

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockCore = core as jest.Mocked<typeof core>;

// Mock Response class for testing
class MockResponse {
  constructor(
    private body: string | object,
    private status: number = 200,
    private statusText: string = "OK",
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

describe("Azure DevOps Client", () => {
  const organization = "test-org";
  const accessToken = "test-token-12345";
  const project = "test-project";
  const pipelineId = "123";

  let client: AzureDevOpsClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new AzureDevOpsClient(organization, accessToken);
  });

  describe("createAzureDevOpsClient", () => {
    it("should create a new client instance", () => {
      const newClient = createAzureDevOpsClient(organization, accessToken);
      expect(newClient).toBeInstanceOf(AzureDevOpsClient);
    });
  });

  describe("runPipeline", () => {
    const mockPipelineRun: PipelineRun = {
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
    };

    const basicInputs: ActionInputs = {
      organization,
      project,
      pipelineId,
      pipelineParameters: {},
      pipelineVariables: {},
      previewRun: false,
    };

    it("should successfully run a pipeline with basic parameters", async () => {
      // Arrange
      const mockResponse = new MockResponse(mockPipelineRun, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const result = await client.runPipeline(basicInputs);

      // Assert
      expect(result).toEqual(mockPipelineRun);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://dev.azure.com/${organization}/${project}/_apis/pipelines/${pipelineId}/runs?api-version=7.2-preview.1`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            previewRun: false,
            templateParameters: {},
            variables: {},
          }),
        },
      );
      expect(mockCore.info).toHaveBeenCalledWith(
        "Successfully started pipeline run with ID: 456",
      );
    });

    it("should run a pipeline with parameters and variables", async () => {
      // Arrange
      const inputsWithParams: ActionInputs = {
        ...basicInputs,
        pipelineParameters: { environment: "production", version: "1.0.0" },
        pipelineVariables: {
          deploymentTarget: { value: "prod", isSecret: false },
          apiKey: { value: "secret-key", isSecret: true },
        },
      };

      const mockResponse = new MockResponse(mockPipelineRun, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const result = await client.runPipeline(inputsWithParams);

      // Assert
      expect(result).toEqual(mockPipelineRun);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            previewRun: false,
            templateParameters: { environment: "production", version: "1.0.0" },
            variables: {
              deploymentTarget: { value: "prod", isSecret: false },
              apiKey: { value: "secret-key", isSecret: true },
            },
          }),
        }),
      );
    });

    it("should run a pipeline with branch specification", async () => {
      // Arrange
      const inputsWithBranch: ActionInputs = {
        ...basicInputs,
        branch: "refs/heads/feature/new-feature",
      };

      const mockResponse = new MockResponse(mockPipelineRun, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const result = await client.runPipeline(inputsWithBranch);
      console.log(result);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            previewRun: false,
            templateParameters: {},
            variables: {},
            resources: {
              repositories: {
                self: {
                  refName: "refs/heads/feature/new-feature",
                },
              },
            },
          }),
        }),
      );
    });

    it("should handle preview run", async () => {
      // Arrange
      const previewInputs: ActionInputs = {
        ...basicInputs,
        previewRun: true,
      };

      const mockResponse = new MockResponse(mockPipelineRun, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const result = await client.runPipeline(previewInputs);
      console.log(result);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            previewRun: true,
            templateParameters: {},
            variables: {},
          }),
        }),
      );
      expect(mockCore.info).toHaveBeenCalledWith(
        "Successfully previewed pipeline run with ID: 456",
      );
    });

    it("should handle HTTP error responses", async () => {
      // Arrange
      const errorResponse: AzureDevOpsError = {
        $id: "1",
        message: "Pipeline not found",
        typeName: "Microsoft.TeamFoundation.Core.WebApi.PipelineNotFoundException",
        typeKey: "PipelineNotFoundException",
        errorCode: 404,
        eventId: 3000,
      };
      const mockResponse = new MockResponse(errorResponse, 404, "Not Found");
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act & Assert
      await expect(client.runPipeline(basicInputs)).rejects.toThrow(
        "Failed to run pipeline: Azure DevOps API request failed with status 404: Pipeline not found",
      );
      expect(mockCore.error).toHaveBeenCalledWith(
        "Azure DevOps API request failed with status 404: Pipeline not found",
      );
    });

    it("should handle HTTP error responses with plain text", async () => {
      // Arrange
      const mockResponse = new MockResponse("Unauthorized access", 401, "Unauthorized");
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act & Assert
      await expect(client.runPipeline(basicInputs)).rejects.toThrow(
        "Failed to run pipeline: Azure DevOps API request failed with status 401: Unauthorized access",
      );
    });

    it("should handle network errors", async () => {
      // Arrange
      const networkError = new Error("Network connection failed");
      mockFetch.mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(client.runPipeline(basicInputs)).rejects.toThrow(
        "Failed to run pipeline: Network connection failed",
      );
      expect(mockCore.error).toHaveBeenCalledWith(
        "Failed to run pipeline: Network connection failed",
      );
    });

    it("should handle malformed JSON response", async () => {
      // Arrange
      const mockResponse = new MockResponse("{ invalid json", 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act & Assert
      await expect(client.runPipeline(basicInputs)).rejects.toThrow(
        "Failed to run pipeline:",
      );
    });
  });

  describe("getPipelineRun", () => {
    const runId = 456;
    const mockPipelineRun: PipelineRun = {
      id: runId,
      name: "Test Pipeline Run",
      state: "completed",
      result: "succeeded",
      createdDate: "2023-12-01T10:00:00Z",
      finishedDate: "2023-12-01T10:30:00Z",
      pipeline: {
        id: 123,
        name: "Test Pipeline",
        revision: 1,
        url: "https://dev.azure.com/test-org/test-project/_apis/pipelines/123",
        folder: "",
      },
      url: "https://dev.azure.com/test-org/test-project/_apis/pipelines/123/runs/456",
    };

    it("should successfully get pipeline run details", async () => {
      // Arrange
      const mockResponse = new MockResponse(mockPipelineRun, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const result = await client.getPipelineRun(project, pipelineId, runId);

      // Assert
      expect(result).toEqual(mockPipelineRun);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://dev.azure.com/${organization}/${project}/_apis/pipelines/${pipelineId}/runs/${runId}?api-version=7.2-preview.1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        },
      );
    });

    it("should handle error when getting pipeline run", async () => {
      // Arrange
      const mockResponse = new MockResponse("Run not found", 404, "Not Found");
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act & Assert
      await expect(client.getPipelineRun(project, pipelineId, runId)).rejects.toThrow(
        "Failed to get pipeline run: Failed to get pipeline run: 404 Not Found",
      );
      expect(mockCore.error).toHaveBeenCalledWith(
        "Failed to get pipeline run: Failed to get pipeline run: 404 Not Found",
      );
    });

    it("should handle network errors when getting pipeline run", async () => {
      // Arrange
      const networkError = new Error("Connection timeout");
      mockFetch.mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(client.getPipelineRun(project, pipelineId, runId)).rejects.toThrow(
        "Failed to get pipeline run: Connection timeout",
      );
    });
  });

  describe("validatePipelineAccess", () => {
    it("should return true when pipeline is accessible", async () => {
      // Arrange
      const mockPipeline = {
        id: 123,
        name: "Test Pipeline",
        folder: "",
        revision: 1,
      };
      const mockResponse = new MockResponse(mockPipeline, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const hasAccess = await client.validatePipelineAccess(project, pipelineId);

      // Assert
      expect(hasAccess).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://dev.azure.com/${organization}/${project}/_apis/pipelines/${pipelineId}?api-version=7.2-preview.1`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        },
      );
    });

    it("should return false when pipeline is not accessible", async () => {
      // Arrange
      const mockResponse = new MockResponse("Not found", 404, "Not Found");
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const hasAccess = await client.validatePipelineAccess(project, pipelineId);

      // Assert
      expect(hasAccess).toBe(false);
    });

    it("should return false when network error occurs", async () => {
      // Arrange
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      // Act
      const hasAccess = await client.validatePipelineAccess(project, pipelineId);

      // Assert
      expect(hasAccess).toBe(false);
      expect(mockCore.debug).toHaveBeenCalledWith(
        "Pipeline validation failed: Network error",
      );
    });

    it("should return false for authorization errors", async () => {
      // Arrange
      const mockResponse = new MockResponse("Unauthorized", 401, "Unauthorized");
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const hasAccess = await client.validatePipelineAccess(project, pipelineId);

      // Assert
      expect(hasAccess).toBe(false);
    });

    it("should return false for forbidden access", async () => {
      // Arrange
      const mockResponse = new MockResponse("Forbidden", 403, "Forbidden");
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const hasAccess = await client.validatePipelineAccess(project, pipelineId);

      // Assert
      expect(hasAccess).toBe(false);
    });
  });
});
