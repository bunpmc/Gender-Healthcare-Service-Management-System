import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  // ===== LOCAL STORAGE =====
  setToken(token: string) {
    localStorage.setItem('access_token', token);
  }
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
  clearToken() {
    localStorage.removeItem('access_token');
  }

  // ===== SESSION STORAGE =====
  setTokenSession(token: string) {
    sessionStorage.setItem('access_token', token);
  }
  getTokenSession(): string | null {
    return sessionStorage.getItem('access_token');
  }
  clearTokenSession() {
    sessionStorage.removeItem('access_token');
  }
}
