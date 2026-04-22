# 📝 Component Creation Example

This guide shows you exactly how to convert a React component to Angular using the **challenges-preview** component as an example.

---

## React Component (Original)

**File:** `challenges-preview-section.tsx`

```tsx
import { ArrowRight, Users, Award } from 'lucide-react';

interface Props {
  challenges: Challenge[];
  onViewAll: () => void;
}

export function ChallengesPreviewSection({ challenges, onViewAll }: Props) {
  const recentChallenges = challenges
    .filter(c => c.status === 'Active')
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2>Challenges Overview</h2>
        <button onClick={onViewAll}>
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {recentChallenges.map(challenge => (
        <div key={challenge.id}>
          {challenge.title}
        </div>
      ))}
    </div>
  );
}
```

---

## Angular Component (Converted)

### Step 1: Create Component Files

```bash
cd challengeAdmin/components
mkdir challenges-preview
cd challenges-preview
touch challenges-preview.component.ts
touch challenges-preview.component.html
touch challenges-preview.component.css
```

### Step 2: TypeScript Component

**File:** `challenges-preview.component.ts`

```typescript
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
// Import your Challenge model
// import { Challenge } from '@app/core/models/challenge.model';

@Component({
  selector: 'app-challenges-preview',
  templateUrl: './challenges-preview.component.html',
  styleUrls: ['./challenges-preview.component.css']
})
export class ChallengesPreviewComponent implements OnInit {
  // Props become @Input
  @Input() challenges: any[] = [];
  
  // Callbacks become @Output with EventEmitter
  @Output() viewAll = new EventEmitter<void>();

  // Computed values become properties
  recentChallenges: any[] = [];
  stats = {
    total: 0,
    active: 0,
    totalParticipants: 0,
    avgCompletion: 0
  };

  ngOnInit(): void {
    this.calculateStats();
    this.filterRecentChallenges();
  }

  // React useEffect → ngOnChanges or methods called in ngOnInit
  ngOnChanges(): void {
    this.calculateStats();
    this.filterRecentChallenges();
  }

  private filterRecentChallenges(): void {
    this.recentChallenges = this.challenges
      .filter(c => c.status === 'Active')
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }

  private calculateStats(): void {
    this.stats = {
      total: this.challenges.length,
      active: this.challenges.filter(c => c.status === 'Active').length,
      totalParticipants: this.challenges.reduce((sum, c) => sum + (c.participants || 0), 0),
      avgCompletion: Math.round(
        this.challenges.reduce((sum, c) => sum + (c.completionRate || 0), 0) / this.challenges.length
      )
    };
  }

  // Event handlers
  onViewAll(): void {
    this.viewAll.emit();
  }

  onChallengeClick(challenge: any): void {
    this.viewAll.emit();
  }

  // Helper methods
  getStatusColor(status?: string): string {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Draft': return 'bg-gray-400';
      case 'Closed': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  }

  getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'Beginner': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Advanced': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Expert': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  // TrackBy for performance
  trackByChallenge(index: number, challenge: any): string {
    return challenge.id;
  }
}
```

### Step 3: HTML Template

**File:** `challenges-preview.component.html`

