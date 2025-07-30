export interface ServiceDetail {
  service_id: string;
  service_name: string;
  description: {
    what: string;
    why: string;
    who: string;
    how: string;
  };
  price: number;
  duration: number;
  image_link: string;
}
export interface MedicalService {
  id: string;
  name: string;
  excerpt: string | null;
  price: number;
  image_link: string | null;
  service_categories: {
    category_id: string;
    category_name: string;
  };
}
