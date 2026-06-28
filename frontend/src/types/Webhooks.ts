export interface WebhookDeliveryLog {
  id: number;
  webhookEndpointId: number;
  event: string;
  payload: string; // JSON string resolved from backend
  statusCode?: number;
  responseBody?: string;
  durationMs: number;
  success: boolean;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: number;
  workspaceId: number;
  url: string;
  name: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deliveryLogs?: WebhookDeliveryLog[];
}
