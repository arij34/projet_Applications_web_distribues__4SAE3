import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkspaceAccessGuard implements CanActivate {

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const projectId = +route.params['id'];
    const queryParams = route.queryParams;

    const queryUserId = queryParams['userId'] as string | undefined;
    const queryRole = queryParams['role'] as string | undefined;
    const userId = queryUserId ? +queryUserId : (Number(localStorage.getItem('userId')) || 0);
    const role = queryRole || (localStorage.getItem('userRole') as string) || 'CLIENT';

    const apiUrl = `${environment.projectApiUrl}/projects/${projectId}/workspace/access`;
    return this.http.get<{ allowed: boolean; reason: string }>(apiUrl, {
      params: { userId: userId.toString(), role }
    }).pipe(
      map(res => {
        if (res.allowed) return true;
        console.warn('WorkspaceAccessGuard: accès refusé', res.reason);
        this.router.navigate(['/front-office/projects']);
        return false;
      }),
      catchError((err) => {
        console.warn('WorkspaceAccessGuard: erreur backend', err?.status);
        this.router.navigate(['/front-office/projects']);
        return of(false);
      })
    );
  }
}