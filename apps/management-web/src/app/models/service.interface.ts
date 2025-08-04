export interface Service {
  service_id: string;
  category_id: string;
  service_name: string;
  service_description: {
    what?: string | null;
    why?: string | null;
    who?: string | null;
    how?: string | null;
  } | null;
  service_cost?: number | null | undefined;
  service_price?: number | null | undefined;
  duration_minutes?: number | null | undefined;
  is_active?: boolean | undefined;
  image_link?: string | null | undefined;
  excerpt?: string | null | undefined;
  category_name?: string; // Added from JOIN query for display purposes
  created_at?: string | undefined;
  updated_at?: string | undefined;
}
