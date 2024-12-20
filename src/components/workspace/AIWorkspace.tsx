'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useGesture } from 'react-use-gesture';
import useFeatureStore from '@/store/features';
import Webcam from 'react-webcam';
import dynamic from 'next/dynamic';

const ForceGraph = dynamic(() => import('react-force-graph'), { ssr: false });

interface Note {
  id: string;
  content: string;
  position: [number, number, number];
  color: string;
  tags: string[];
  connections: string[];
}

const AIWorkspace: React.FC = () => {
  const {
    vrEnabled,
    arEnabled,
    spatialNotes,
    voiceCommands,
    focusModeActive,
    posture,
    toggleVR,
    toggleAR,
    checkPosture,
    generateSummary,
    buildKnowledgeGraph,
  } = useFeatureStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize workspace
  useEffect(() => {
    const init = async () => {
      // Start posture detection
      const postureInterval = setInterval(checkPosture, 30000);
      
      // Initialize knowledge graph
      await buildKnowledgeGraph(notes);

      return () => clearInterval(postureInterval);
    };

    init();
  }, []);

  // Handle gestures
  const bind = useGesture({
    onDrag: ({ movement: [x, y] }) => {
      if (activeNote) {
        // Update note position
      }
    },
    onPinch: ({ offset: [d] }) => {
      if (activeNote) {
        // Handle zoom
      }
    },
  });

  // Render 3D environment
  const renderEnvironment = () => (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls />
      <Environment preset="sunset" />
      {spatialNotes.map((note) => (
        <Note key={note.id} {...note} />
      ))}
    </Canvas>
  );

  // Render knowledge graph
  const renderKnowledgeGraph = () => (
    <ForceGraph
      graphData={graphData}
      nodeAutoColorBy="group"
      nodeThreeObject={(node: any) => {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ color: node.color })
        );
        sprite.scale.set(12, 12, 1);
        return sprite;
      }}
    />
  );

  // Render AR overlay
  const renderAROverlay = () => (
    <div className="absolute inset-0 pointer-events-none">
      <Webcam
        ref={webcamRef}
        className="w-full h-full object-cover"
        mirrored
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
    </div>
  );

  return (
    <div className="relative w-full h-screen">
      {/* Main workspace */}
      <motion.div
        className={`w-full h-full ${focusModeActive ? 'bg-gray-900' : 'bg-white'}`}
        animate={{
          opacity: focusModeActive ? 0.9 : 1,
        }}
      >
        {/* 3D/VR/AR Environment */}
        {(vrEnabled || arEnabled) && (
          <div className="absolute inset-0">
            {vrEnabled && renderEnvironment()}
            {arEnabled && renderAROverlay()}
          </div>
        )}

        {/* Knowledge Graph */}
        <div className="absolute inset-0 pointer-events-none">
          {graphData && renderKnowledgeGraph()}
        </div>

        {/* Notes Container */}
        <div className="relative z-10 p-4">
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                className="bg-white rounded-lg shadow-lg p-4 mb-4"
                style={{
                  backgroundColor: note.color,
                }}
                layoutId={note.id}
                {...bind()}
              >
                <div className="prose">{note.content}</div>
                <div className="flex gap-2 mt-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-black/10 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Health Indicators */}
        <div className="absolute bottom-4 right-4 flex items-center gap-4">
          <motion.div
            className={`p-2 rounded-full ${
              posture.isCorrect ? 'bg-green-500' : 'bg-red-500'
            }`}
            animate={{
              scale: posture.isCorrect ? 1 : 1.2,
            }}
          >
            👤
          </motion.div>
        </div>

        {/* Voice Command Indicator */}
        {voiceCommands && (
          <motion.div
            className="absolute top-4 right-4 p-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
            }}
          >
            🎤
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Note component for 3D environment
const Note: React.FC<Note> = ({ position, content, color }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default AIWorkspace;
