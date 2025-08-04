// ================== IMPORTS ==================
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
import { type Blog, type BlogDetail } from "../models/blog.model";
import { Observable, from } from "rxjs";
import { createClient } from "@supabase/supabase-js";

// ================== SERVICE DECORATOR ==================
@Injectable({
  providedIn: "root",
})
export class BlogService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      "Content-Type": "application/json",
    });
  }

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  getBlogs(): Observable<Blog[]> {
    return from(
      this.supabase
        .from("blog_posts")
        .select(`*,
          doctor_details:staff_members(full_name)
        `)
        .then(({ data, error }) => {
          if (error) {
            throw error;
          }
          return data as Blog[];
        })
    );
  }

  getBlogById(blogId: string): Observable<BlogDetail> {
    return from(
      this.supabase
        .from("blog_posts")
        .select(`*,
          doctor_details:staff_members(full_name)
        `)
        .eq("blog_id", blogId)
        .single()
        .then(({ error, data }) => {
          if (error) {
            throw error;
          }
          return data as BlogDetail;
        })
    );
  }
}
