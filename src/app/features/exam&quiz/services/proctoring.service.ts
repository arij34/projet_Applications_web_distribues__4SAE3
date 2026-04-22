import { Injectable } from '@angular/core';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
// Import the full TF.js bundle so ALL WebGL kernels are registered before
// coco-ssd runs. face-api.js has been removed to eliminate the double-TF
// conflict ("Kernel 'Cast' not registered for backend 'webgl'").
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

import {
  FaceDetectionResult,
  HeadPoseDetectionResult,
  PhoneDetectionResult
} from '../models/proctoring.model';

@Injectable({
  providedIn: 'root'
})
export class ProctoringService {

  private cocoModel: cocoSsd.ObjectDetection | null = null;
  private faceMesh: FaceMesh | null = null;

  private modelsReady = false;
  private loadingPromise: Promise<void> | null = null;

  private faceMeshResolver: ((res: Results) => void) | null = null;

  private lastYaw = 0;
  private lastPitch = 0;
  private lastPoseTimestamp = 0;

  private noFaceStart: number | null = null;
  private lastPhoneDebugLogAt = 0;
  private lastFaceDebugLogAt = 0;

  // ===============================
  // INIT MODELS (SAFE LOADING)
  // ===============================
  async initializeModels(): Promise<void> {
    if (this.modelsReady) return;

    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {

      // Ensure all TF.js WebGL kernels are registered before loading models.
      await tf.setBackend('webgl');
      await tf.ready();

      // Load COCO SSD — handles both phone detection AND person counting.
      this.cocoModel = await cocoSsd.load({
        base: 'mobilenet_v1'
      });

      // Init FaceMesh
      this.faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      // REGISTER ONCE (IMPORTANT FIX)
      this.faceMesh.onResults((results: Results) => {
        if (this.faceMeshResolver) {
          this.faceMeshResolver(results);
          this.faceMeshResolver = null;
        }
      });

      this.modelsReady = true;
    })();

    return this.loadingPromise;
  }

  // ===============================
  // PHONE DETECTION 📱
  // ===============================
  async detectPhone(video: HTMLVideoElement): Promise<PhoneDetectionResult> {
    if (!this.cocoModel) return { detected: false, confidence: 0 };

    const predictions = await this.cocoModel.detect(video, 30, 0.15);

    const frameArea = Math.max(video.videoWidth * video.videoHeight, 1);
    // Keep a relative area threshold so detection still works at lower webcam resolutions.
    const minPhoneArea = Math.max(frameArea * 0.0035, 280);

    const phone = predictions
      .filter(p =>
        (p.class === 'cell phone' || p.class === 'mobile phone' || p.class === 'phone') &&
        p.score > 0.2 &&
        (p.bbox[2] * p.bbox[3]) > minPhoneArea
      )
      .sort((a, b) => b.score - a.score)[0];

    if (!phone) {
      const now = Date.now();
      if (now - this.lastPhoneDebugLogAt > 5000 && predictions.length > 0) {
        const topPredictions = [...predictions]
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((p) => `${p.class}:${p.score.toFixed(2)}`)
          .join(', ');
        console.debug(`[Proctoring] No phone detected. Top classes: ${topPredictions}`);
        this.lastPhoneDebugLogAt = now;
      }
      return { detected: false, confidence: 0 };
    }

    return {
      detected: true,
      confidence: phone.score
    };
  }

  // ===============================
  // FACE DETECTION 👥
  // Uses coco-ssd 'person' class — same model already loaded for phone detection,
  // so no extra TF.js conflict.
  // ===============================
  async detectFaces(video: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!this.cocoModel) return { faceCount: 0, multiplePeople: false, noFace: true };

    const predictions = await this.cocoModel.detect(video, 10, 0.35);

    const persons = predictions.filter(
      (p) => p.class === 'person' && p.score > 0.4
    );

    const faceCount = persons.length;

    const now = Date.now();
    if (now - this.lastFaceDebugLogAt > 3000) {
      console.debug(`[Proctoring] faceCount=${faceCount} (person detections)`);
      this.lastFaceDebugLogAt = now;
    }

    return {
      faceCount,
      multiplePeople: faceCount > 1,
      noFace: faceCount === 0
    };
  }

  // ===============================
  // HEAD POSE 👀
  // ===============================
  async detectHeadPose(video: HTMLVideoElement): Promise<HeadPoseDetectionResult> {
    if (!this.faceMesh) {
      return this.emptyPose();
    }

    const result = await this.runFaceMesh(video);

    if (!result.multiFaceLandmarks || result.multiFaceLandmarks.length === 0) {
      return this.handleNoFace();
    }

    this.noFaceStart = null;

    const landmarks = result.multiFaceLandmarks[0];

    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const chin = landmarks[152];

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeMidY = (leftEye.y + rightEye.y) / 2;

    const eyeDistance = Math.max(Math.abs(rightEye.x - leftEye.x), 0.0001);

    const yaw = (nose.x - eyeMidX) / eyeDistance;
    const pitch = (nose.y - eyeMidY) / Math.max(Math.abs(chin.y - eyeMidY), 0.0001);

    // Movement detection
    const now = Date.now();
    const dt = Math.max((now - this.lastPoseTimestamp) / 1000, 0.001);

    const yawVelocity = Math.abs(yaw - this.lastYaw) / dt;
    const pitchVelocity = Math.abs(pitch - this.lastPitch) / dt;

    this.lastYaw = yaw;
    this.lastPitch = pitch;
    this.lastPoseTimestamp = now;

    const lookingAway = Math.abs(yaw) > 0.45 || Math.abs(pitch) > 0.4;
    const suspiciousMovement = yawVelocity > 2.5 || pitchVelocity > 2.5;

    return {
      facePresent: true,
      yaw,
      pitch,
      lookingAway,
      suspiciousMovement
    };
  }

  // ===============================
  // HANDLE NO FACE ⛔
  // ===============================
  private handleNoFace(): HeadPoseDetectionResult {
    if (!this.noFaceStart) {
      this.noFaceStart = Date.now();
    }

    const duration = Date.now() - this.noFaceStart;

    const result: HeadPoseDetectionResult = {
      facePresent: false,
      yaw: 0,
      pitch: 0,
      lookingAway: false,
      suspiciousMovement: false
    };

    (result as HeadPoseDetectionResult & { noFaceDuration: number }).noFaceDuration = duration;

    return result;
  }

  private emptyPose(): HeadPoseDetectionResult {
    return {
      facePresent: false,
      yaw: 0,
      pitch: 0,
      lookingAway: false,
      suspiciousMovement: false
    };
  }

  // ===============================
  // FACE MESH RUNNER (FIXED)
  // ===============================
  private runFaceMesh(video: HTMLVideoElement): Promise<Results> {
    return new Promise<Results>((resolve, reject) => {
      if (!this.faceMesh) {
        reject(new Error('FaceMesh not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        this.faceMeshResolver = null;
        reject(new Error('FaceMesh timeout'));
      }, 1800);

      this.faceMeshResolver = (results: Results) => {
        clearTimeout(timeout);
        resolve(results);
      };

      this.faceMesh.send({ image: video }).catch((error: unknown) => {
        clearTimeout(timeout);
        this.faceMeshResolver = null;
        reject(error);
      });
    });
  }

  // ===============================
  // CLEANUP 🧹
  // ===============================
  async destroy(): Promise<void> {
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }

    await tf.disposeVariables();

    this.modelsReady = false;
    this.loadingPromise = null;
    this.faceMeshResolver = null;
  }
}