import * as core from "@actions/core";
import * as auth from "./auth";
import * as azureDevOps from "./azure-devops";
import {  PipelineRun } from "./types";

// Mock modules
jest.mock("@actions/core");
jest.mock("./auth");
jest.mock("./azure-devops");

const mockCore = core as jest.Mocked<typeof core>;
const mockAuth = auth as jest.Mocked<typeof auth>;
const mockAzureDevOps = azureDevOps as jest.Mocked<typeof azureDevOps>;

// Import the actual functions after setting up mocks
// We need to do this dynamically to ensure mocks are set up first
let mainModule: any;

describe("Main Module Functions", () => {
  // Mock pipeline run response
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
    },
  };

  // Mock Azure DevOps client
  const mockClient = {
    runPipeline: jest.fn(),
    validatePipelineAccess: jest.fn(),
    getPipelineRun: jest.fn(),
  };

  beforeAll(async () => {
    // Import the main module after mocks are set up
    mainModule = await import("./main");
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset all mocks to their default implementations
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "azure-devops-organization": "test-org",
        "azure-devops-project": "test-project",
        "pipeline-id": "123",
        "pipeline-parameters": "{}",
        "pipeline-variables": "{}",
        "branch": "",
      };
      return inputs[name] || "";
    });

    mockCore.getBooleanInput.mockImplementation((name: string) => {
      return name === "preview-run" ? false : false;
    });

    mockAuth.validateManagedIdentityAvailability.mockResolvedValue(true);
    mockAuth.getManagedIdentityToken.mockResolvedValue("test-token-12345");

    mockAzureDevOps.createAzureDevOpsClient.mockReturnValue(mockClient as any);
    mockClient.validatePipelineAccess.mockResolvedValue(true);
    mockClient.runPipeline.mockResolvedValue(mockPipelineRun);
  });

  describe("Input Validation", () => {
    it("should validate organization name format", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "invalid-org-name-";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        return "{}";
      });

      // Act & Assert
      expect(() => mainModule.getActionInputs()).toThrow(
        "Invalid organization name",
      );
    });

    it("should validate pipeline ID is numeric", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "test-org";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "invalid-id";
        return "{}";
      });

      // Act & Assert
      expect(() => mainModule.getActionInputs()).toThrow(
        "Pipeline ID must be a numeric value",
      );
    });

    it("should validate JSON parameters", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "test-org";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        if (name === "pipeline-parameters") return "{ invalid json";
        return "{}";
      });

      // Act & Assert
      expect(() => mainModule.getActionInputs()).toThrow(
        "Invalid pipeline-parameters JSON",
      );
    });

    it("should validate JSON variables", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "test-org";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        if (name === "pipeline-parameters") return "{}";
        if (name === "pipeline-variables") return "{ invalid json";
        return "{}";
      });

      // Act & Assert
      expect(() => mainModule.getActionInputs()).toThrow(
        "Invalid pipeline-variables JSON",
      );
    });

    it("should convert simple variables to Variable format", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "test-org";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        if (name === "pipeline-parameters") return "{}";
        if (name === "pipeline-variables") return '{"env": "prod", "debug": {"value": "true", "isSecret": false}}';
        return "";
      });

      // Act
      const inputs = mainModule.getActionInputs();

      // Assert
      expect(inputs.pipelineVariables).toEqual({
        env: { value: "prod", isSecret: false },
        debug: { value: "true", isSecret: false },
      });
    });

    it("should handle valid inputs", () => {
      // Act
      const inputs = mainModule.getActionInputs();

      // Assert
      expect(inputs).toEqual({
        organization: "test-org",
        project: "test-project",
        pipelineId: "123",
        pipelineParameters: {},
        pipelineVariables: {},
        previewRun: false,
        branch: undefined,
      });
    });

    it("should include branch when provided", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "test-org";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        if (name === "branch") return "refs/heads/feature/new-feature";
        if (name === "pipeline-parameters") return "{}";
        if (name === "pipeline-variables") return "{}";
        return "";
      });

      // Act
      const inputs = mainModule.getActionInputs();

      // Assert
      expect(inputs.branch).toBe("refs/heads/feature/new-feature");
    });

    it("should handle preview run setting", () => {
      // Arrange
      mockCore.getBooleanInput.mockImplementation((name: string) => {
        return name === "preview-run";
      });

      // Act
      const inputs = mainModule.getActionInputs();

      // Assert
      expect(inputs.previewRun).toBe(true);
    });
  });
});
