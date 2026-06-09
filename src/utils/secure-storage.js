import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const setSecureItem = async (key, value) => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
};

export const getSecureItem = async (key) => {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
};

export const removeSecureItem = async (key) => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};
