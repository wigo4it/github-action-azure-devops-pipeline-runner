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
exports.getManagedIdentityToken = getManagedIdentityToken;
exports.validateManagedIdentityAvailability = validateManagedIdentityAvailability;
const core = __importStar(require("@actions/core"));
const node_fetch_1 = __importDefault(require("node-fetch"));
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
async function getManagedIdentityToken() {
    core.debug("Attempting to acquire Managed Identity token...");
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
            core.debug(`Token acquisition attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
            const url = new URL(IMDS_ENDPOINT);
            url.searchParams.append("api-version", "2018-02-01");
            url.searchParams.append("resource", AZURE_DEVOPS_RESOURCE);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            try {
                const response = await (0, node_fetch_1.default)(url.toString(), {
                    method: "GET",
                    headers: {
                        Metadata: "true",
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`IMDS request failed with status ${response.status}: ${errorText}`);
                }
                const tokenData = (await response.json());
                if (!tokenData.access_token) {
                    throw new Error("No access token received from IMDS");
                }
                core.debug("Successfully acquired Managed Identity token");
                return tokenData.access_token;
            }
            catch (fetchError) {
                clearTimeout(timeoutId);
                throw fetchError;
            }
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            core.warning(`Token acquisition attempt ${attempt} failed: ${lastError.message}`);
            if (attempt < MAX_RETRY_ATTEMPTS) {
                core.debug(`Retrying in ${RETRY_DELAY_MS}ms...`);
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }
    const errorMessage = `Failed to acquire Managed Identity token after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message || "Unknown error"}`;
    core.error(errorMessage);
    throw new Error(errorMessage);
}
/**
 * Validates that the current environment supports Managed Identity
 * @returns Promise<boolean> True if Managed Identity is available
 */
async function validateManagedIdentityAvailability() {
    try {
        core.debug("Validating Managed Identity availability...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        try {
            const response = await (0, node_fetch_1.default)("http://169.254.169.254/metadata/instance?api-version=2021-02-01", {
                method: "GET",
                headers: {
                    Metadata: "true",
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const isAvailable = response.ok;
            core.debug(`Managed Identity availability: ${isAvailable}`);
            return isAvailable;
        }
        catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
    }
    catch (error) {
        core.debug(`Managed Identity not available: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
}
//# sourceMappingURL=auth.js.map