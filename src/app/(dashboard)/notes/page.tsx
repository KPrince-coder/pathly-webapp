"use client";

import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { Plus } from 'react-feather';

const NoteList = dynamic(() => import('@/components/notes/NoteList'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

const NoteEditor = dynamic(() => import('@/components/notes/NoteEditor'), {
  ssr: false,
});

export default function NotesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <button
            onClick={() => {
              // Handle new note creation
              const newNoteEvent = new CustomEvent('create-new-note');
              window.dispatchEvent(newNoteEvent);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Note
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <NoteList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
