import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { HexColorPicker } from 'react-colorful';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase, useSupabaseUser } from '@/hooks/useSupabase';
import { toast } from 'react-hot-toast';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  Share2,
  Tag,
  Folder,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  Download,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Clock,
  Edit3,
  Palette,
} from 'react-feather';
import { format } from 'date-fns';

const COLORS = [
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#ff8000',
  '#8000ff',
  '#0080ff',
  '#ff0080',
];

interface NoteEditorProps {
  initialNote?: {
    id: string;
    title: string;
    content: string;
    is_encrypted: boolean;
    privacy_level: 'public' | 'private' | 'shared' | 'password_protected';
    tags: string[];
    folder_id?: string;
    color: string;
    media_files: any[];
    voice_note_url?: string;
    created_at: string;
    updated_at: string;
  };
  onSave?: (note: any) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ initialNote, onSave }) => {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [isEncrypted, setIsEncrypted] = useState(initialNote?.is_encrypted || false);
  const [password, setPassword] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState(initialNote?.privacy_level || 'private');
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [noteColor, setNoteColor] = useState(initialNote?.color || '#ffffff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>(initialNote?.media_files || []);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(initialNote?.voice_note_url);
  const [showTimestamp, setShowTimestamp] = useState(true);

  const supabase = useSupabase();
  const user = useSupabaseUser();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Color,
      Highlight,
    ],
    content: initialNote?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (transcript) {
      editor?.commands.insertContent(transcript);
    }
  }, [transcript]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const noteData = {
        title,
        content: editor?.getHTML(),
        is_encrypted: isEncrypted,
        privacy_level: privacyLevel,
        tags,
        color: noteColor,
        media_files: mediaFiles,
        voice_note_url: audioUrl,
        user_id: user.id,
        ...(isEncrypted && password && { password_hash: password }),
      };

      if (initialNote?.id) {
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', initialNote.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([noteData]);

        if (error) throw error;
      }

      toast.success('Note saved successfully!');
      onSave?.(noteData);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEncryption = () => {
    if (!isEncrypted) {
      setShowPassword(true);
    } else {
      setIsEncrypted(false);
      setPassword('');
    }
  };

  const handlePasswordSubmit = () => {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsEncrypted(true);
    setShowPassword(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/notes/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('note-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('note-media')
        .getPublicUrl(filePath);

      editor?.commands.insertContent(`<img src="${publicUrl}" alt="${file.name}" />`);
      setMediaFiles([...mediaFiles, { type: 'image', url: publicUrl }]);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const startRecording = () => {
    if (browserSupportsSpeechRecognition) {
      setIsRecording(true);
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    } else {
      toast.error('Your browser does not support speech recognition');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    SpeechRecognition.stopListening();
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('note-content');
      if (!element) return;

      const canvas = await html2canvas(element);
      const pdf = new jsPDF();
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      
      pdf.save(`${title || 'note'}.pdf`);
      toast.success('Note exported to PDF');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export note');
    }
  };

  const playVoiceNote = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4" style={{ backgroundColor: noteColor }}>
      <div className="flex items-center space-x-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="flex-1 text-2xl font-bold border-none focus:outline-none bg-transparent"
        />
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Change note color"
          >
            <Palette className="w-5 h-5" />
          </motion.button>

          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-lg"
              >
                <HexColorPicker color={noteColor} onChange={setNoteColor} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNoteColor(color)}
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleEncryption}
            className="p-2 rounded-full hover:bg-gray-100"
            title={isEncrypted ? 'Encrypted' : 'Not encrypted'}
          >
            {isEncrypted ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPrivacyLevel(privacyLevel === 'private' ? 'public' : 'private')}
            className="p-2 rounded-full hover:bg-gray-100"
            title={privacyLevel === 'private' ? 'Private' : 'Public'}
          >
            {privacyLevel === 'private' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving}
            className={`p-2 rounded-full hover:bg-gray-100 ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToPDF}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Export to PDF"
          >
            <Download className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {showPassword && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to encrypt note..."
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handlePasswordSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Set Password
          </button>
        </motion.div>
      )}

      <div className="flex items-center space-x-2 border-b pb-2">
        <Tag className="w-4 h-4" />
        <input
          type="text"
          placeholder="Add tags..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              setTags([...tags, e.currentTarget.value]);
              e.currentTarget.value = '';
            }
          }}
          className="flex-1 p-1 text-sm border-none focus:outline-none"
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-sm bg-gray-100 rounded-full"
            >
              {tag}
              <button
                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border-b pb-2 flex items-center space-x-2">
        <button
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <Redo className="w-4 h-4" />
        </button>
        <div className="h-6 w-px bg-gray-200" />
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-2 hover:bg-gray-100 rounded ${
            editor?.isActive('bold') ? 'bg-gray-200' : ''
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-2 hover:bg-gray-100 rounded ${
            editor?.isActive('italic') ? 'bg-gray-200' : ''
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`p-2 hover:bg-gray-100 rounded ${
            editor?.isActive('underline') ? 'bg-gray-200' : ''
          }`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <div className="h-6 w-px bg-gray-200" />
        <button
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          className={`p-2 hover:bg-gray-100 rounded ${
            editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
          }`}
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          className={`p-2 hover:bg-gray-100 rounded ${
            editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
          }`}
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          className={`p-2 hover:bg-gray-100 rounded ${
            editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
          }`}
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <div className="h-6 w-px bg-gray-200" />
        <button
          onClick={() => mediaInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
        />
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 hover:bg-gray-100 rounded ${isRecording ? 'text-red-500' : ''}`}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        {audioUrl && (
          <button
            onClick={playVoiceNote}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {showTimestamp && (
        <div className="text-xs text-gray-500 flex items-center space-x-4">
          <span>Created: {format(new Date(initialNote?.created_at || Date.now()), 'PPpp')}</span>
          <span>Last modified: {format(new Date(initialNote?.updated_at || Date.now()), 'PPpp')}</span>
        </div>
      )}

      <div id="note-content" className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto">
        {editor && <EditorContent editor={editor} />}
      </div>

      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
      )}
    </div>
  );
};

export default NoteEditor;
