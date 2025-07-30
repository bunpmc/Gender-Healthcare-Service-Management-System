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
  service_cost: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  image_link: string | null;
  excerpt: string | null;
  category_name?: string; // Added from JOIN query for display purposes
}
