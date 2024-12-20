'use client';

import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { colors } from '@/styles/colors';
import { FiImage, FiQuote, FiPlus, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface VisionBoardProps {
  goalId: string;
  media: Array<{
    type: 'image' | 'quote' | 'video';
    url: string;
    caption?: string;
  }>;
  onUpdate: () => void;
}

export function VisionBoard({ goalId, media, onUpdate }: VisionBoardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'quote'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [quote, setQuote] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const supabase = useSupabase();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `vision-board/${goalId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      await addMediaToGoal({
        type: 'image',
        url: publicUrl,
        caption,
      });

      setImageUrl('');
      setCaption('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const addMediaToGoal = async (newMedia: {
    type: 'image' | 'quote';
    url: string;
    caption?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('vision_goals')
        .update({
          inspiration_media: [...media, newMedia],
        })
        .eq('id', goalId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error adding media:', error);
    }
  };

  const handleAddQuote = async () => {
    if (!quote.trim()) return;

    try {
      await addMediaToGoal({
        type: 'quote',
        url: '', // Quotes don't need URLs
        caption: quote,
      });

      setQuote('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding quote:', error);
    }
  };

  const handleRemoveMedia = async (index: number) => {
    try {
      const newMedia = [...media];
      const removedMedia = newMedia.splice(index, 1)[0];

      // If it's an image, delete from storage
      if (removedMedia.type === 'image') {
        const filePath = removedMedia.url.split('/').pop();
        if (filePath) {
          await supabase.storage.from('media').remove([`vision-board/${goalId}/${filePath}`]);
        }
      }

      const { error } = await supabase
        .from('vision_goals')
        .update({
          inspiration_media: newMedia,
        })
        .eq('id', goalId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error removing media:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Vision Board</h3>
        <Button
          variant="outline"
          onClick={() => setShowAddModal(true)}
          className="flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Inspiration
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {media.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <Card className="overflow-hidden aspect-square">
                {item.type === 'image' ? (
                  <div className="relative w-full h-full">
                    <img
                      src={item.url}
                      alt={item.caption || ''}
                      className="object-cover w-full h-full"
                    />
                    {item.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50">
                        <p className="text-white text-sm">{item.caption}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center h-full p-4"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
                    }}
                  >
                    <p className="text-sm text-center font-medium text-primary-900">
                      {item.caption}
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveMedia(index)}
                >
                  <FiTrash2 className="h-4 w-4 text-red-500" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add to Vision Board"
      >
        <div className="space-y-6">
          <div className="flex space-x-4">
            <Button
              variant={mediaType === 'image' ? 'default' : 'outline'}
              onClick={() => setMediaType('image')}
              className="flex-1"
            >
              <FiImage className="mr-2" />
              Image
            </Button>
            <Button
              variant={mediaType === 'quote' ? 'default' : 'outline'}
              onClick={() => setMediaType('quote')}
              className="flex-1"
            >
              <FiQuote className="mr-2" />
              Quote
            </Button>
          </div>

          {mediaType === 'image' ? (
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Input
                label="Caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption to your image"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Inspirational Quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Enter an inspirational quote"
              />
              <Button
                onClick={handleAddQuote}
                disabled={!quote.trim()}
                className="w-full"
              >
                Add Quote
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
