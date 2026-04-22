# SonarCloud Analysis Module for Angular 18

Professional, enterprise-grade SonarCloud code quality analysis dashboard components for Angular 18.

## Features

- ✅ Standalone Angular 18 components
- ✅ Fully typed with TypeScript
- ✅ Tailwind CSS styling
- ✅ Professional, serious design
- ✅ Modular and reusable
- ✅ Ready for integration

## Installation

1. Copy the `analyse-sonar` folder into your Angular project (e.g., `src/app/analyse-sonar/`)

2. Ensure Tailwind CSS is configured in your Angular project

3. Import the main component in your module or standalone component:

```typescript
import { SonarAnalysisComponent } from './analyse-sonar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SonarAnalysisComponent],
  template: `<app-sonar-analysis [data]="analysisData"></app-sonar-analysis>`
})
export class AppComponent {
  analysisData = {
    qualityGateStatus: 'PASSED',
    codeHealthScore: 92,
    // ... your data
  };
}
```

## Components

### SonarAnalysisComponent (Main Container)
The main component that orchestrates all sub-components.

**Inputs:**
- `data: AnalysisData` - The analysis data object
- `pullRequestNumber: string` - PR number (default: '#7')
- `analyzedAt: string` - Analysis timestamp

**Usage:**
```html
<app-sonar-analysis 
  [data]="analysisData"
  [pullRequestNumber]="'#7'"
  [analyzedAt]="'Mar 1, 2026 – 10:22 UTC'">
</app-sonar-analysis>
```

### Individual Components

You can also use individual components separately:

#### QualityGateStatusComponent
```html
<app-quality-gate-status [status]="'PASSED'"></app-quality-gate-status>
```

#### MetricCardComponent
```html
<app-metric-card
  label="Bugs"
  [value]="0"
  description="Detected logic errors in code."
  variant="neutral">
</app-metric-card>
```

#### ProgressBarComponent
```html
<app-progress-bar 
  label="Test Coverage" 
  [value]="87.3" 
  variant="primary">
</app-progress-bar>
```

#### CodeHealthScoreComponent
```html
<app-code-health-score [score]="92"></app-code-health-score>
```

#### InfoBarComponent
```html
<app-info-bar [items]="infoItems"></app-info-bar>
```

#### DetailedBreakdownComponent
```html
<app-detailed-breakdown [items]="breakdownItems"></app-detailed-breakdown>
```

## Data Structure

```typescript
import { AnalysisData } from './analyse-sonar';

const analysisData: AnalysisData = {
  qualityGateStatus: 'PASSED',
  codeHealthScore: 92,
  metrics: {
    bugs: {
      label: 'Bugs',
      value: 0,
      description: 'Detected logic errors in code.',
      variant: 'neutral'
    },
    vulnerabilities: {
      label: 'Vulnerabilities',
      value: 0,
      description: 'Security-related issues detected.',
      variant: 'neutral'
    },
    securityHotspots: {
      label: 'Security Hotspots',
      value: 0,
      description: 'Security-sensitive code to review.',
      variant: 'neutral'
    },
    codeSmells: {
      label: 'Code Smells',
      value: 12,
      description: 'Maintainability issues in code.',
      variant: 'warning'
    },
    testCoverage: {
      label: 'Test Coverage',
      value: '87.3%',
      description: 'Percentage of code covered by tests.',
      variant: 'success'
    },
    codeDuplication: {
      label: 'Code Duplication',
      value: '2.1%',
      description: 'Percentage of duplicated code.',
      variant: 'neutral'
    }
  },
  coverage: 87.3,
  duplication: 2.1,
  codebaseInfo: [
    { label: 'Lines of Code', value: '24,567' },
    { label: 'Pull Request Key', value: '#7' },
    { label: 'Analyzed At', value: 'Mar 1, 2026 – 10:22 UTC' }
  ],
  detailedBreakdown: [
    { type: 'Critical Bugs', count: 0, severity: 'Critical' },
    { type: 'Major Vulnerabilities', count: 0, severity: 'Major' },
    { type: 'Minor Code Smells', count: 12, severity: 'Minor' },
    { type: 'Security Hotspots', count: 0, severity: 'Review' },
    { type: 'Duplicated Blocks', count: 3, severity: 'Info' }
  ]
};
```

## Styling

All components use Tailwind CSS with a professional color scheme:
- Primary Blue: #b3d1fa
- Success Green: #16A34A
- Warning Orange: #D97706
- Error Red: #DC2626
- Text Primary: #1F2937
- Muted Text: #6B7280

## Requirements

- Angular 18+
- Tailwind CSS
- TypeScript

## Design Philosophy

This module follows a serious, professional, enterprise-grade design:
- Minimal and analytical
- Structured grid-based layout
- Clean SaaS aesthetic
- Strong visual hierarchy
- Neutral, mature design tone
- No playful elements
- Professional engineering tooling feel

## License

Use freely in your projects.
