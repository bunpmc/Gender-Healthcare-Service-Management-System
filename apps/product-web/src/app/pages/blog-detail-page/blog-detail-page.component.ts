import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BlogService } from '../../services/blog.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { BlogDetail } from '../../models/blog.model';
import { BreadcrumbsComponent } from '../../components/breadcrumbs/breadcrumbs.component';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    HeaderComponent,
    FooterComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './blog-detail-page.component.html',
  styleUrl: './blog-detail-page.component.css',
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogService);
  private router = inject(Router);
  private breadcrumbService = inject(BreadcrumbService);
  private translate = inject(TranslateService);

  blog: BlogDetail | null = null;
  isLoading = true;
  error: string | null = null;
  private blogId: string | null = null;
  
    supabasePublicUrl = environment.supabaseStorageUrl;

  ngOnInit() {
    this.blogId = this.route.snapshot.paramMap.get('id');
    console.log('Blog ID from route:', this.blogId); // Debug log

    if (!this.blogId) {
      this.error = 'Không tìm thấy blog!';
      this.isLoading = false;
      return;
    }

    this.blogService.getBlogById(this.blogId).subscribe({
      next: (data: any) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (!data.blog_content) {
          this.error = 'Blog không có nội dung!';
          this.isLoading = false;
          return;
        }
        this.blog = data as BlogDetail;
        console.log(this.blog);
        this.isLoading = false;

        // Set label động lên breadcrumb - đảm bảo URL khớp chính xác
        const breadcrumbPath = `/blog/${this.blogId}`;

        this.breadcrumbService.setLabel(breadcrumbPath, this.blog.blog_title);
      },
      error: (err) => {
        console.error('Error loading blog:', err); // Debug log
        this.error = 'Không thể tải nội dung blog này.';
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy() {
    // Clear label khi rời trang detail
    if (this.blogId) {
      const breadcrumbPath = `/blog/${this.blogId}`;
      this.breadcrumbService.clearLabel(breadcrumbPath);
    }
  }

  getTags(): string[] {
    if (!this.blog) return [];
    if (Array.isArray(this.blog.blog_tags)) return this.blog.blog_tags;
    if (typeof this.blog.blog_tags === 'string') {
      return this.blog.blog_tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  }

  backToList() {
    this.router.navigate(['/blog']);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
  }
  getDoctorImage(): string {
  const fileName = this.blog?.doctor_details?.image_link;
  const bucket = 'staff-uploads';
  
  if (!fileName) {
   
    return '/assets/default-doctor.png';
  }
  const cleanFileName = fileName.startsWith('/') ? fileName.slice(1) : fileName;
 
  const imageUrl = `${this.supabasePublicUrl}${bucket}/${cleanFileName}`;
  
  return imageUrl;
}
getBlogImage(): string {
  const fileName = this.blog?.image_link;
  const bucket = 'blog-uploads';
  

  if (!fileName) {
   
    return '/assets/default-blog.png'; // 👉 ảnh mặc định của blog
  }

  const cleanFileName = fileName.startsWith('/') ? fileName.slice(1) : fileName;
  

  const imageUrl = `${this.supabasePublicUrl}${bucket}/${cleanFileName}`;
  

  return imageUrl;
}
}
