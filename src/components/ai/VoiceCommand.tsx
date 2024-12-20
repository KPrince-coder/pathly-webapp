'use client';

import { useEffect, useState } from 'react';
import { useFeatureStore } from '@/store/features';
import { FiMic, FiMicOff } from 'react-icons/fi';

const VoiceCommand: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { openaiApiKey } = useFeatureStore();

  useEffect(() => {
    const handleVoiceCommands = async (event: SpeechRecognitionEvent) => {
      const command = event.results[0][0].transcript;
      setTranscript(command);
      switch (command.toLowerCase()) {
        case 'summarize note':
          // Call the summarization function
          console.log('Triggering note summarization...');
          break;
        case 'recommend content':
          // Call the content recommendation function
          console.log('Triggering content recommendations...');
          break;
        case 'open task list':
          // Logic to open task list
          console.log('Opening task list...');
          break;
        // Add more commands as needed
        default:
          console.log('Command not recognized.');
          break;
      }
    };

    const startListening = () => {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.onresult = handleVoiceCommands;
      recognition.start();
      setIsListening(true);

      recognition.onend = () => {
        setIsListening(false);
      };
    };

    if (isListening) {
      startListening();
    }

    return () => {
      // Cleanup if needed
    };
  }, [isListening]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Voice Command Integration</h3>
      <button
        onClick={() => setIsListening(!isListening)}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2"
      >
        {isListening ? <FiMicOff /> : <FiMic />}
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      {transcript && (
        <div className="mt-4">
          <h4 className="font-medium">Transcript:</h4>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceCommand;
