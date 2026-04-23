import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakdownItem } from '../../models/analysis.model';

@Component({
  selector: 'app-detailed-breakdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        (click)="toggleExpanded()"
        class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <span class="text-sm font-medium text-[#1F2937]">Detailed Breakdown</span>
        <svg
          [class]="'w-5 h-5 text-[#6B7280] transition-transform ' + (isExpanded ? 'rotate-180' : '')"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      <div *ngIf="isExpanded" class="border-t border-gray-200">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Count
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                Severity
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let item of items" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-[#1F2937]">{{ item.type }}</td>
              <td class="px-6 py-4 text-sm font-medium text-[#1F2937]">{{ item.count }}</td>
              <td class="px-6 py-4 text-sm text-[#6B7280]">{{ item.severity }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class DetailedBreakdownComponent {
  @Input() items: BreakdownItem[] = [];
  isExpanded = false;

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }
}
