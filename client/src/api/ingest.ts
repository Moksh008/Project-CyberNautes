import { apiFetch } from './client';

export interface SoftwareInput {
  name: string;
  version: string;
}

export interface AssetInput {
  id: string;
  name: string;
  type: string;
  os?: string;
  internet_facing: boolean;
  software: SoftwareInput[];
}

export interface ConnectionInput {
  source: string;
  target: string;
  protocol?: string;
  port?: number;
}

export interface InfrastructurePayload {
  name: string;
  assets: AssetInput[];
  connections: ConnectionInput[];
}

export interface IngestResponse {
  message: string;
  twin_id: string;
}

export function ingestInfrastructure(payload: InfrastructurePayload): Promise<IngestResponse> {
  return apiFetch<IngestResponse>('/api/ingest/repo', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
