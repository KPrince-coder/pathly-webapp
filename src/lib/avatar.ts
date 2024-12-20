import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

const STYLE_OPTIONS = {
  accessories: ['kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'],
  clotheType: ['blazer', 'blazerAndSweater', 'collarAndSweater', 'hoodie', 'overall', 'shirt'],
  eyebrow: ['default', 'flatNatural', 'raised', 'unibrow', 'upDown', 'angry'],
  eyes: ['default', 'happy', 'side', 'squint', 'surprised', 'wink'],
  facialHair: ['beardMedium', 'beardLight', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum'],
  hairColor: ['auburn', 'black', 'blonde', 'brown', 'pastel', 'platinum', 'red', 'gray'],
  mouth: ['default', 'eating', 'grimace', 'serious', 'smile', 'tongue'],
  skinColor: ['tanned', 'yellow', 'pale', 'light', 'brown', 'darkBrown', 'black'],
  top: ['shortHair', 'longHair', 'eyepatch', 'hat', 'hijab', 'turban'],
};

export const generateRandomAvatar = (seed?: string): string => {
  const avatar = createAvatar(avataaars, {
    seed: seed || Math.random().toString(),
    size: 128,
    backgroundColor: ['b6e3f4', 'c0aede', 'ffd5dc', 'ffdfbf'],
    ...Object.fromEntries(
      Object.entries(STYLE_OPTIONS).map(([key, values]) => [
        key,
        values[Math.floor(Math.random() * values.length)],
      ])
    ),
  });

  return avatar.toDataUriSync();
};

export const generateConsistentAvatar = (userId: string): string => {
  return generateRandomAvatar(userId);
};