```html
<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-medium mb-1">Challenges Overview</h2>
      <p class="text-gray-600 text-sm">
        Recent active challenges and quick statistics
      </p>
    </div>
    <button
      (click)="onViewAll()"
      class="px-5 py-2.5 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/90 transition-colors flex items-center gap-2 shadow-sm">
      View All Challenges
      <!-- Arrow Right Icon -->
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
    </button>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-12 h-12 bg-blue-900/10 rounded-lg flex items-center justify-center">
          <!-- Award Icon -->
          <svg class="w-6 h-6 text-[#02066F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
          </svg>
        </div>
        <!-- Trending Up Icon -->
        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      </div>
      <div class="text-3xl font-medium mb-1">{{ stats.total }}</div>
      <div class="text-sm text-gray-600">Total Challenges</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <!-- Calendar Icon -->
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
      </div>
      <div class="text-3xl font-medium mb-1">{{ stats.active }}</div>
      <div class="text-sm text-gray-600">Active Now</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-12 h-12 bg-[#800020]/10 rounded-lg flex items-center justify-center">
          <!-- Users Icon -->
          <svg class="w-6 h-6 text-[#800020]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        </div>
      </div>
      <div class="text-3xl font-medium mb-1">{{ stats.totalParticipants | number }}</div>
      <div class="text-sm text-gray-600">Total Participants</div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div class="flex items-center justify-between mb-3">
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <!-- Trending Up Icon -->
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </div>
      </div>
      <div class="text-3xl font-medium mb-1">{{ stats.avgCompletion }}%</div>
      <div class="text-sm text-gray-600">Avg Completion</div>
    </div>
  </div>

  <!-- Recent Challenges Grid -->
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium">Recent Active Challenges</h3>
      <button
        (click)="onViewAll()"
        class="text-sm text-[#02066F] hover:underline flex items-center gap-1">
        See all
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Use *ngFor instead of map -->
      <div
        *ngFor="let challenge of recentChallenges; trackBy: trackByChallenge"
        (click)="onChallengeClick(challenge)"
        class="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer">
        
        <!-- Image -->
        <div class="relative h-32 overflow-hidden bg-gradient-to-br from-blue-900/10 to-[#800020]/10">
          <img
            *ngIf="challenge.image"
            [src]="challenge.image"
            [alt]="challenge.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div *ngIf="!challenge.image" class="w-full h-full flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
            </svg>
          </div>
          
          <!-- Status Badge -->
          <div class="absolute top-2 left-2">
            <div [class]="'px-2 py-0.5 rounded-full text-white text-xs ' + getStatusColor(challenge.status)">
              {{ challenge.status }}
            </div>
          </div>

          <!-- Difficulty Badge -->
          <div class="absolute top-2 right-2">
            <div [class]="'px-2 py-0.5 rounded-full text-xs border ' + getDifficultyColor(challenge.difficulty)">
              {{ challenge.difficulty }}
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4">
          <h4 class="font-medium mb-2 line-clamp-1">{{ challenge.title }}</h4>
          <p class="text-sm text-gray-600 mb-3 line-clamp-2">
            {{ challenge.description }}
          </p>

          <!-- Meta -->
          <div class="flex items-center justify-between text-xs text-gray-600">
            <div class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <span>{{ challenge.participants || 0 }}</span>
            </div>
            <div class="flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
              </svg>
              <span>{{ challenge.points || 0 }} pts</span>
            </div>
            <span *ngIf="challenge.completionRate" class="text-[#02066F]">
              {{ challenge.completionRate }}% done
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div *ngIf="recentChallenges.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
        </svg>
      </div>
      <h3 class="text-lg font-medium mb-2">No active challenges</h3>
      <p class="text-sm text-gray-600">Create your first challenge to get started</p>
    </div>

    <!-- View All Footer -->
    <div class="mt-6 pt-6 border-t border-gray-200">
      <button
        (click)="onViewAll()"
        class="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#02066F] hover:bg-blue-900/5 transition-colors text-sm flex items-center justify-center gap-2 group">
        <span class="group-hover:text-[#02066F] transition-colors">
          View All {{ challenges.length }} Challenges
        </span>
        <svg class="w-4 h-4 group-hover:text-[#02066F] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>
  </div>
</div>
```

### Step 4: CSS (Optional)

**File:** `challenges-preview.component.css`

```css
/* Add any component-specific styles here */
/* Most styling is done with Tailwind in the template */

/* Line clamp utility (if not in Tailwind) */
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
```

### Step 5: Update Module

Add to `challenge-admin.module.ts`:

```typescript
import { ChallengesPreviewComponent } from './components/challenges-preview/challenges-preview.component';

@NgModule({
  declarations: [
    // ... other components
    ChallengesPreviewComponent,
  ],
  // ...
})
```

### Step 6: Use Component

```html
<app-challenges-preview
  [challenges]="challenges"
  (viewAll)="navigateToChallengesPage()">
</app-challenges-preview>
```

---

## Key Conversion Points

1. **Props → @Input()**: `@Input() challenges: any[];`
2. **Callbacks → @Output()**: `@Output() viewAll = new EventEmitter();`
3. **State → Properties**: `recentChallenges: any[] = [];`
4. **useEffect → ngOnInit/ngOnChanges**: Lifecycle hooks
5. **map → *ngFor**: `*ngFor="let item of items"`
6. **Conditional → *ngIf**: `*ngIf="condition"`
7. **onClick → (click)**: `(click)="method()"`
8. **className → class**: `class="..."` or `[class]="..."`
9. **Interpolation**: `{{ value }}` instead of `{value}`
10. **Pipes**: `{{ number | number }}` for formatting

---

**Follow this pattern for all remaining components!** 🎯
