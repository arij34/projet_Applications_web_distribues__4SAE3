import { Component, OnInit } from '@angular/core';
import { PendingSkillService } from '../../../../../core/services/skill/pending-skill.service';
import { PendingSkill } from '../../../../../core/models/skill/pending-skill.model';

@Component({
  selector: 'app-pending-skill-list',
  templateUrl: './pending-skill-list.component.html',
  styleUrls: ['./pending-skill-list.component.css']
})
export class PendingSkillListComponent implements OnInit {

  skills: PendingSkill[] = [];

  constructor(private service: PendingSkillService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe(data => {
      this.skills = data;
    });
  }

  approve(id: number): void {
    this.service.approve(id).subscribe(() => {
      this.load();
    });
  }

  reject(id: number): void {
    this.service.reject(id).subscribe(() => {
      this.load();
    });
  }
}