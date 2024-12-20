import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';

const PasswordManager = dynamic(() => import('@/components/password-manager/PasswordManager'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function PasswordsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Password Manager</h1>
        
        <div className="bg-white rounded-lg shadow min-h-[calc(100vh-12rem)]">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <PasswordManager />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
