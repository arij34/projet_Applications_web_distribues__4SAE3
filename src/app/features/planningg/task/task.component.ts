import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TaskService, Task, TaskPriorite, TaskStatut } from '../../../services/task.service';
import { PlanningService, Planning } from '../../../services/planning.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {
  tasks: Task[] = [];
  plannings: Planning[] = [];

  /** Mois affiché (jour 1 du mois) */
  viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  readonly weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  readonly statuts: TaskStatut[] = ['TODO', 'IN_PROGRESS', 'DONE'];

  showAddModal = false;
  showEditModal = false;
  showDeleteConfirmModal = false;
  showAiModal = false;
  pendingDeleteTaskId: number | null = null;
  showCalendar = false;
  aiLoading = false;
  aiSaving = false;
  aiError = '';
  aiSelectedPlanningId: number | null = null;
  readonly aiTargetCount = 3;
  aiSuggestions: Array<Task & { selected: boolean }> = [];

  newTask: Task = this.emptyTask();
  editTask: Task | null = null;

  constructor(
    private taskService: TaskService,
    private planningService: PlanningService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadPlannings();
  }

  private emptyTask(): Task {
    return {
      titre: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      statut: 'TODO',
      planningId: null
    };
  }

  loadTasks(): void {
    this.taskService.getAllTasks().subscribe(data => {
      this.tasks = [...data].sort((a, b) => this.urgencyScore(b) - this.urgencyScore(a));
    });
  }

  get overdueCount(): number {
    return this.tasks.filter(t => this.isTaskOverdue(t)).length;
  }

  get criticalCount(): number {
    return this.tasks.filter(t => (t.priorite === 'CRITICAL' || t.priorite === 'HIGH') && t.statut !== 'DONE').length;
  }

  get doneCount(): number {
    return this.tasks.filter(t => t.statut === 'DONE').length;
  }

  get completionRate(): number {
    if (this.tasks.length === 0) return 0;
    return Math.round((this.doneCount * 10000) / this.tasks.length) / 100;
  }

  loadPlannings(): void {
    this.planningService.getAllPlannings().subscribe(data => {
      this.plannings = data.filter(p => p.id != null);
    });
  }

  prevMonth(): void {
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + 1, 1);
  }

  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
  }

  /** Grille 6x7 : lundi = première colonne */
  get calendarCells(): { date: Date; inCurrentMonth: boolean }[] {
    const y = this.viewMonth.getFullYear();
    const m = this.viewMonth.getMonth();
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(y, m, 1 - startOffset);
    const cells: { date: Date; inCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push({
        date: d,
        inCurrentMonth: d.getMonth() === m
      });
    }
    return cells;
  }

  monthTitle(): string {
    return this.viewMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  tasksForDay(day: Date): Task[] {
    return this.tasks.filter(t => this.taskOverlapsDay(t, day));
  }

  visibleTasksForDay(day: Date): Task[] {
    return this.tasksForDay(day).slice(0, 2);
  }

  taskCountForDay(day: Date): number {
    return this.tasksForDay(day).length;
  }

  private taskOverlapsDay(t: Task, day: Date): boolean {
    if (!t.dateDebut || !t.dateFin) return false;
    const start = this.stripTime(new Date(t.dateDebut));
    const end = this.stripTime(new Date(t.dateFin));
    const d = this.stripTime(day);
    return start.getTime() <= d.getTime() && d.getTime() <= end.getTime();
  }

  private stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  isToday(d: Date): boolean {
    const today = this.stripTime(new Date());
    return this.stripTime(d).getTime() === today.getTime();
  }

  isWeekend(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  openAddFromDay(day: Date): void {
    const iso = this.toDatetimeLocal(day, 9, 0);
    const isoEnd = this.toDatetimeLocal(day, 17, 0);
    this.newTask = {
      ...this.emptyTask(),
      dateDebut: iso,
      dateFin: isoEnd
    };
    this.showAddModal = true;
  }

  openAddGeneral(): void {
    const now = new Date();
    this.newTask = {
      ...this.emptyTask(),
      dateDebut: this.toDatetimeLocal(now, 9, 0),
      dateFin: this.toDatetimeLocal(now, 17, 0)
    };
    this.showAddModal = true;
  }

  openAiModal(): void {
    this.aiError = '';
    this.aiSuggestions = [];
    this.aiSelectedPlanningId = this.plannings.length > 0 ? (this.plannings[0].id ?? null) : null;
    this.showAiModal = true;
  }

  closeAiModal(): void {
    this.showAiModal = false;
    this.aiLoading = false;
    this.aiSaving = false;
    this.aiError = '';
    this.aiSuggestions = [];
  }

  generateAiTodo(): void {
    if (this.aiSelectedPlanningId == null) {
      this.aiError = 'Selectionnez un planning pour generer des taches.';
      return;
    }

    this.aiLoading = true;
    this.aiError = '';
    this.aiSuggestions = [];

    this.taskService.generateTodoSuggestions({
      planningId: this.aiSelectedPlanningId,
      targetCount: this.aiTargetCount
    }).subscribe({
      next: (res) => {
        const planningId = this.aiSelectedPlanningId;
        this.aiSuggestions = (res.suggestions || []).map(s => ({
          ...s,
          statut: s.statut || 'TODO',
          dateDebut: this.toInputLocal(s.dateDebut),
          dateFin: this.toInputLocal(s.dateFin),
          planningId: s.planningId ?? planningId,
          selected: true
        }));

        if (this.aiSuggestions.length === 0) {
          this.aiError = 'Aucune suggestion retournee par l\'IA.';
        }
        this.aiLoading = false;
      },
      error: (err) => {
        this.aiLoading = false;
        this.aiError = err?.error?.message || 'Generation IA impossible pour le moment.';
      }
    });
  }

  get selectedAiCount(): number {
    return this.aiSuggestions.filter(s => s.selected).length;
  }

  aiTaskDateInvalid(task: Task): boolean {
    return !this.isDateRangeValid(task.dateDebut, task.dateFin);
  }

  get hasInvalidSelectedAiTasks(): boolean {
    return this.aiSuggestions.some(s => s.selected && this.aiTaskDateInvalid(s));
  }

  saveSelectedAiTasks(): void {
    const selectedTasks = this.aiSuggestions.filter(s => s.selected);
    if (selectedTasks.length === 0) {
      this.aiError = 'Selectionnez au moins une tache a enregistrer.';
      return;
    }

    if (this.hasInvalidSelectedAiTasks) {
      this.aiError = 'Corrigez les dates des taches selectionnees (debut <= fin).';
      return;
    }

    this.aiSaving = true;
    this.aiError = '';

    const requests = selectedTasks.map(task => this.taskService.addTask(this.buildPayload({
      ...task,
      planningId: task.planningId ?? this.aiSelectedPlanningId ?? null
    })));

    forkJoin(requests).subscribe({
      next: () => {
        this.aiSaving = false;
        this.closeAiModal();
        this.loadTasks();
      },
      error: (err) => {
        this.aiSaving = false;
        this.aiError = err?.error?.message || 'Enregistrement des suggestions echoue.';
      }
    });
  }

  private toDatetimeLocal(d: Date, h: number, min: number): string {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, min, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
  }

  addTask(): void {
    if (!this.isDateRangeValid(this.newTask.dateDebut, this.newTask.dateFin)) {
      return;
    }

    const payload = this.buildPayload(this.newTask);
    this.taskService.addTask(payload).subscribe(() => {
      this.loadTasks();
      this.newTask = this.emptyTask();
      this.showAddModal = false;
    });
  }

  startEdit(t: Task): void {
    this.editTask = {
      ...t,
      dateDebut: this.toInputLocal(t.dateDebut),
      dateFin: this.toInputLocal(t.dateFin),
      planningId: t.planningId ?? t.planning?.id ?? null
    };
    this.showEditModal = true;
  }

  private toInputLocal(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  updateTask(): void {
    if (!this.editTask?.id) return;
    if (!this.isDateRangeValid(this.editTask.dateDebut, this.editTask.dateFin)) {
      return;
    }

    const payload = this.buildPayload(this.editTask);
    this.taskService.updateTask(this.editTask.id, payload).subscribe(() => {
      this.loadTasks();
      this.editTask = null;
      this.showEditModal = false;
    });
  }

  deleteTask(id: number | undefined): void {
    if (id == null) return;
    this.taskService.deleteTask(id).subscribe(() => {
      this.loadTasks();
      this.editTask = null;
      this.showEditModal = false;
    });
  }

  openDeleteConfirm(id: number | undefined): void {
    if (id == null) return;
    this.pendingDeleteTaskId = id;
    this.showDeleteConfirmModal = true;
  }

  cancelDeleteConfirm(): void {
    this.pendingDeleteTaskId = null;
    this.showDeleteConfirmModal = false;
  }

  confirmDeleteTask(): void {
    if (this.pendingDeleteTaskId == null) {
      return;
    }

    const id = this.pendingDeleteTaskId;
    this.taskService.deleteTask(id).subscribe(() => {
      this.loadTasks();
      this.editTask = null;
      this.showEditModal = false;
      this.cancelDeleteConfirm();
    });
  }

  planningLabel(task: Task): string {
    const linkedPlanningId = task.planningId ?? task.planning?.id ?? null;

    if (linkedPlanningId == null) {
      return 'Sans planning';
    }

    const planning = this.plannings.find(p => p.id === linkedPlanningId);
    return planning?.type?.trim() || `Planning #${linkedPlanningId}`;
  }

  planningOptionLabel(planning: Planning): string {
    const rawType = planning.type?.trim();
    if (rawType) {
      return rawType;
    }
    return planning.id != null ? `Planning #${planning.id}` : 'Planning';
  }

  dateRangeLabel(task: Task): string {
    const start = task.dateDebut ? new Date(task.dateDebut) : null;
    const end = task.dateFin ? new Date(task.dateFin) : null;
    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '-';
    }
    return `${start.toLocaleDateString('fr-FR')} ${start.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })} - ${end.toLocaleDateString('fr-FR')} ${end.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }

  isTaskOverdue(task: Task): boolean {
    if (task.isOverdue != null) {
      return task.isOverdue;
    }

    if (!task.dateFin || task.statut === 'DONE') {
      return false;
    }

    const end = new Date(task.dateFin);
    return !isNaN(end.getTime()) && end.getTime() < Date.now();
  }

  priorityLabel(priority: TaskPriorite | undefined): string {
    switch (priority) {
      case 'CRITICAL':
        return 'Critique';
      case 'HIGH':
        return 'Haute';
      case 'MEDIUM':
        return 'Moyenne';
      case 'LOW':
        return 'Basse';
      default:
        return 'Auto';
    }
  }

  priorityClass(priority: TaskPriorite | undefined): string {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-slate-200 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  private urgencyScore(task: Task): number {
    if (task.statut === 'DONE') return 0;
    if (this.isTaskOverdue(task)) return 100;

    switch (task.priorite) {
      case 'CRITICAL':
        return 90;
      case 'HIGH':
        return 70;
      case 'MEDIUM':
        return 40;
      case 'LOW':
        return 20;
      default:
        return 10;
    }
  }

  /** Corps attendu par Spring : dates ISO + planning { id } si sélectionné */
  private buildPayload(t: Task): Task {
    const body: Task = {
      titre: t.titre,
      description: t.description,
      dateDebut: this.fromDatetimeLocalToIso(t.dateDebut),
      dateFin: this.fromDatetimeLocalToIso(t.dateFin),
      statut: t.statut
    };
    if (t.planningId != null && !isNaN(Number(t.planningId))) {
      body.planning = { id: Number(t.planningId) };
    }
    return body;
  }

  private fromDatetimeLocalToIso(v: string): string {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toISOString();
  }

  isDateRangeValid(dateDebut: string, dateFin: string): boolean {
    if (!dateDebut || !dateFin) return true;
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    return start.getTime() <= end.getTime();
  }

  get newTaskDateInvalid(): boolean {
    return !this.isDateRangeValid(this.newTask.dateDebut, this.newTask.dateFin);
  }

  get editTaskDateInvalid(): boolean {
    return this.editTask
      ? !this.isDateRangeValid(this.editTask.dateDebut, this.editTask.dateFin)
      : false;
  }

  statutClass(s: TaskStatut): string {
    switch (s) {
      case 'TODO':
        return 'bg-slate-200 text-slate-800';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-900';
      case 'DONE':
        return 'bg-emerald-100 text-emerald-900';
      default:
        return 'bg-slate-100';
    }
  }

  statutLabel(s: TaskStatut): string {
    switch (s) {
      case 'TODO':
        return 'À faire';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'DONE':
        return 'Terminé';
      default:
        return s;
    }
  }
}
