'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { Camera } from 'react-webcam';
import { AES, enc } from 'crypto-js';
import zxcvbn from 'zxcvbn';
import useFeatureStore from '@/store/features';
import {
  FiLock,
  FiUnlock,
  FiEye,
  FiEyeOff,
  FiFingerprint,
  FiShield,
  FiAlertTriangle,
  FiRefreshCw,
} from 'react-icons/fi';

interface VaultItem {
  id: string;
  type: 'password' | 'note' | 'card' | 'document';
  title: string;
  encryptedData: string;
  metadata: {
    website?: string;
    username?: string;
    lastUsed: Date;
    strengthScore: number;
    tags: string[];
    icon?: string;
  };
}

const BiometricVault: React.FC = () => {
  const webcamRef = useRef<Camera>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [faceMatched, setFaceMatched] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [biometricKey, setBiometricKey] = useState<string | null>(null);

  const {
    biometricEnabled,
    securityScore,
    breachAlerts,
    enableBiometric,
    calculateSecurityScore,
    checkBreaches,
  } = useFeatureStore();

  // Initialize face recognition
  useEffect(() => {
    const initFaceApi = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
    };

    initFaceApi();
  }, []);

  // Continuous face verification
  useEffect(() => {
    if (!isUnlocked || !webcamRef.current) return;

    const verifyFace = async () => {
      if (!webcamRef.current?.video) return;

      const detection = await faceapi
        .detectSingleFace(webcamRef.current.video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        // Compare with stored face descriptor
        const match = await compareFaceDescriptors(detection.descriptor);
        setFaceMatched(match);
        
        if (!match) {
          // Auto-lock if face doesn't match
          setIsUnlocked(false);
        }
      }
    };

    const interval = setInterval(verifyFace, 5000);
    return () => clearInterval(interval);
  }, [isUnlocked]);

  // Password strength monitoring
  useEffect(() => {
    const analyzePasswords = () => {
      let totalScore = 0;
      
      vaultItems.forEach(item => {
        if (item.type === 'password') {
          const decrypted = decryptData(item.encryptedData);
          const strength = zxcvbn(decrypted);
          totalScore += strength.score;
        }
      });

      calculateSecurityScore();
    };

    analyzePasswords();
  }, [vaultItems]);

  // Breach monitoring
  useEffect(() => {
    const checkForBreaches = async () => {
      await checkBreaches();
    };

    const interval = setInterval(checkForBreaches, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, []);

  // Biometric authentication
  const authenticateWithBiometrics = async () => {
    if (!webcamRef.current?.video) return;

    const detection = await faceapi
      .detectSingleFace(webcamRef.current.video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const match = await compareFaceDescriptors(detection.descriptor);
      if (match) {
        setIsUnlocked(true);
        setFaceMatched(true);
        // Generate encryption key from biometric data
        const key = generateBiometricKey(detection.descriptor);
        setBiometricKey(key);
      }
    }
  };

  // Helper functions
  const compareFaceDescriptors = async (descriptor: Float32Array) => {
    // Compare with stored descriptor
    return true; // Implement actual comparison
  };

  const generateBiometricKey = (descriptor: Float32Array) => {
    // Generate encryption key from biometric data
    return Array.from(descriptor).join(',');
  };

  const encryptData = (data: string) => {
    if (!biometricKey) return '';
    return AES.encrypt(data, biometricKey).toString();
  };

  const decryptData = (encryptedData: string) => {
    if (!biometricKey) return '';
    const bytes = AES.decrypt(encryptedData, biometricKey);
    return bytes.toString(enc.Utf8);
  };

  const addVaultItem = (item: Omit<VaultItem, 'id' | 'encryptedData'>) => {
    const id = crypto.randomUUID();
    const encryptedData = encryptData(item.title);
    
    setVaultItems(prev => [...prev, {
      ...item,
      id,
      encryptedData,
    }]);
  };

  const generatePassword = (options: {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  }) => {
    const chars = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    let availableChars = '';
    if (options.uppercase) availableChars += chars.uppercase;
    if (options.lowercase) availableChars += chars.lowercase;
    if (options.numbers) availableChars += chars.numbers;
    if (options.symbols) availableChars += chars.symbols;

    let password = '';
    for (let i = 0; i < options.length; i++) {
      password += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
    }

    return password;
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Biometric Authentication */}
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-8 max-w-md w-full"
            >
              <div className="text-center mb-8">
                <FiFingerprint className="w-16 h-16 mx-auto text-blue-500 mb-4" />
                <h2 className="text-2xl font-bold">Biometric Authentication</h2>
                <p className="text-gray-600 mt-2">
                  Look at the camera to unlock your vault
                </p>
              </div>

              <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
                <Camera
                  ref={webcamRef}
                  className="w-full h-full object-cover"
                  mirrored
                />
                {faceMatched && (
                  <motion.div
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
                  >
                    <FiShield className="w-16 h-16 text-green-500" />
                  </motion.div>
                )}
              </div>

              <button
                onClick={authenticateWithBiometrics}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <FiUnlock className="w-5 h-5" />
                Authenticate
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Vault Interface */}
      {isUnlocked && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Security Score</h3>
                <div className={`text-2xl font-bold ${
                  securityScore > 80 ? 'text-green-500' :
                  securityScore > 60 ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {securityScore}%
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    securityScore > 80 ? 'bg-green-500' :
                    securityScore > 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
              <div className="space-y-2">
                {/* Add session information */}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
              <div className="space-y-2">
                {breachAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <FiAlertTriangle className="w-4 h-4" />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vault Items */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Secure Vault</h2>
                <button
                  onClick={() => {/* Add new item */}}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Item
                </button>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vault..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="divide-y">
              {vaultItems
                .filter(item => 
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.metadata.tags.some(tag => 
                    tag.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                )
                .map(item => (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        {item.metadata.website && (
                          <p className="text-sm text-gray-600">
                            {item.metadata.website}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.type === 'password' && (
                          <>
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-2 hover:bg-gray-200 rounded-full"
                            >
                              {showPassword ? (
                                <FiEyeOff className="w-4 h-4" />
                              ) : (
                                <FiEye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {/* Copy password */}}
                              className="p-2 hover:bg-gray-200 rounded-full"
                            >
                              Copy
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricVault;
