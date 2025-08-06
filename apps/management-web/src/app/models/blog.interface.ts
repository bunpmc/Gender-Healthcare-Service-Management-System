// Re-export BlogPost from database.interface.ts for consistency  
export type { BlogPost } from './database.interface';

// Define BlogStatus enum for backward compatibility
export const BlogStatus = {
  DRAFT: 'draft' as const,
  PUBLISHED: 'published' as const,
  ARCHIVED: 'archived' as const
} as const;

export type BlogStatus = typeof BlogStatus[keyof typeof BlogStatus];

// Keep legacy interface for backward compatibility if needed
export interface LegacyBlogPost {
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
