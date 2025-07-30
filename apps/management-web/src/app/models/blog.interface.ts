export interface BlogPost {
  blog_id: string;
  doctor_id: string;
  blog_title: string;
  blog_content: string;
  excerpt?: string;
  image_link?: string;
  blog_tags?: any;
  published_at?: string;
  blog_status: BlogStatus;
  view_count: number;
  created_at?: string;
  updated_at?: string;
  // Additional properties added by service methods
  doctor_name?: string;
  staff_members?: {
    full_name: string;
  };
}

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface BlogTag {
  id: string;
  name: string;
  color?: string;
}

export interface CreateBlogPostRequest {
  blog_title: string;
  blog_content: string;
  excerpt?: string;
  image_link?: string;
  blog_tags?: any;
  blog_status: BlogStatus;
}

export interface UpdateBlogPostRequest extends CreateBlogPostRequest {
  blog_id: string;
}
