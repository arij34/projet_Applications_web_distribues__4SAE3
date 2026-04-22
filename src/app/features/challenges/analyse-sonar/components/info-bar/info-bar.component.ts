import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoBarItem } from '../../models/analysis.model';

@Component({
  selector: 'app-info-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg divide-x divide-gray-200 grid grid-cols-3">
      <div *ngFor="let item of items" class="px-6 py-4">
        <div class="text-xs text-[#6B7280] mb-1">{{ item.label }}</div>
        <div class="text-sm font-semibold text-[#1F2937]">{{ item.value }}</div>
      </div>
    </div>
  `,
  styles: []
})
export class InfoBarComponent {
  @Input() items: InfoBarItem[] = [];
}
