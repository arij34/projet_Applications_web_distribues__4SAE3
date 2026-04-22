# User Challenge List - Angular Components

This folder contains all the Angular components for the User Challenge List feature.

## Folder Structure

```
userChallengeList/
├── challenge-card/
│   ├── challenge-card.component.ts
│   ├── challenge-card.component.html
│   └── challenge-card.component.css
├── active-challenge-card/
│   ├── active-challenge-card.component.ts
│   ├── active-challenge-card.component.html
│   └── active-challenge-card.component.css
├── filter-bar/
│   ├── filter-bar.component.ts
│   ├── filter-bar.component.html
│   └── filter-bar.component.css
├── explore-challenges/
│   ├── explore-challenges.component.ts
│   ├── explore-challenges.component.html
│   └── explore-challenges.component.css
└── my-active-challenges/
    ├── my-active-challenges.component.ts
    ├── my-active-challenges.component.html
    └── my-active-challenges.component.css
```

## Components

### 1. ChallengeCardComponent
- **Selector**: `app-challenge-card`
- **Purpose**: Displays a single challenge card in the grid
- **Inputs**: `challenge` (Challenge interface)
- **Features**:
  - Challenge image with difficulty badge
  - Title and description
  - Technology tags
  - Estimated time and participants count
  - "Start Challenge" button

### 2. ActiveChallengeCardComponent
- **Selector**: `app-active-challenge-card`
- **Purpose**: Displays an active challenge with progress tracking
- **Inputs**: `challenge` (ActiveChallenge interface)
- **Features**:
  - Horizontal layout with image
  - Progress bar with percentage
  - Technology tags
  - Start date and last activity
  - "Continue Challenge" and "View Details" buttons

### 3. FilterBarComponent
- **Selector**: `app-filter-bar`
- **Purpose**: Comprehensive filtering toolbar
- **Outputs**:
  - `searchChange` - Emits search term
  - `difficultyChange` - Emits difficulty filter
  - `technologyChange` - Emits technology filter
  - `durationChange` - Emits duration filter
  - `statusChange` - Emits status filter
- **Features**:
  - Search input with icon
  - Difficulty filter buttons
  - Technology dropdown
  - Duration dropdown
  - Status dropdown
  - Clear filters button

### 4. ExploreChallengesComponent
- **Selector**: `app-explore-challenges`
- **Purpose**: Main page for exploring all challenges
- **Features**:
  - Gradient header with stats
  - Filter bar integration
  - 3-column responsive grid
  - Empty state message

### 5. MyActiveChallengesComponent
- **Selector**: `app-my-active-challenges`
- **Purpose**: Page showing user's active challenges
- **Features**:
  - Gradient header with progress stats
  - Active challenge cards with progress
  - Back navigation
  - Empty state with CTA

## Interfaces

### Challenge
```typescript
{
  id: string;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  estimatedTime: string;
  tags: string[];
  participants: number;
  imageUrl: string;
}
```

### ActiveChallenge
Extends Challenge with:
```typescript
{
  progress: number;
  startedAt: string;
  lastActivity: string;
}
```

## Integration

To use these components in your Angular project:

1. Import the components where needed
2. Add them to your routing configuration
3. Ensure you have Tailwind CSS configured
4. Import FormsModule for filter bar functionality

## Styling

All components use:
- Tailwind CSS utility classes
- Brand colors (#B3D1F0, #EBF4FF, #1E3A8A, #F5EDE3)
- 12px border radius
- Smooth transitions and hover effects
- Responsive design with mobile-first approach
