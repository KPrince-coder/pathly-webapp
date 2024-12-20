'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
import useFeatureStore from '@/store/features';
import Webcam from 'react-webcam';

const HealthMonitor: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    posture,
    eyeStrain,
    mood,
    checkPosture,
    trackScreenTime,
    updateMood,
    getWellnessReport
  } = useFeatureStore();

  // Initialize face detection and posture analysis
  useEffect(() => {
    const initModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        tf.loadLayersModel('/models/posture-detection/model.json')
      ]);
    };

    initModels();
  }, []);

  // Real-time posture detection
  useEffect(() => {
    const detectPosture = async () => {
      if (!webcamRef.current || !canvasRef.current) return;

      const video = webcamRef.current.video;
      if (!video) return;

      // Get video dimensions
      const { videoWidth, videoHeight } = video;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Detect face landmarks
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detection) {
        // Analyze head position and posture
        const headPose = detection.landmarks.getNose();
        const shoulderLine = detection.landmarks.getJawline();

        // Calculate posture angles
        const postureAnalysis = await analyzePosture(headPose, shoulderLine);
        
        // Update posture state
        if (postureAnalysis.isCorrect !== posture.isCorrect) {
          checkPosture();
        }

        // Draw feedback
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawPostureGuides(ctx, detection);
        }
      }
    };

    const interval = setInterval(detectPosture, 1000);
    return () => clearInterval(interval);
  }, []);

  // Screen time tracking
  useEffect(() => {
    const interval = setInterval(trackScreenTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Mood tracking with face expression analysis
  const analyzeMood = async () => {
    if (!webcamRef.current?.video) return;

    const detection = await faceapi
      .detectSingleFace(webcamRef.current.video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detection) {
      const dominantExpression = Object.entries(detection.expressions)
        .reduce((prev, curr) => (curr[1] > prev[1] ? curr : prev))[0];
      
      updateMood(dominantExpression);
    }
  };

  // Helper function to analyze posture
  const analyzePosture = async (headPose: any, shoulderLine: any) => {
    // Use TensorFlow.js model to analyze posture
    const input = tf.tensor2d([
      [
        headPose.x, headPose.y,
        shoulderLine[0].x, shoulderLine[0].y,
        shoulderLine[shoulderLine.length - 1].x, shoulderLine[shoulderLine.length - 1].y
      ]
    ]);

    const prediction = await tf.loadLayersModel('/models/posture-detection/model.json');
    const result = prediction.predict(input);
    
    return {
      isCorrect: result.dataSync()[0] > 0.5,
      confidence: result.dataSync()[0]
    };
  };

  // Helper function to draw posture guides
  const drawPostureGuides = (ctx: CanvasRenderingContext2D, detection: any) => {
    // Draw face landmarks
    faceapi.draw.drawFaceLandmarks(canvasRef.current!, detection);

    // Draw posture guidelines
    ctx.strokeStyle = posture.isCorrect ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;

    const landmarks = detection.landmarks.positions;
    
    // Draw vertical alignment line
    ctx.beginPath();
    ctx.moveTo(landmarks[30].x, 0);
    ctx.lineTo(landmarks[30].x, canvasRef.current!.height);
    ctx.stroke();

    // Draw shoulder alignment line
    ctx.beginPath();
    ctx.moveTo(0, (landmarks[2].y + landmarks[14].y) / 2);
    ctx.lineTo(canvasRef.current!.width, (landmarks[2].y + landmarks[14].y) / 2);
    ctx.stroke();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80">
      {/* Webcam feed for posture detection */}
      <div className="relative mb-4 rounded-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          className="w-full"
          mirrored
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
        />
      </div>

      {/* Health metrics */}
      <div className="space-y-4">
        {/* Posture indicator */}
        <motion.div
          className={`p-2 rounded-lg ${
            posture.isCorrect ? 'bg-green-100' : 'bg-red-100'
          }`}
          animate={{
            scale: posture.isCorrect ? 1 : [1, 1.05, 1],
          }}
          transition={{
            repeat: posture.isCorrect ? 0 : Infinity,
            duration: 2,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">Posture</span>
            <span className={posture.isCorrect ? 'text-green-600' : 'text-red-600'}>
              {posture.isCorrect ? 'Good' : 'Need adjustment'}
            </span>
          </div>
        </motion.div>

        {/* Screen time */}
        <div className="p-2 rounded-lg bg-blue-100">
          <div className="flex items-center justify-between">
            <span className="font-medium">Screen Time</span>
            <span className="text-blue-600">
              {Math.floor(eyeStrain.screenTime / 60)}h {eyeStrain.screenTime % 60}m
            </span>
          </div>
          <div className="mt-1 text-sm text-blue-600">
            Last break: {new Date(eyeStrain.lastBreak).toLocaleTimeString()}
          </div>
        </div>

        {/* Mood tracker */}
        <div className="p-2 rounded-lg bg-purple-100">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Mood</span>
            <span className="text-purple-600 capitalize">{mood.current}</span>
          </div>
          <div className="mt-2">
            <Line
              data={{
                labels: mood.history.slice(-7).map(h => 
                  new Date(h.timestamp).toLocaleDateString()
                ),
                datasets: [{
                  label: 'Mood History',
                  data: mood.history.slice(-7).map(h => {
                    switch (h.mood) {
                      case 'happy': return 1;
                      case 'neutral': return 0;
                      case 'sad': return -1;
                      default: return 0;
                    }
                  }),
                  borderColor: '#9333ea',
                  tension: 0.4,
                }]
              }}
              options={{
                responsive: true,
                scales: {
                  y: {
                    min: -1,
                    max: 1,
                    ticks: {
                      callback: value => {
                        switch (value) {
                          case 1: return 'Happy';
                          case 0: return 'Neutral';
                          case -1: return 'Sad';
                          default: return '';
                        }
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Break reminder */}
      <AnimatePresence>
        {eyeStrain.screenTime > 50 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-2 bg-yellow-100 rounded-lg"
          >
            <div className="flex items-center justify-between text-yellow-800">
              <span>Time for a break! 👀</span>
              <button
                onClick={() => {
                  // Reset last break time
                  trackScreenTime();
                }}
                className="px-2 py-1 bg-yellow-200 rounded hover:bg-yellow-300"
              >
                Take Break
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HealthMonitor;
