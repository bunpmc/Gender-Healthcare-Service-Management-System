import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../supabase.service';
import { BlogPost } from '../../models/blog.interface';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Latest Blog Posts</h1>
      
      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error loading blog posts</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Blog Posts Grid -->
      <div *ngIf="!loading && !error" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article *ngFor="let post of blogPosts" class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <!-- Blog Image -->
          <div class="aspect-w-16 aspect-h-9">
            <img 
              *ngIf="post.image_link" 
              [src]="post.image_link" 
              [alt]="post.blog_title"
              class="w-full h-48 object-cover"
              (error)="onImageError($event)"
            >
            <div 
              *ngIf="!post.image_link" 
              class="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
            >
              <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
              </svg>
            </div>
          </div>

          <!-- Blog Content -->
          <div class="p-6">
            <!-- Blog Title -->
            <h2 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
              {{ post.blog_title }}
            </h2>

            <!-- Blog Excerpt -->
            <p class="text-gray-600 text-sm mb-4 line-clamp-3">
              {{ post.excerpt || getExcerpt(post.blog_content) }}
            </p>

            <!-- Blog Meta -->
            <div class="flex items-center justify-between text-sm text-gray-500">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span>{{ post.doctor_name || 'Unknown Doctor' }}</span>
              </div>
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span>{{ post.view_count || 0 }}</span>
                </div>
                <span>{{ formatDate(post.published_at) }}</span>
              </div>
            </div>

            <!-- Blog Tags -->
            <div *ngIf="post.blog_tags && getTagsArray(post.blog_tags).length > 0" class="mt-4">
              <div class="flex flex-wrap gap-2">
                <span 
                  *ngFor="let tag of getTagsArray(post.blog_tags).slice(0, 3)" 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {{ tag }}
                </span>
                <span 
                  *ngIf="getTagsArray(post.blog_tags).length > 3"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  +{{ getTagsArray(post.blog_tags).length - 3 }} more
                </span>
              </div>
            </div>

            <!-- Read More Button -->
            <div class="mt-4">
              <button 
                (click)="viewPost(post)"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Read More
                <svg class="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !error && blogPosts.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No blog posts</h3>
        <p class="mt-1 text-sm text-gray-500">No published blog posts are available at the moment.</p>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .aspect-w-16 {
      position: relative;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
    }
    
    .aspect-w-16 > * {
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    }
  `]
})
export class BlogListComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  loading = true;
  error: string | null = null;

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadBlogPosts();
  }

  async loadBlogPosts() {
    try {
      this.loading = true;
      this.error = null;

      // Get published blog posts (limit to 12 for performance)
      const result = await this.supabaseService.getPublishedBlogPosts(12);
      
      if (result.success && result.data) {
        this.blogPosts = result.data;
      } else {
        this.error = result.error || 'Failed to load blog posts';
      }
    } catch (error: any) {
      console.error('Error loading blog posts:', error);
      this.error = 'An unexpected error occurred while loading blog posts';
    } finally {
      this.loading = false;
    }
  }

  viewPost(post: BlogPost) {
    // This would typically navigate to a detailed blog post view
    // For now, we'll just log the post and increment view count
    console.log('Viewing blog post:', post.blog_title);
    
    // Increment view count
    this.supabaseService.getBlogPostById(post.blog_id, true).then(result => {
      if (result.success) {
        console.log('View count incremented for:', post.blog_title);
        // Update the local post data
        const index = this.blogPosts.findIndex(p => p.blog_id === post.blog_id);
        if (index !== -1 && result.data) {
          this.blogPosts[index] = result.data;
        }
      }
    });
  }

  onImageError(event: any) {
    // Hide broken images
    event.target.style.display = 'none';
  }

  getExcerpt(content: string): string {
    // Remove HTML tags and get first 150 characters
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  }

  getTagsArray(tags: any): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags);
      } catch {
        return tags.split(',').map(t => t.trim()).filter(t => t);
      }
    }
    return [];
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
