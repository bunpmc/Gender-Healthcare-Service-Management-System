export interface Receipt {
  receipt_id: string;
  patient_id: string;
  amount?: number;
  created_at?: string;
  services?: any;
  status: ReceiptStatus;
  // Additional fields for display
  patient_name?: string;
  service_details?: ServiceDetail[];
}

export interface ServiceDetail {
  service_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export enum ReceiptStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export interface CreateReceiptRequest {
  patient_id: string;
  amount: number;
  services: any;
  status?: ReceiptStatus;
}

export interface UpdateReceiptRequest {
  receipt_id: string;
  status: ReceiptStatus;
}
