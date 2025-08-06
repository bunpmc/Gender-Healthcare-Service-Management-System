export interface Blog {
  blog_id: string;
  blog_title: string;
  excerpt: string;
  image_link?: string | null;
  blog_tags: string[];
  blog_status: string;
  created_at: string;
  updated_at: string;
  doctor_details: {
    full_name: string;
  };
}
export interface BlogDetail {
  blog_id: string;
  blog_title: string;
  blog_content: string;
  image_link?: string | null;
  blog_tags: string[] | string;
  blog_status: string;
  created_at: string;
  updated_at: string;
  doctor_details: {
    staff_id: string;
    full_name: string;
    image_link?: string | null;
  };
}
export interface BlogDisplay {
  id: string;
  title: string;
  desc: string;
  img: string;
  author: string;
  createdAt: string;
  tags: string[];
  category: string;
}
