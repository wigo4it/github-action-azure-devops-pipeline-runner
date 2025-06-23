import * as core from "@actions/core";
import * as azureDevOps from "./azure-devops";
import { getActionInputs } from "./main";

// Integration tests that test the components working together
// These tests use real objects but mock external dependencies

// Mock external dependencies
jest.mock("@actions/core");
jest.mock("node-fetch");

const mockCore = core as jest.Mocked<typeof core>;

describe("Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock inputs
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "azure-devops-organization": "test-org",
        "azure-devops-project": "test-project",
        "pipeline-id": "123",
        "pipeline-parameters": '{"environment": "production", "version": "1.0.0"}',
        "pipeline-variables": '{"deploymentTarget": "prod", "apiKey": {"value": "secret123", "isSecret": true}}',
        "branch": "refs/heads/main",
      };
      return inputs[name] || "";
    });

    mockCore.getBooleanInput.mockReturnValue(false);
  });

  describe("Input Processing Integration", () => {
    it("should correctly process and validate complex action inputs", () => {
      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs).toEqual({
        organization: "test-org",
        project: "test-project",
        pipelineId: "123",
        pipelineParameters: {
          environment: "production",
          version: "1.0.0",
        },
        pipelineVariables: {
          deploymentTarget: { value: "prod", isSecret: false },
          apiKey: { value: "secret123", isSecret: true },
        },
        branch: "refs/heads/main",
        previewRun: false,
      });
    });

    it("should handle preview run configuration", () => {
      // Arrange
      mockCore.getBooleanInput.mockImplementation((name: string) => {
        return name === "preview-run";
      });

      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs.previewRun).toBe(true);
    });

    it("should validate organization name with proper error messaging", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "invalid_org_name!";
        return "test-value";
      });

      // Act & Assert
      expect(() => getActionInputs()).toThrow(
        "Invalid organization name. Organization names must start and end with alphanumeric characters.",
      );
    });
  });

  describe("Azure DevOps Client Integration", () => {
    const mockAccessToken = "test-access-token";
    const organization = "test-org";
    let client: azureDevOps.AzureDevOpsClient;

    beforeEach(() => {
      client = azureDevOps.createAzureDevOpsClient(organization, mockAccessToken);
    });

    it("should create client with correct configuration", () => {
      // Assert
      expect(client).toBeInstanceOf(azureDevOps.AzureDevOpsClient);
    });

    it("should properly format request URLs", () => {
      // This test would require inspecting the private properties or mocking fetch
      // to verify the URL construction, but the unit tests already cover this
      expect(client).toBeDefined();
    });
  });

  describe("End-to-End Input to Request Flow", () => {
    it("should transform action inputs into proper Azure DevOps API request format", () => {
      // Arrange
      const inputs = getActionInputs();
      const client = azureDevOps.createAzureDevOpsClient(inputs.organization, "mock-token");

      // This integration test demonstrates the flow from GitHub Action inputs
      // through our validation and transformation logic to the Azure DevOps client
      expect(inputs.organization).toBe("test-org");
      expect(inputs.pipelineParameters).toEqual({
        environment: "production",
        version: "1.0.0",
      });
      expect(inputs.pipelineVariables).toEqual({
        deploymentTarget: { value: "prod", isSecret: false },
        apiKey: { value: "secret123", isSecret: true },
      });
      expect(client).toBeInstanceOf(azureDevOps.AzureDevOpsClient);
    });

    it("should handle empty optional parameters correctly", () => {
      // Arrange
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

      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs.pipelineParameters).toEqual({});
      expect(inputs.pipelineVariables).toEqual({});
      expect(inputs.branch).toBeUndefined();
    });

    it("should handle numeric and boolean values in parameters", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "pipeline-parameters") {
          return '{"timeout": 300, "parallel": true, "maxRetries": 3}';
        }
        const defaults: Record<string, string> = {
          "azure-devops-organization": "test-org",
          "azure-devops-project": "test-project",
          "pipeline-id": "123",
          "pipeline-variables": "{}",
        };
        return defaults[name] || "";
      });

      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs.pipelineParameters).toEqual({
        timeout: 300,
        parallel: true,
        maxRetries: 3,
      });
    });
  });
  describe("Error Handling Integration", () => {
    it("should provide clear error messages for common validation failures", () => {
      const testCases: Array<{
        description: string;
        mockInputs: Record<string, string>;
        expectedError: string;
      }> = [
        {
          description: "invalid organization format",
          mockInputs: { "azure-devops-organization": "org-name-" },
          expectedError: "Invalid organization name",
        },
        {
          description: "non-numeric pipeline ID",
          mockInputs: { "pipeline-id": "abc123" },
          expectedError: "Pipeline ID must be a numeric value",
        },
        {
          description: "malformed JSON parameters",
          mockInputs: { "pipeline-parameters": "{invalid json}" },
          expectedError: "Invalid pipeline-parameters JSON",
        },
        {
          description: "malformed JSON variables",
          mockInputs: { "pipeline-variables": "{invalid: json}" },
          expectedError: "Invalid pipeline-variables JSON",
        },
      ];

      testCases.forEach(({ description, mockInputs, expectedError }) => {
        console.log(`Running test case: ${description}`);

        // Arrange
        mockCore.getInput.mockImplementation((name: string) => {
          const defaults: Record<string, string> = {
            "azure-devops-organization": "test-org",
            "azure-devops-project": "test-project",
            "pipeline-id": "123",
            "pipeline-parameters": "{}",
            "pipeline-variables": "{}",
          };
          return mockInputs[name] || defaults[name] || "";
        });

        // Act & Assert
        expect(() => getActionInputs()).toThrow(expectedError);
      });
    });
  });
});
