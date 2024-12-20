'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { FiFingerprint, FiCamera, FiShield } from 'react-icons/fi';
import * as faceapi from 'face-api.js';

interface BiometricAuthProps {
  onAuthSuccess: () => void;
  onAuthFailure: () => void;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({ onAuthSuccess, onAuthFailure }) => {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [isFaceIdSupported, setIsFaceIdSupported] = useState(false);
  const [isFingerPrintSupported, setIsFingerPrintSupported] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [facialModel, setFacialModel] = useState<faceapi.FaceLandmarks68 | null>(null);

  useEffect(() => {
    checkBiometricSupport();
    loadFaceDetectionModels();
  }, []);

  const checkBiometricSupport = async () => {
    if ('FaceDetector' in window) {
      setIsFaceIdSupported(true);
    }

    if ('PublicKeyCredential' in window) {
      try {
        const available = await (navigator as any).credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            allowCredentials: []
          }
        });
        setIsFingerPrintSupported(!!available);
      } catch (error) {
        console.error('Error checking fingerprint support:', error);
      }
    }
  };

  const loadFaceDetectionModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
    } catch (error) {
      console.error('Error loading face detection models:', error);
    }
  };

  const startFaceAuthentication = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef) {
        videoRef.srcObject = stream;
        await new Promise(resolve => videoRef.onloadedmetadata = resolve);
        await authenticateWithFaceId();
      }
    } catch (error) {
      console.error('Error starting face authentication:', error);
      onAuthFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithFaceId = async () => {
    if (!videoRef) return;

    try {
      const detection = await faceapi.detectSingleFace(videoRef, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detection) {
        // Get stored facial landmarks from database
        const { data: storedModel } = await supabase
          .from('biometric_data')
          .select('facial_model')
          .single();

        if (storedModel) {
          const similarity = faceapi.euclideanDistance(
            detection.landmarks.positions,
            storedModel.facial_model
          );

          if (similarity < 0.6) { // Threshold for matching
            await logSecurityEvent('face_auth_success');
            onAuthSuccess();
          } else {
            await logSecurityEvent('face_auth_failure');
            onAuthFailure();
          }
        }
      }
    } catch (error) {
      console.error('Error during face authentication:', error);
      onAuthFailure();
    }
  };

  const startFingerprintAuthentication = async () => {
    setIsLoading(true);
    try {
      const credential = await (navigator as any).credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          allowCredentials: [],
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (credential) {
        await logSecurityEvent('fingerprint_auth_success');
        onAuthSuccess();
      } else {
        await logSecurityEvent('fingerprint_auth_failure');
        onAuthFailure();
      }
    } catch (error) {
      console.error('Error during fingerprint authentication:', error);
      onAuthFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const logSecurityEvent = async (eventType: string) => {
    await supabase.from('security_events').insert({
      event_type: eventType,
      severity: 'medium',
      details: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <FiShield className="mr-2" />
        Biometric Authentication
      </h2>

      <div className="space-y-4">
        {isFaceIdSupported && (
          <button
            onClick={startFaceAuthentication}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <FiCamera className="mr-2" />
            {isLoading ? 'Authenticating...' : 'Use Face ID'}
          </button>
        )}

        {isFingerPrintSupported && (
          <button
            onClick={startFingerprintAuthentication}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <FiFingerprint className="mr-2" />
            {isLoading ? 'Authenticating...' : 'Use Fingerprint'}
          </button>
        )}

        {!isFaceIdSupported && !isFingerPrintSupported && (
          <p className="text-center text-gray-500">
            Biometric authentication is not supported on this device.
          </p>
        )}
      </div>

      {isFaceIdSupported && (
        <div className="mt-4">
          <video
            ref={ref => setVideoRef(ref)}
            autoPlay
            muted
            className="w-full rounded-lg"
            style={{ display: isLoading ? 'block' : 'none' }}
          />
        </div>
      )}
    </div>
  );
};

export default BiometricAuth;
