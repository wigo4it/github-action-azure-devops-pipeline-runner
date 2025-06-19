import * as core from "@actions/core";
import { getActionInputs } from "./main";

// Mock @actions/core
jest.mock("@actions/core");

const mockCore = core as jest.Mocked<typeof core>;

describe("Main Module Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
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
    
    mockCore.getBooleanInput.mockReturnValue(false);
  });

  describe("getActionInputs", () => {
    it("should parse valid inputs correctly", () => {
      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs).toEqual({
        organization: "test-org",
        project: "test-project",
        pipelineId: "123",
        pipelineParameters: {},
        pipelineVariables: {},
        previewRun: false,
        branch: undefined
      });
    });

    it("should validate organization name format", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "invalid-org-name-";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        return "{}";
      });

      // Act & Assert
      expect(() => getActionInputs()).toThrow(
        "Invalid organization name"
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
      expect(() => getActionInputs()).toThrow(
        "Pipeline ID must be a numeric value"
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
      expect(() => getActionInputs()).toThrow(
        "Invalid pipeline-parameters JSON"
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
      expect(() => getActionInputs()).toThrow(
        "Invalid pipeline-variables JSON"
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
      const inputs = getActionInputs();

      // Assert
      expect(inputs.pipelineVariables).toEqual({
        env: { value: "prod", isSecret: false },
        debug: { value: "true", isSecret: false }
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
      const inputs = getActionInputs();

      // Assert
      expect(inputs.branch).toBe("refs/heads/feature/new-feature");
    });

    it("should handle preview run setting", () => {
      // Arrange
      mockCore.getBooleanInput.mockImplementation((name: string) => {
        return name === "preview-run";
      });

      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs.previewRun).toBe(true);
    });

    it("should parse complex pipeline parameters", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "test-org";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        if (name === "pipeline-parameters") return '{"environment": "production", "version": "1.0.0", "deployAll": true}';
        if (name === "pipeline-variables") return "{}";
        return "";
      });

      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs.pipelineParameters).toEqual({
        environment: "production",
        version: "1.0.0",
        deployAll: true
      });
    });

    it("should handle mixed variable formats", () => {
      // Arrange
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === "azure-devops-organization") return "test-org";
        if (name === "azure-devops-project") return "test-project";
        if (name === "pipeline-id") return "123";
        if (name === "pipeline-parameters") return "{}";
        if (name === "pipeline-variables") return JSON.stringify({
          simpleVar: "value1",
          secretVar: { value: "secret123", isSecret: true },
          normalVar: { value: "normal", isSecret: false }
        });
        return "";
      });

      // Act
      const inputs = getActionInputs();

      // Assert
      expect(inputs.pipelineVariables).toEqual({
        simpleVar: { value: "value1", isSecret: false },
        secretVar: { value: "secret123", isSecret: true },
        normalVar: { value: "normal", isSecret: false }
      });
    });
  });
});