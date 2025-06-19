import * as core from "@actions/core";
import fetch from "node-fetch";
import { ManagedIdentityToken } from "./types";

/**
 * Azure Instance Metadata Service endpoint for Managed Identity
 */
const IMDS_ENDPOINT = "http://169.254.169.254/metadata/identity/oauth2/token";

/**
 * Azure DevOps resource identifier for token requests
 */
const AZURE_DEVOPS_RESOURCE = "https://app.vssps.visualstudio.com/";

/**
 * Maximum number of retry attempts for token acquisition
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry delay in milliseconds
 */
const RETRY_DELAY_MS = 1000;

/**
 * Gets an access token using Azure Managed Identity
 * @returns Promise<string> The access token
 * @throws Error if token acquisition fails
 */
export async function getManagedIdentityToken(): Promise<string> {
  core.debug("Attempting to acquire Managed Identity token...");

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      core.debug(`Token acquisition attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);

      const url = new URL(IMDS_ENDPOINT);
      url.searchParams.append("api-version", "2018-02-01");
      url.searchParams.append("resource", AZURE_DEVOPS_RESOURCE);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Metadata: "true",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `IMDS request failed with status ${response.status}: ${errorText}`
          );
        }

        const tokenData = (await response.json()) as ManagedIdentityToken;

        if (!tokenData.access_token) {
          throw new Error("No access token received from IMDS");
        }

        core.debug("Successfully acquired Managed Identity token");
        return tokenData.access_token;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      core.warning(
        `Token acquisition attempt ${attempt} failed: ${lastError.message}`
      );

      if (attempt < MAX_RETRY_ATTEMPTS) {
        core.debug(`Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  const errorMessage = `Failed to acquire Managed Identity token after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${
    lastError?.message || "Unknown error"
  }`;
  core.error(errorMessage);
  throw new Error(errorMessage);
}

/**
 * Validates that the current environment supports Managed Identity
 * @returns Promise<boolean> True if Managed Identity is available
 */
export async function validateManagedIdentityAvailability(): Promise<boolean> {
  try {
    core.debug("Validating Managed Identity availability...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        "http://169.254.169.254/metadata/instance?api-version=2021-02-01",
        {
          method: "GET",
          headers: {
            Metadata: "true",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const isAvailable = response.ok;
      core.debug(`Managed Identity availability: ${isAvailable}`);
      return isAvailable;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    core.debug(
      `Managed Identity not available: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
}
