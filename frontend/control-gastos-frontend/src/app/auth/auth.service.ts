import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    console.log(' Enviando login:', { email, password });
    
    return this.http.post(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap({
          next: (response: any) => {
            console.log('📥 Respuesta completa:', response);
            
            if (response && response.success) {
              const { user, token } = response.data;
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              this.currentUserSubject.next(user);
              console.log(' Login exitoso, token guardado');
            } else {
              console.error(' Respuesta sin success:', response);
            }
          },
          error: (error) => {
            console.error(' Error en petición:', error);
          }
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    console.log(' Sesión cerrada');
  }

  loginGoogle(credential: string): Observable<any> {
    console.log(' Enviando login con Google...');
    return this.http.post(`${this.apiUrl}/google`, { credential })
      .pipe(
        tap({
          next: (response: any) => {
            console.log(' Respuesta Google:', response);
            if (response && response.success) {
              const { user, token } = response.data;
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              this.currentUserSubject.next(user);
              console.log(' Google login exitoso, token guardado');
            } else {
              console.error(' Respuesta sin success:', response);
            }
          },
          error: (error) => {
            console.error(' Error en Google login:', error);
          }
        })
      );
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh`, {})
      .pipe(
        tap({
          next: (response: any) => {
            if (response && response.success && response.data) {
              const { user, token } = response.data;
              if (token) localStorage.setItem('token', token);
              if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
              }
              console.log(' Token renovado');
            }
          },
          error: () => {}
        })
      );
  }

  actualizarPerfil(data: { fullName?: string; email?: string; avatar?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/perfil`, data)
      .pipe(
        tap({
          next: (response: any) => {
            if (response && response.success && response.data) {
              const { user, token } = response.data;
              if (token) localStorage.setItem('token', token);
              if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
              }
              console.log(' Perfil actualizado');
            }
          },
          error: (error) => {
            console.error(' Error al actualizar perfil:', error);
          }
        })
      );
  }

  cambiarPassword(actual: string, nueva: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiar-password`, { actual, nueva });
  }

  mensajeKey(sufijo: string = ''): string {
    const u = this.getUser();
    return `fv_mensajes_${u?.id || 'anon'}${sufijo}`;
  }

  sesionExpiraEnMs(): number {
    const token = this.getToken();
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const exp = Number(payload.exp);
      if (!exp) return 0;
      return (exp * 1000) - Date.now();
    } catch {
      return 0;
    }
  }
}