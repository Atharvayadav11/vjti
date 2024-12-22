'use client'

import React, { useState, useEffect, createContext, useContext } from 'react';

// Define the context type
type TTSContextType = {
  isEnabled: boolean;
  toggleTTS: () => void;
};

// Create the context
const TTSContext = createContext<TTSContextType>({
  isEnabled: false,
  toggleTTS: () => {},
});

// Create the hook
export const useTTS = () => useContext(TTSContext);

// Create the provider
export const TTSProvider = ({ children }: { children: React.ReactNode }) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load the saved state when the component mounts
    const savedState = localStorage.getItem('ttsEnabled');
    if (savedState) {
      setIsEnabled(savedState === 'true');
    }
  }, []);

  const toggleTTS = () => {
    setIsEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('ttsEnabled', String(newState));
      return newState;
    });
  };

  return (
    <TTSContext.Provider value={{ isEnabled, toggleTTS }}>
      {children}
    </TTSContext.Provider>
  );
};

// Main TextToSpeech component
interface TextToSpeechProps {
  children: React.ReactNode;
}

const TextToSpeech = ({ children }: TextToSpeechProps) => {
  const { isEnabled } = useTTS();

  const handleSpeak = (text: string) => {
    if (!isEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const text = target.innerText || target.textContent;
    if (text) {
      handleSpeak(text);
    }
  };

  const handleMouseLeave = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default TextToSpeech;