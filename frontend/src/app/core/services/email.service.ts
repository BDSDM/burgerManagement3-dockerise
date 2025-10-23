import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/app/environments/environment';
import { MenuWithPrices } from '../models/MenuWithPrices.model';

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private baseUrl = `${environment.apiUrlEmail}/email`; // URL backend

  constructor(private http: HttpClient) {}

  sendInvoiceWithPdf(
    to: string,
    subject: string,
    body: string,
    totalPrice: number,
    menus: MenuWithPrices[]
  ) {
    const params = { to, subject, body, totalPrice };
    return this.http.post(`${this.baseUrl}/send-pdf`, menus, {
      params,
      responseType: 'text',
    });
  }
  sendInvoiceWithPdfAndDownload(
    to: string,
    subject: string,
    body: string,
    totalPrice: number,
    menus: MenuWithPrices[]
  ) {
    const params = { to, subject, body, totalPrice };

    return this.http.post(`${this.baseUrl}/send-pdf`, menus, {
      params,
      responseType: 'blob', // 🔥 important pour récupérer un fichier
    });
  }
}
