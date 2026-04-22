import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CvuploadService {

  // ✅ CORRIGÉ : via proxy → Gateway (plus d'URL localhost codée en dur)
  private url = `${environment.apiUrl}/cv/upload`;

  constructor(private http: HttpClient) {}

  uploadCV(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(this.url, formData);
  }
}
