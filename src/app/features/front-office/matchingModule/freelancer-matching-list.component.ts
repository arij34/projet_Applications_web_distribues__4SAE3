import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatchingService } from '../../../core/services/skill/matching.service'; // ✅ IMPORT SERVICE
import { HttpClient } from '@angular/common/http'; // ✅ ajouter
import { FormsModule } from '@angular/forms';

export interface FreelancerMatch {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  location: string;
  rating: number;
  reviewCount: number;
  availability: string;
  skills: string[];
  activeProjects: number;
  completedProjects: number;
  hourlyRate: number;
  matchScore: number;
}

@Component({
  selector: 'app-freelancer-matching-list',
  templateUrl: './freelancer-matching-list.component.html',
  styleUrls: ['./freelancer-matching-list.component.css']
})
export class FreelancerMatchingListComponent implements OnInit {

  loading = false;
  searchQuery = '';
  showFilter = false;
  filterAvailability = '';
  filterMinMatch = 0;

  projectId: number | null = null;

  allFreelancers: FreelancerMatch[] = [];
  filteredFreelancers: FreelancerMatch[] = [];

  sentInvitations = new Set<number>();

  private avatarColors = [
    '#3b5bdb', '#0f9e75', '#7950f2',
    '#e64980', '#e67700', '#2f9e44',
    '#1098ad', '#d6336c', '#ae3ec9'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private matchingService: MatchingService,
    private http: HttpClient // ✅ ajouter
) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['projectId']) {
        this.projectId = +params['projectId'];
        console.log('Matching pour le projet ID :', this.projectId);

        this.loadFreelancers(); // ✅ charger après avoir récupéré projectId
      }
    });
  }

  // ✅ APPEL BACKEND
  loadFreelancers(): void {
    if (!this.projectId) return;

    this.loading = true;

    this.matchingService.getMatching(this.projectId).subscribe({
      next: (data: FreelancerMatch[]) => {
        this.allFreelancers = data;
        this.filteredFreelancers = [...data];
        this.onSearch(); // appliquer tri direct
        this.loading = false;
      },
      error: (err:any) => {
        console.error('Erreur chargement matching:', err);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredFreelancers = this.allFreelancers.filter(f => {
      const matchesSearch = !q ||
        `${f.firstName} ${f.lastName}`.toLowerCase().includes(q) ||
        f.role.toLowerCase().includes(q) ||
        f.skills.some(s => s.toLowerCase().includes(q));

      const matchesAvailability = !this.filterAvailability ||
        f.availability === this.filterAvailability;

      const matchesScore = f.matchScore >= Number(this.filterMinMatch);

      return matchesSearch && matchesAvailability && matchesScore;
    });

    this.filteredFreelancers.sort((a, b) => b.matchScore - a.matchScore);
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  resetFilter(): void {
    this.filterAvailability = '';
    this.filterMinMatch = 0;
    this.searchQuery = '';
    this.filteredFreelancers = [...this.allFreelancers];
  }

  viewCv(f: FreelancerMatch): void {
    this.router.navigate(['/front/freelancer-cv', f.id]);
  }

  // ✅ Après (appelle le backend)
sendInvitation(f: FreelancerMatch): void {
    if (this.sentInvitations.has(f.id)) return;

    // ✅ Récupérer le clientId depuis localStorage
    const clientIdStr = localStorage.getItem('userId') 
                     || localStorage.getItem('clientId');
    const clientId = clientIdStr ? parseInt(clientIdStr) : 0;

    const body = {
        projectId: this.projectId,
        freelancerId: f.id,
        clientId: clientId,
        matchScore: f.matchScore
    };

    this.http.post('http://localhost:8087/invitations/send', body).subscribe({
        next: () => {
            console.log('✅ Invitation envoyée');
            this.sentInvitations.add(f.id);
        },
        error: (err) => {
            console.error('❌ Erreur:', err);
        }
    });
}

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  getAvatarColor(firstName: string): string {
    const index = (firstName?.charCodeAt(0) ?? 0) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  getMatchClass(score: number): string {
    if (score >= 90) return 'high';
    if (score >= 80) return 'medium';
    return 'low';
  }

 getStatusClass(status: string): string {

  if (!status) return 'status-unavailable';

  status = status.toUpperCase();

  if (status.includes('UNAVAILABLE')) {
    return 'status-unavailable';
  }

  if (status.includes('FULL')) {
    return 'status-available'; // vert
  }

  if (status.includes('LIMITED')) {
    return 'status-busy'; // orange
  }

  if (status.includes('AVAILABLE')) {
    return 'status-available';
  }

  return 'status-unavailable';
}

 getStars(rating: number): { type: 'full' | 'half' | 'empty' }[] {
  const stars = [];
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  for (let i = 0; i < full; i++) stars.push({ type: 'full' as const });
  if (half) stars.push({ type: 'half' as const });
  for (let i = 0; i < empty; i++) stars.push({ type: 'empty' as const });

  return stars;
}

  formatStatus(status: string): string {
  return status
    ?.toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
}