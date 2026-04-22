# Fix: Sonar Analysis Spinner Keeps Spinning After Pipeline Finishes

## Problem
On the Sonar analysis page, the loading spinner keeps spinning even after the SonarCloud pipeline has finished and results are available in the backend.

## Root Cause
The frontend polls `GET /participations/{id}/sonar-results/status`. When the backend returns `{ status: "completed", result: {...} }`, the component must:
1. Set `isWaitingForAnalysis = false`
2. Apply the result to `data`
3. Stop the polling subscription

If any of these fail, the spinner keeps showing.

## Files to Check

### 1. Frontend Component
**Path:** `src/app/features/challenges/analyse-sonar/components/sonar-analysis/sonar-analysis.component.ts`

### 2. Frontend Service
**Path:** `src/app/core/services/participation.service.ts`

### 3. Backend (verify separately)
- Endpoint: `GET /participations/{participationId}/sonar-results/status`
- Must return: `{ status: "completed", result: SonarCloudResult }` when results exist, or `{ status: "pending", result: null }` when not ready.

---

## Step-by-Step Fix

### Step 1: Verify the API base URL
In `src/environments/environment.ts` (or `environment.prod.ts`), ensure `apiUrl` points to your challenge-service backend (e.g. `http://localhost:8082` or your gateway URL).

### Step 2: Verify the participation service
In `participation.service.ts`, ensure `getSonarResultsStatus` exists and calls the correct endpoint:

```typescript
getSonarResultsStatus(participationId: string): Observable<SonarResultsStatusResponse> {
  return this.http.get<SonarResultsStatusResponse>(
    `${this.baseUrl}/${participationId}/sonar-results/status`
  );
}
```

The response type should be:
```typescript
interface SonarResultsStatusResponse {
  status: string;  // "pending" | "completed"
  result: SonarResultResponse | null;
}
```

### Step 3: Fix the sonar-analysis component

**Critical checks in `sonar-analysis.component.ts`:**

1. **Initial load** – On 404 or error, switch to polling instead of showing a permanent error:
   - Use `catchError` to treat errors as `{ status: 'pending', result: null }`
   - Set `isWaitingForAnalysis = true` and call `startPolling()`

2. **Polling logic** – When polling receives `status === 'completed'` and `result`:
   - Call `applyResult(res.result)` to set `data`
   - Set `isWaitingForAnalysis = false`
   - Call `stopPolling$.next()` to stop the timer
   - Set `isLoading = false`

3. **Main content visibility** – The main report must show only when:
   - `!isLoading`
   - `!errorMessage`
   - `!isWaitingForAnalysis`
   - `data` is defined

   Template condition: `*ngIf="!isLoading && !errorMessage && !isWaitingForAnalysis && data"`

4. **Poll interval** – Use `timer(0, 10_000)` so the first poll runs immediately, then every 10 seconds.

5. **Cleanup** – In `ngOnDestroy`, complete both `destroy$` and `stopPolling$` to avoid leaks.

### Step 4: Debugging checklist

If the spinner still doesn’t stop:

1. **Check Network tab** – When polling, does `GET .../sonar-results/status` return 200 with `status: "completed"` and a non-null `result`?

2. **Check backend** – Does the backend scheduler run every 10 seconds and save SonarCloud results for SUBMITTED participations? Check backend logs for: `"SonarCloud pipeline finished for participation..."`.

3. **CORS** – Ensure the backend allows requests from the frontend origin (e.g. `http://localhost:4200`).

4. **Response shape** – Ensure the backend returns JSON like:
   ```json
   {
     "status": "completed",
     "result": {
       "id": "...",
       "qualityGateStatus": "OK",
       "bugs": 0,
       "codeSmells": 0,
       "vulnerabilities": 0,
       "securityHotspots": 0,
       "coverage": 85.5,
       "duplication": 2.1,
       "linesOfCode": 1500,
       "pullRequestKey": "123",
       "analyzedAt": "2025-03-01T12:00:00"
     }
   }
   ```

5. **Console errors** – Look for JavaScript/TypeScript errors that might prevent the success handler from running.

### Step 5: Fallback – use `getSonarResults` instead of status endpoint

If the status endpoint is unreliable, switch to polling `GET /participations/{id}/sonar-results` directly:
- **Success (200)**: Apply result and stop polling.
- **Error (404)**: Keep polling.

In that case, replace `getSonarResultsStatus` with `getSonarResults` in both the initial load and the polling `switchMap`, and handle success/error accordingly (no `status` field).

---

## Quick Reference: Expected Flow

1. User lands on analysis page → `loadSonarResults(participationId)` runs.
2. First request to `/sonar-results/status` (or `/sonar-results`).
3. If `status === 'completed'` (or 200 with data): apply result, hide spinner, show report.
4. If `status === 'pending'` (or 404): set `isWaitingForAnalysis = true`, start `timer(0, 10_000)`.
5. Every 10 seconds: call the API again.
6. When response has results: `applyResult()`, `isWaitingForAnalysis = false`, `stopPolling$.next()`, show report.
7. After 30 failed attempts: show error message and stop polling.
