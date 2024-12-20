'use client';

import { useEffect, useState } from 'react';
import { FiFingerprint } from 'react-icons/fi';

const BiometricAuthentication: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticate = async () => {
    // Biometric authentication logic here
    setIsAuthenticated(true);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Biometric Authentication</h3>
      <button onClick={authenticate} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiFingerprint /> Authenticate
      </button>
      {isAuthenticated && <p className="mt-2 text-green-500">Authenticated successfully!</p>}
    </div>
  );
};

export default BiometricAuthentication;
