'use client';

import { useState, useRef, useEffect } from 'react';
import { useFeatureStore } from '@/store/features';
import { FiMic, FiStop, FiPlay, FiPause, FiDownload } from 'react-icons/fi';

interface Transcript {
  text: string;
  timestamp: number;
  speaker?: string;
}

const SmartMeetingNotes: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { openaiApiKey } = useFeatureStore();

  useEffect(() => {
    // Request microphone permissions
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder.current = new MediaRecorder(stream);
        
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };

        mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
          setAudioBlob(audioBlob);
          await transcribeAudio(audioBlob);
        };
      })
      .catch(err => console.error('Error accessing microphone:', err));

    return () => {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop();
      }
    };
  }, []);

  const startRecording = () => {
    audioChunks.current = [];
    mediaRecorder.current?.start();
    setIsRecording(true);
    setIsPaused(false);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    mediaRecorder.current?.pause();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    mediaRecorder.current?.resume();
    setIsPaused(false);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: formData
      });

      const data = await response.json();
      
      // Process transcription with GPT for summary and action items
      const completion = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'Analyze this meeting transcript and provide: 1) A concise summary 2) A list of action items'
          }, {
            role: 'user',
            content: data.text
          }]
        })
      });

      const analysis = await completion.json();
      const [summary, actionItemsText] = analysis.choices[0].message.content.split('\n\nAction Items:');
      
      setTranscripts([{ text: data.text, timestamp: Date.now() }]);
      setSummary(summary.replace('Summary:', '').trim());
      setActionItems(actionItemsText.split('\n').filter(item => item.trim()));
      
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const downloadTranscript = () => {
    if (!transcripts.length) return;
    
    const content = `
Meeting Summary
--------------
${summary}

Action Items
-----------
${actionItems.map(item => `- ${item}`).join('\n')}

Full Transcript
-------------
${transcripts.map(t => t.text).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-notes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-center space-x-4 mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <FiMic className="mr-2" />
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={stopRecording}
              className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <FiStop className="mr-2" />
              Stop
            </button>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {isPaused ? <FiPlay className="mr-2" /> : <FiPause className="mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </>
        )}
      </div>

      {summary && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Summary</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{summary}</p>
        </div>
      )}

      {actionItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Action Items</h3>
          <ul className="list-disc list-inside space-y-2">
            {actionItems.map((item, index) => (
              <li key={index} className="text-gray-700">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {transcripts.length > 0 && (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Transcript</h3>
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              {transcripts.map((t, i) => (
                <p key={i} className="mb-2">{t.text}</p>
              ))}
            </div>
          </div>

          <button
            onClick={downloadTranscript}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <FiDownload className="mr-2" />
            Download Notes
          </button>
        </>
      )}
    </div>
  );
};

export default SmartMeetingNotes;
