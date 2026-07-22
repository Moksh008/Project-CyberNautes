import { apiFetch } from './client';

export interface BoxSummary {
  box_id: string;
  name: string;
  description: string;
  cve_id: string;
  hint: string;
}

export interface BoxInstance {
  instance_id: string;
  box_id: string;
  box_name: string;
  status: string;
  host: string;
  port: number | null;
  connection: string | null;
  hint: string;
}

export function listBoxes(): Promise<BoxSummary[]> {
  return apiFetch<BoxSummary[]>('/api/labs/boxes');
}

export function listInstances(): Promise<BoxInstance[]> {
  return apiFetch<BoxInstance[]>('/api/labs/instances');
}

export function deployBox(box_id: string): Promise<BoxInstance> {
  return apiFetch<BoxInstance>('/api/labs/deploy', {
    method: 'POST',
    body: JSON.stringify({ box_id }),
  });
}

export function destroyInstance(instance_id: string): Promise<{ instance_id: string; status: string }> {
  return apiFetch<{ instance_id: string; status: string }>('/api/labs/destroy', {
    method: 'POST',
    body: JSON.stringify({ instance_id }),
  });
}
