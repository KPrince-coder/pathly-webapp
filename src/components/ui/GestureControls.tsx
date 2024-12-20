'use client';

import { useEffect } from 'react';
import { FiTouch } from 'react-icons/fi';

const GestureControls: React.FC = () => {
  useEffect(() => {
    const handleGesture = (event: TouchEvent) => {
      // Logic to handle touch gestures
      console.log('Gesture detected:', event);
    };

    window.addEventListener('touchstart', handleGesture);
    return () => {
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Gesture Controls</h3>
      <p className="mt-2"><FiTouch /> Use gestures for quick actions.</p>
    </div>
  );
};

export default GestureControls;
