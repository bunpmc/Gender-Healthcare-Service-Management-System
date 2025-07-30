import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core'; // <-- Thêm dòng này!

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SplideComponent } from '../../components/splide/splide.component';
import { BlogService } from '../../services/blog.service';
import { Blog, BlogDisplay } from '../../models/blog.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    SplideComponent,
    RouterLink,
    TranslateModule, // <-- Thêm vào đây!
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent implements OnInit {
  private blogService = inject(BlogService);

  latestBlogs: BlogDisplay[] = [];
  isLoadingBlogs = false;
  blogError: string | null = null;

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadLatestBlogs();
  }

  loadLatestBlogs() {
    this.isLoadingBlogs = true;
    this.blogError = null;

    this.blogService.getBlogs().subscribe({
      next: (blogs: Blog[]) => {
        this.latestBlogs = blogs
          .map((blog) => this.mapBlogToDisplay(blog))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 2);

        this.isLoadingBlogs = false;
      },
      error: (error) => {
        console.error('Error loading latest blogs:', error);
        this.blogError = 'BLOG.LOAD_ERROR'; // Key dùng để translate trong template!
        this.isLoadingBlogs = false;
      },
    });
  }

  private mapBlogToDisplay(blog: Blog): BlogDisplay {
    const tagsArray = this.extractTags(blog.blog_tags);

    return {
      id: blog.blog_id,
      title: blog.blog_title,
      desc: this.truncateDescription(blog.excerpt, 150),
      img: blog.image_link || '',
      author: blog.doctor_details.full_name,
      createdAt: blog.created_at,
      tags: tagsArray,
      category: this.getCategoryFromTags(tagsArray),
    };
  }

  private extractTags(blogTags: any): string[] {
    if (!blogTags) return [];
    if (Array.isArray(blogTags.tags)) return blogTags.tags;
    if (Array.isArray(blogTags)) return blogTags;
    if (typeof blogTags === 'string')
      return blogTags.split(',').map((tag) => tag.trim());
    if (typeof blogTags.tags === 'string')
      return blogTags.tags.split(',').map((tag: string) => tag.trim());
    return [];
  }

  private getCategoryFromTags(tags: string[]): string {
    if (!Array.isArray(tags) || tags.length === 0) {
      return 'Community';
    }
    const tagMap: { [key: string]: string } = {
      transgender: 'Gender Stories',
      'hormone therapy': 'Gender Stories',
      'mental health': 'Mental Health',
      community: 'Community',
      legal: 'Legal',
      education: 'Education',
    };
    for (const tag of tags) {
      if (typeof tag === 'string') {
        const category = tagMap[tag.toLowerCase()];
        if (category) return category;
      }
    }
    return 'Community';
  }

  private truncateDescription(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}
