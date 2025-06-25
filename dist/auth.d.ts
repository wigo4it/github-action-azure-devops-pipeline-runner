/**
 * Gets an access token using Azure Managed Identity
 * @returns Promise<string> The access token
 * @throws Error if token acquisition fails
 */
export declare function getManagedIdentityToken(): Promise<string>;
/**
 * Validates that the current environment supports Managed Identity
 * @returns Promise<boolean> True if Managed Identity is available
 */
export declare function validateManagedIdentityAvailability(): Promise<boolean>;
