import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CookieService {
  private baseUrl = `${environment.apiUrlCookie}/cookies`;

  constructor(private http: HttpClient) {}

  /** ✅ Crée ou met à jour le cookie de dernière page pour un utilisateur */
  setLastPage(page: string, email: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/last-page`,
      { page, email },
      { withCredentials: true }
    );
  }

  /** ✅ Récupère la dernière page d’un utilisateur */
  getLastPage(email: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/last-page`, {
      params: { email },
      withCredentials: true,
    });
  }

  /** ✅ Supprime le cookie lastPage d’un utilisateur */
  deleteLastPage(email: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/last-page`, {
      params: { email },
      withCredentials: true,
    });
  }
  /** Récupère tous les cookies lastPage côté backend */
  getAllLastPageCookies(): Observable<any> {
    return this.http.get(`${this.baseUrl}/all-last-pages`, {
      withCredentials: true,
    });
  }
}
