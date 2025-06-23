import * as core from "@actions/core";
import fetch from "node-fetch";
import { getManagedIdentityToken, validateManagedIdentityAvailability } from "./auth";
import { ManagedIdentityToken } from "./types";

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

describe("Authentication Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getManagedIdentityToken", () => {
    const mockTokenResponse: ManagedIdentityToken = {
      access_token: "test-access-token-12345",
      expires_in: "3599",
      expires_on: "1640995200",
      not_before: "1640991600",
      resource: "https://app.vssps.visualstudio.com/",
      token_type: "Bearer",
    };

    it("should successfully acquire a token on first attempt", async () => {
      // Arrange
      const mockResponse = new MockResponse(mockTokenResponse, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const token = await getManagedIdentityToken();

      // Assert
      expect(token).toBe("test-access-token-12345");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fapp.vssps.visualstudio.com%2F",
        {
          method: "GET",
          headers: {
            Metadata: "true",
          },
          signal: expect.any(AbortSignal),
        },
      );
      expect(mockCore.debug).toHaveBeenCalledWith("Attempting to acquire Managed Identity token...");
      expect(mockCore.debug).toHaveBeenCalledWith("Successfully acquired Managed Identity token");
    });    it("should retry on network failure and succeed on second attempt", async () => {
      // Arrange
      const networkError = new Error("Network error");
      const mockResponse = new MockResponse(mockTokenResponse, 200);

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockResponse as any);

      // Act
      const token = await getManagedIdentityToken();

      // Assert
      expect(token).toBe("test-access-token-12345");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockCore.warning).toHaveBeenCalledWith(
        "Token acquisition attempt 1 failed: Network error",
      );
      expect(mockCore.debug).toHaveBeenCalledWith("Retrying in 1000ms...");
    });    it("should handle HTTP error response", async () => {
      // Arrange
      const errorResponse = new MockResponse("Unauthorized", 401, "Unauthorized");
      mockFetch.mockResolvedValue(errorResponse as any);

      // Act & Assert
      await expect(getManagedIdentityToken()).rejects.toThrow(
        "Failed to acquire Managed Identity token after 3 attempts",
      );
      expect(mockCore.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to acquire Managed Identity token after 3 attempts"),
      );
    });    it("should handle response without access token", async () => {
      // Arrange
      const invalidResponse = new MockResponse({ token_type: "Bearer" }, 200);
      mockFetch.mockResolvedValue(invalidResponse as any);

      // Act & Assert
      await expect(getManagedIdentityToken()).rejects.toThrow(
        "Failed to acquire Managed Identity token after 3 attempts",
      );
    });    it("should handle request timeout", async () => {
      // Arrange
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "AbortError";
      mockFetch.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(getManagedIdentityToken()).rejects.toThrow(
        "Failed to acquire Managed Identity token after 3 attempts",
      );
    });    it("should fail after maximum retry attempts", async () => {
      // Arrange
      const networkError = new Error("Persistent network error");
      mockFetch.mockRejectedValue(networkError);

      // Act & Assert
      await expect(getManagedIdentityToken()).rejects.toThrow(
        "Failed to acquire Managed Identity token after 3 attempts",
      );
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });    it("should handle malformed JSON response", async () => {
      // Arrange
      const malformedResponse = new MockResponse("{ invalid json", 200);
      mockFetch.mockResolvedValue(malformedResponse as any);

      // Act & Assert
      await expect(getManagedIdentityToken()).rejects.toThrow(
        "Failed to acquire Managed Identity token after 3 attempts",
      );
    });
  });

  describe("validateManagedIdentityAvailability", () => {
    it("should return true when IMDS is available", async () => {
      // Arrange
      const mockResponse = new MockResponse({ compute: { name: "test-vm" } }, 200);
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      // Act
      const isAvailable = await validateManagedIdentityAvailability();

      // Assert
      expect(isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://169.254.169.254/metadata/instance?api-version=2021-02-01",
        {
          method: "GET",
          headers: {
            Metadata: "true",
          },
          signal: expect.any(AbortSignal),
        },
      );
      expect(mockCore.debug).toHaveBeenCalledWith("Validating Managed Identity availability...");
      expect(mockCore.debug).toHaveBeenCalledWith("Managed Identity availability: true");
    });

    it("should return false when IMDS returns error", async () => {
      // Arrange
      const errorResponse = new MockResponse("Not found", 404, "Not Found");
      mockFetch.mockResolvedValueOnce(errorResponse as any);

      // Act
      const isAvailable = await validateManagedIdentityAvailability();

      // Assert
      expect(isAvailable).toBe(false);
      expect(mockCore.debug).toHaveBeenCalledWith("Managed Identity availability: false");
    });

    it("should return false when network request fails", async () => {
      // Arrange
      const networkError = new Error("Connection refused");
      mockFetch.mockRejectedValueOnce(networkError);

      // Act
      const isAvailable = await validateManagedIdentityAvailability();

      // Assert
      expect(isAvailable).toBe(false);
      expect(mockCore.debug).toHaveBeenCalledWith(
        "Managed Identity not available: Connection refused",
      );
    });

    it("should handle timeout gracefully", async () => {
      // Arrange
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "AbortError";
      mockFetch.mockRejectedValueOnce(timeoutError);

      // Act
      const isAvailable = await validateManagedIdentityAvailability();

      // Assert
      expect(isAvailable).toBe(false);
      expect(mockCore.debug).toHaveBeenCalledWith(
        "Managed Identity not available: Request timeout",
      );
    });

    it("should handle non-Error exceptions", async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce("String error");

      // Act
      const isAvailable = await validateManagedIdentityAvailability();

      // Assert
      expect(isAvailable).toBe(false);
      expect(mockCore.debug).toHaveBeenCalledWith(
        "Managed Identity not available: String error",
      );
    });
  });
});
