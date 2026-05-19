export interface LeadRequest {
  name: string;
  phone: string;
  city: string;
  description: string;
  serviceId: number;
}

export interface LeadAssignmentResponse {
  providerId: number;
  providerName: string;
  isMandatory: boolean;
}

export interface LeadSuccessResponse {
  success: true;
  data: {
    leadId: number;
    name: string;
    phone: string;
    city: string;
    description: string;
    serviceId: number;
    assignments: LeadAssignmentResponse[];
  };
}

export interface ApiErrorResponse {
  success: false;
  code: "DUPLICATE_LEAD_SUBMISSION" | "INSUFFICIENT_PROVIDERS" | "VALIDATION_ERROR" | "INTERNAL_SERVER_ERROR" | "PROVIDER_NOT_FOUND" | "ALREADY_PROCESSED";
  message: string;
}

export interface WebhookRequest {
  eventId: string;
  providerId: number;
  action: "RESET_QUOTA";
  newQuota?: number;
}
