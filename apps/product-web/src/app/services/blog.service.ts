// ================== IMPORTS ==================
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { type Blog, type BlogDetail } from '../models/blog.model';
import { Observable } from 'rxjs';

// ================== SERVICE DECORATOR ==================
@Injectable({
  providedIn: 'root',
})
export class BlogService {
  // =========== CONSTRUCTOR ===========
  constructor(private http: HttpClient) {}

  // =========== PRIVATE HEADER BUILDER ===========
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  // =========== FETCH BLOGS ===========
  /**
   * Gọi API lấy danh sách blog
   */
  getBlogs(): Observable<Blog[]> {
    return this.http.get<Blog[]>(`${environment.apiEndpoint}/fetch-blog`, {
      headers: this.getHeaders(),
    });
  }

  // =========== FETCH BLOG BY ID ===========
  /**
   * Gọi API lấy blog theo ID
   */
  getBlogById(blogId: string): Observable<BlogDetail> {
    const params = new HttpParams().set('blog_id', blogId);
    return this.http.get<BlogDetail>(
      `${environment.apiEndpoint}/fetch-blog-id`,
      {
        params,
        headers: this.getHeaders(),
      }
    );
  }
}
