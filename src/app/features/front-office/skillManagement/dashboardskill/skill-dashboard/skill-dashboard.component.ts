import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../../../core/auth/auth.service';
import { FreelancerSkillService } from '../../../../../core/services/skill/freelancer-skill.service';
import { EducationService } from '../../../../../core/services/skill/education.service';
import { AvailabilityService } from '../../../../../core/services/skill/availability.service';
import { ExperienceService } from '../../../../../core/services/skill/experience.service';
import { Education } from '../../../../../core/models/skill/education.model';
import { CvuploadService } from '../../../../../core/services/skill/cvupload.service';
import { NotificationService, AppNotification } from '../../../../../core/services/skill/notification.service';
import { FreelancerSkill } from '../../../../../core/models/skill/freelancer-skill.model';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-skill-dashboard',
  templateUrl: './skill-dashboard.component.html',
  styleUrls: ['./skill-dashboard.component.css']
})
export class SkillDashboardComponent implements OnInit, OnDestroy {

  freelancerSkills: any[] = [];
  educations: any[] = [];
  experiences: any[] = [];

  latestExperience: any = null;
  latestEducation?: Education;
  availability: any = null;

  // ✅ CORRIGÉ : remplace "private userId = 1"
  private keycloakUserId: string = '';

  loadingSkills = false;
  loadingDuplicates = false;

  totalYears = 0;
  highestDegree = '';
  newThisMonth = 0;
  validationRate = 0;
  extractedData: any = null;

  duplicatePairs: any[] = [];
  selectedFileName: string | null = null;
  uploading: boolean = false;
  skillsToAdd: string[] = [];

  toasts: {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
    skillName: string;
    visible: boolean;
  }[] = [];
  private toastCounter = 0;
  private notifSub!: Subscription;

  constructor(
    private freelancerSkillService: FreelancerSkillService,
    private educationService: EducationService,
    private availabilityService: AvailabilityService,
    private experienceService: ExperienceService,
    private cvService: CvuploadService,
    private notifService: NotificationService,
    private authService: AuthService  // ✅ AJOUTÉ
  ) {}

  ngOnInit(): void {
    // ✅ CORRIGÉ : getKeycloakSub() est déjà dans AuthService de votre projet
    this.keycloakUserId = this.authService.getKeycloakSub();

    this.loadSkills();
    this.loadExperience();
    this.loadLatestEducation();
    this.loadAvailability();

    // ✅ CORRIGÉ : keycloakUserId (string UUID) au lieu de userId=1
    this.notifService.connect('USER', this.keycloakUserId);

    this.notifSub = this.notifService.notifications$.subscribe(notifs => {
      if (!notifs.length) return;
      const latest = notifs[0];
      if (!latest.read) {
        this.showToast(latest);
      }
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.notifService.disconnect();
  }

  showToast(notif: AppNotification): void {
    const id = ++this.toastCounter;
    const type = notif.type === 'SKILL_APPROVED' ? 'success'
               : notif.type === 'SKILL_REJECTED'  ? 'error'
               : 'info';
    this.toasts.push({ id, message: notif.message, type, skillName: notif.skillName, visible: true });
    setTimeout(() => this.dismissToast(id), 5000);
  }

  dismissToast(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.visible = false;
      setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 400);
    }
  }

  getToastIcon(type: string): string {
    if (type === 'success') return '✅';
    if (type === 'error')   return '❌';
    return '🔔';
  }

  getToastTitle(type: string): string {
    if (type === 'success') return 'Skill Approved!';
    if (type === 'error')   return 'Skill Rejected';
    return 'Notification';
  }

  loadSkills(): void {
    this.loadingSkills = true;
    this.freelancerSkillService.getAll().subscribe({
      next: (data: any) => {
        this.freelancerSkills = data || [];
        this.computeValidationRate();
        this.newThisMonth = Math.min(this.freelancerSkills.length, 2);
        this.loadDuplicateSkills();
        this.loadingSkills = false;
      },
      error: () => this.loadingSkills = false
    });
  }

  deleteSkill(id: number): void {
    if (confirm('Delete this skill?')) {
      this.freelancerSkillService.delete(id).subscribe(() => this.loadSkills());
    }
  }

  loadDuplicateSkills(): void {
    this.loadingDuplicates = true;
    // ✅ CORRIGÉ : plus de this.userId — endpoint /user/me/duplicates
    this.freelancerSkillService.getDuplicateSkillsForCurrentUser().subscribe({
      next: (data: any[]) => {
        this.duplicatePairs = data || [];
        this.loadingDuplicates = false;
      },
      error: () => this.loadingDuplicates = false
    });
  }

  loadExperience(): void {
    this.experienceService.getAll().subscribe(data => {
      this.experiences = data || [];
      if (this.experiences.length > 0) {
        this.experiences.sort((a, b) => {
          const dateA = a.endDate ? new Date(a.endDate).getTime() : Date.now();
          const dateB = b.endDate ? new Date(b.endDate).getTime() : Date.now();
          return dateB - dateA;
        });
        this.latestExperience = this.experiences[0];
      }
    });
    this.experienceService.getTotalYearsForCurrentUser().subscribe((total: number) => {
      this.totalYears = total || 0;
    });
  }

  loadLatestEducation(): void {
    this.educationService.getLatestForCurrentUser().subscribe({
      next: (data: any) => {
        if (data) { this.latestEducation = data; this.highestDegree = data.degree || ''; }
        else { this.loadAllEducations(); }
      },
      error: () => this.loadAllEducations()
    });
  }

