# Webcam Proctoring Module

## Added Files

- models/proctoring.model.ts
- services/proctoring.service.ts
- services/violation.service.ts
- components/webcam-monitor/webcam-monitor.component.ts
- components/webcam-monitor/webcam-monitor.component.html
- components/webcam-monitor/webcam-monitor.component.css

## Install Notes

Dependencies were added to package.json and installed:

- @tensorflow-models/coco-ssd
- @tensorflow/tfjs-core
- @tensorflow/tfjs-backend-webgl
- @mediapipe/face_mesh
- face-api.js

## Face-API Models

Place face-api TinyFaceDetector model files under:

- /assets/models/face-api

Expected files typically include:

- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1

## Usage Example

Use the component inside an exam page template:

```html
<app-webcam-monitor
  [examId]="examId"
  [attemptId]="attemptId"
  [userId]="userId"
  [detectionIntervalMs]="2000"
  [noFaceTimeoutMs]="5000"
  [requireFullscreen]="true"
  (violationDetected)="onProctoringViolation($event)">
</app-webcam-monitor>
```

## Violation Endpoint

Violations are reported to:

- POST /api/proctoring/violations

## Detection Coverage

- Phone detection via COCO-SSD (cell phone class)
- Multiple people via face-api face counting
- Looking away via MediaPipe FaceMesh yaw/pitch
- No face timeout (>5s)
- Suspicious rapid head movement
- Tab switch and fullscreen exit listeners
