"use client";

import { useCallback, useRef, useEffect } from "react";

const SOUND_URLS = {
  spin: "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3",
  win: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3", 
  lose: "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3", 
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", 
  boxShake: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
  boxOpen: "https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3", 
  coins: "https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3", 
  ticket: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
};

type SoundType = keyof typeof SOUND_URLS;

export function useCasinoSounds() {
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    spin: null,
    win: null,
    lose: null,
    click: null,
    boxShake: null,
    boxOpen: null,
    coins: null,
    ticket: null,
  });

  const soundEnabled = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentAudioRefs = audioRefs.current;

    for (const [key, url] of Object.entries(SOUND_URLS)) {
      const audio = new Audio();
      audio.src = url;
      audio.preload = "auto";
      audio.volume = 0.5;
      currentAudioRefs[key as SoundType] = audio;
    }

    return () => {
      for (const audio of Object.values(currentAudioRefs)) {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      }
    };
  }, []);

  const playSound = useCallback((sound: SoundType, volume = 0.5) => {
    if (!soundEnabled.current) return;

    const audio = audioRefs.current[sound];
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {
      });
    }
  }, []);

  const stopSound = useCallback((sound: SoundType) => {
    const audio = audioRefs.current[sound];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const toggleSound = useCallback(() => {
    soundEnabled.current = !soundEnabled.current;
    return soundEnabled.current;
  }, []);

  const isSoundEnabled = useCallback(() => soundEnabled.current, []);

  return {
    playSound,
    stopSound,
    toggleSound,
    isSoundEnabled,
  };
}