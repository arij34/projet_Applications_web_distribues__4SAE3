import { Component, OnInit } from '@angular/core';
import { PlanningService, Planning } from '../../../services/planning.service';
import { TaskService, Task } from '../../../services/task.service';

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.css']
})
export class PlanningComponent implements OnInit {
  plannings: Planning[] = [];
  filteredPlannings: Planning[] = [];
  tasks: Task[] = [];

  searchQuery = '';

  newPlanning: Planning = {
    type: '',
    dateCreation: ''
  };
  editPlanning: Planning | null = null;

  showAddModal = false;
  showEditModal = false;

  constructor(
    private planningService: PlanningService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadPlannings();
    this.loadTasks();
  }

  loadPlannings(): void {
    this.planningService.getAllPlannings().subscribe((data: Planning[]) => {
      this.plannings = data;
      this.applyFilters();
    });
  }

  loadTasks(): void {
    this.taskService.getAllTasks().subscribe((data: Task[]) => {
      this.tasks = data;
    });
  }

  addPlanning(): void {
    this.planningService.addPlanning(this.newPlanning).subscribe(() => {
      this.loadPlannings();
      this.loadTasks();
      this.newPlanning = { type: '', dateCreation: '' };
      this.showAddModal = false;
    });
  }

  startEdit(planning: Planning): void {
    this.editPlanning = { ...planning };
    this.showEditModal = true;
  }

  updatePlanning(): void {
    if (this.editPlanning && this.editPlanning.id) {
      this.planningService.updatePlanning(this.editPlanning.id, this.editPlanning).subscribe(() => {
        this.loadPlannings();
        this.loadTasks();
        this.editPlanning = null;
        this.showEditModal = false;
      });
    }
  }

  deletePlanning(id: number): void {
    this.planningService.deletePlanning(id).subscribe(() => {
      this.loadPlannings();
      this.loadTasks();
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredPlannings = this.plannings.filter(p =>
      !query ||
      p.type?.toLowerCase().includes(query) ||
      String(p.id ?? '').includes(query)
    );
  }

  qrDataForPlanning(planning: Planning): string {
    const planningId = planning.id ?? null;
    const planningType = planning.type?.trim() || '-';
    const planningDate = this.formatDateForQr(planning.dateCreation);

    const linkedTasks = this.tasks.filter(t => {
      const taskPlanningId = t.planningId ?? t.planning?.id ?? null;
      return planningId != null && taskPlanningId === planningId;
    });

    const header = [
      `PLANNING ID: ${planningId ?? '-'}`,
      `TYPE: ${planningType}`,
      `DATE CREATION: ${planningDate}`,
      `NOMBRE TACHES: ${linkedTasks.length}`
    ];

    if (linkedTasks.length === 0) {
      return [...header, '', 'AUCUNE TACHE LIEE A CE PLANNING.'].join('\n');
    }

    const tasksText = linkedTasks.slice(0, 6).map((t, i) => {
      const start = this.formatDateForQr(t.dateDebut);
      const end = this.formatDateForQr(t.dateFin);
      const titre = t.titre?.trim() || 'Sans titre';
      const description = (t.description || '-').replace(/[\r\n]+/g, ' ').trim();
      const statut = t.statut || '-';

      return [
        `TACHE ${i + 1}`,
        `ID: ${t.id ?? '-'}`,
        `TITRE: ${titre}`,
        `DATE DEBUT: ${start}`,
        `DATE FIN: ${end}`,
        `STATUT: ${statut}`,
        `DESCRIPTION: ${description}`,
        `PLANNING: ${planningType}`
      ].join('\n');
    });

    const more = linkedTasks.length > 6
      ? [`+ ${linkedTasks.length - 6} AUTRES TACHES...`]
      : [];

    return [...header, '', ...tasksText.join('\n\n').split('\n'), ...more].join('\n');
  }

  private formatDateForQr(value: string | undefined): string {
    if (!value) {
      return '-';
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return value;
    }

    return d.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

}
