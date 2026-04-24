import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type BlogStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const RESTRICTED_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'bastard',
  'asshole',
  'damn',
  'stupid',
  'hate',
  'racist',
  'raciste'
];

export function getRestrictedWord(text?: string | null): string | null {
  if (!text) return null;
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const hit = RESTRICTED_WORDS.find((word) => tokens.includes(word));
  return hit || null;
}

export interface BlogPostDto {
  idPost?: number;
  title: string;
  content: string;
  author: string;
  status?: BlogStatus;
  likes?: number;
  dislikes?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogApiService {
  private readonly useGateway = false;
  private readonly directBase = 'http://localhost:8050/posts';
  private readonly gatewayBase = 'http://localhost:8091/posts';

  constructor(private readonly http: HttpClient) {}

  private get baseUrl(): string {
    return this.useGateway ? this.gatewayBase : this.directBase;
  }

  getAll(): Promise<BlogPostDto[]> {
    return firstValueFrom(this.http.get<BlogPostDto[]>(`${this.baseUrl}/all`));
  }

  getApproved(): Promise<BlogPostDto[]> {
    return firstValueFrom(this.http.get<BlogPostDto[]>(`${this.baseUrl}/approved`));
  }

  getByAuthor(author: string): Promise<BlogPostDto[]> {
    return firstValueFrom(this.http.get<BlogPostDto[]>(`${this.baseUrl}/user/${encodeURIComponent(author)}`));
  }

  add(post: BlogPostDto): Promise<BlogPostDto> {
    return firstValueFrom(this.http.post<BlogPostDto>(`${this.baseUrl}/add`, post));
  }

  update(id: number, post: BlogPostDto): Promise<BlogPostDto> {
    return firstValueFrom(this.http.put<BlogPostDto>(`${this.baseUrl}/update/${id}`, post));
  }

  approve(id: number): Promise<BlogPostDto> {
    return firstValueFrom(this.http.put<BlogPostDto>(`${this.baseUrl}/approve/${id}`, {}));
  }

  reject(id: number): Promise<BlogPostDto> {
    return firstValueFrom(this.http.put<BlogPostDto>(`${this.baseUrl}/reject/${id}`, {}));
  }

  like(id: number): Promise<BlogPostDto> {
    return firstValueFrom(this.http.put<BlogPostDto>(`${this.baseUrl}/like/${id}`, {}));
  }

  removeLike(id: number): Promise<BlogPostDto> {
    return firstValueFrom(this.http.put<BlogPostDto>(`${this.baseUrl}/like/${id}/remove`, {}));
  }

  dislike(id: number): Promise<BlogPostDto> {
    return firstValueFrom(this.http.put<BlogPostDto>(`${this.baseUrl}/dislike/${id}`, {}));
  }

  removeDislike(id: number): Promise<BlogPostDto> {
    return firstValueFrom(this.http.put<BlogPostDto>(`${this.baseUrl}/dislike/${id}/remove`, {}));
  }

  delete(id: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' }));
  }
}
