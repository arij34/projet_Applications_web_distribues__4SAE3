import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectInvitationService } from '../../../core/services/skill/project-invitation.service';
import { ClientInvitation } from '../../../core/models/skill/client-invitation.model';

@Component({
  selector: 'app-client-project-invitations',
  templateUrl: './client-project-invitations.component.html',
  styleUrls: ['./client-project-invitations.component.css']
})
export class ClientProjectInvitationsComponent implements OnInit {

  projectId!: number;
  invitations: ClientInvitation[] = [];
  isLoading = false;
  errorMessage = '';
  projectTitle = '';

  constructor(
    private route: ActivatedRoute,
    private invitationService: ProjectInvitationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.projectId = +idParam;
        this.loadInvitations();
      }
    });
  }

  // ✅ public pour que les tests puissent y accéder directement
  public loadInvitations(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.invitationService.getInvitationsForProject(this.projectId).subscribe({
      next: (data) => {
        this.invitations = data || [];
        if (this.invitations.length > 0) {
          this.projectTitle = this.invitations[0].projectTitle || '';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du chargement des invitations.';
        this.isLoading = false;
      }
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  }
}