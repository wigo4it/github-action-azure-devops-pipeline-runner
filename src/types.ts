/**
 * Type definitions for Azure DevOps API and Managed Identity
 */

export interface ManagedIdentityToken {
  access_token: string;
  expires_in: string;
  expires_on: string;
  not_before: string;
  resource: string;
  token_type: string;
}

export interface AzureDevOpsError {
  $id: string;
  innerException?: unknown;
  message: string;
  typeName: string;
  typeKey: string;
  errorCode: number;
  eventId: number;
}

export interface PipelineReference {
  folder?: string;
  id: number;
  name: string;
  revision: number;
  url: string;
}

export interface RunPipelineParameters {
  previewRun?: boolean;
  resources?: RunResourcesParameters;
  stagesToSkip?: string[];
  templateParameters?: Record<string, unknown>;
  variables?: Record<string, Variable>;
  yamlOverride?: string;
}

export interface RunResourcesParameters {
  repositories?: Record<string, RepositoryResourceParameters>;
  builds?: Record<string, BuildResourceParameters>;
  containers?: Record<string, ContainerResourceParameters>;
  packages?: Record<string, PackageResourceParameters>;
  pipelines?: Record<string, PipelineResourceParameters>;
}

export interface RepositoryResourceParameters {
  refName?: string;
  version?: string;
  token?: string;
  tokenType?: string;
}

export interface BuildResourceParameters {
  version?: string;
}

export interface ContainerResourceParameters {
  version?: string;
}

export interface PackageResourceParameters {
  version?: string;
}

export interface PipelineResourceParameters {
  version?: string;
  runId?: number;
}

export interface Variable {
  isSecret?: boolean;
  value: string;
}

export interface PipelineRun {
  _links?: {
    self?: { href: string };
    web?: { href: string };
  };
  createdDate: string;
  finalYaml?: string;
  finishedDate?: string;
  id: number;
  name: string;
  pipeline: PipelineReference;
  resources?: unknown;
  result?: "succeeded" | "failed" | "canceled" | "unknown";
  state: "unknown" | "inProgress" | "canceling" | "completed";
  templateParameters?: Record<string, unknown>;
  url: string;
  variables?: Record<string, Variable>;
}

export interface ActionInputs {
  organization: string;
  project: string;
  pipelineId: string;
  pipelineParameters: Record<string, unknown>;
  pipelineVariables: Record<string, Variable>;
  branch?: string;
  previewRun: boolean;
}
