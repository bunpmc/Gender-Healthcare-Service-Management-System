/**
 * Transaction Interface
 * Represents a transaction record from the transactions table
 */

export interface Transaction {
    id: string;
    order_id: string;
    amount: number;
    order_info: string;
    services: any[] | null; // JSONB field for services
    status: TransactionStatus;
    created_at: string;
    vnpay_response: any | null; // JSONB field for VNPay response
    updated_at: string | null;
    patient_id: string | null;

    // Additional computed fields for UI display
    patient_name?: string;
    patient_email?: string;
    patient_phone?: string;
    formatted_amount?: string;
    payment_method?: string;
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export interface TransactionService {
    service_id: string;
    service_name: string;
    service_price: number;
    quantity: number;
    category?: string;
}

/**
 * Transaction summary for display
 */
export interface TransactionSummary {
    total_transactions: number;
    total_amount: number;
    completed_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    today_transactions: number;
    today_amount: number;
}