  loadAllEducations(): void {
    this.educationService.getAll().subscribe({
      next: (data: Education[]) => {
        this.educations = data || [];
        if (this.educations.length > 0) {
          const sorted = [...this.educations].sort((a, b) => b.year - a.year);
          this.latestEducation = sorted[0];
          this.highestDegree = sorted[0].degree || '';
        }
      }
    });
  }

  loadAvailability(): void {
    this.availabilityService.getAll().subscribe({
      next: (data: any) => { this.availability = Array.isArray(data) ? data[0] : data; }
    });
  }

  getAvailStatus(): string {
    if (!this.availability?.status) return '';
    const s = this.availability.status;
    if (s.startsWith('AVAILABLE')) return 'AVAILABLE';
    if (s.startsWith('PART_TIME')) return 'PART TIME';
    return 'UNAVAILABLE';
  }

  getAvailLabel(): string {
    const s = this.getAvailStatus();
    if (s === 'AVAILABLE') return 'Available';
    if (s === 'PART TIME') return 'Part Time';
    return 'Unavailable';
  }

  getAvailClass(): string {
    const s = this.getAvailStatus();
    if (s === 'AVAILABLE') return 'avail-badge-available';
    if (s === 'PART TIME') return 'avail-badge-parttime';
    return 'avail-badge-unavailable';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFileName = file.name;
    this.uploadCV(file);
  }

  uploadCV(file: File) {
    this.uploading = true;
    this.cvService.uploadCV(file).subscribe({
      next: (res) => {
        const cv = res.data?.data ? res.data.data : res.data;
        this.extractedData = {
          name: cv.name, email: cv.email, phone: cv.phone,
          skills: cv.skills || [], education: cv.education || [],
          experience: cv.experience || [], confidence_score: cv.confidence_score
        };
        this.skillsToAdd = [];
        this.uploading = false;
      },
      error: (err) => { console.error(err); this.uploading = false; }
    });
  }

  preCheckSkills() {
    if (!this.extractedData?.skills?.length) {
      Swal.fire('No skills', 'No skills were extracted from the CV.', 'info');
      return;
    }

    this.freelancerSkillService.checkExistingSkillsForCurrentUser(this.extractedData.skills)
      .subscribe({
        next: (response: { existing: string[]; newSkills: string[] }) => {
          this.skillsToAdd = Array.isArray(response.newSkills) ? [...response.newSkills] : [];
          const existingText = response.existing?.length ? response.existing.join(', ') : 'None';
          const newText = this.skillsToAdd.length ? this.skillsToAdd.join(', ') : 'None';
          Swal.fire({
            title: 'Skill Analysis',
            html: `<div style="text-align:left">
              <p><b>✅ Already in your profile (${response.existing?.length || 0}):</b><br>
                <span style="color:#6c757d">${existingText}</span></p>
              <p><b>🆕 New skills to add (${this.skillsToAdd.length}):</b><br>
                <span style="color:#198754">${newText}</span></p>
            </div>`,
            icon: 'info', showCancelButton: true,
            confirmButtonText: `Add ${this.skillsToAdd.length} New Skill(s)`,
            cancelButtonText: 'Cancel',
            didOpen: () => {
              if (!this.skillsToAdd.length) {
                const btn = Swal.getConfirmButton();
                if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }
              }
            }
          }).then((result: any) => {
            if (result.isConfirmed && this.skillsToAdd.length > 0) this.autoAddSkills();
          });
        },
        error: (err: any) => {
          console.error(err);
          Swal.fire('Error', 'Could not check skills. Please try again.', 'error');
        }
      });
  }

  autoAddSkills() {
    if (!this.skillsToAdd?.length) {
      Swal.fire({ title: 'Nothing to add', text: 'All skills already exist.', icon: 'info' });
      return;
    }

    const requests = this.skillsToAdd.map((skillName: string) =>
      this.freelancerSkillService.createWithSkillInputCV(skillName, {
        level: 1,
        yearsExperience: 1,
        extractedByAI: true,
        customSkillName: skillName
      } as FreelancerSkill).pipe(
        catchError(() => { console.warn(`Skipped "${skillName}"`); return of(null); })
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        const added   = results.filter(r => r !== null).length;
        const skipped = results.length - added;
        let msg = `${added} skill(s) added successfully.`;
        if (skipped > 0) msg += ` ${skipped} were skipped.`;
        Swal.fire('Done!', msg, 'success');
        this.skillsToAdd = [];
        this.loadSkills();
      },
      error: () => Swal.fire('Error', 'An error occurred.', 'error')
    });
  }

  computeValidationRate(): void {
    if (!this.freelancerSkills.length) { this.validationRate = 0; return; }
    const expert = this.freelancerSkills.filter(
      s => s.level === 'EXPERT' || s.level === 'ADVANCED'
    ).length;
    this.validationRate = Math.round((expert / this.freelancerSkills.length) * 100);
  }

  getLevelClass(level: string): string {
    const map: any = {
      BEGINNER: 'lvl-beginner', ELEMENTARY: 'lvl-elementary',
      INTERMEDIATE: 'lvl-intermediate', ADVANCED: 'lvl-advanced', EXPERT: 'lvl-expert'
    };
    return map[level] || 'lvl-beginner';
  }

  getInitials(name: string): string {
    return name ? name.substring(0, 4).toUpperCase() : '?';
  }
}