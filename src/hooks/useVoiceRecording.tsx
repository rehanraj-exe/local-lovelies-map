import { useState, useRef } from 'react';
import { toast } from 'sonner';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      // Check if browser supports Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error('Speech recognition not supported', {
          description: 'Your browser does not support voice search'
        });
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.success('Listening...', {
          description: 'Speak clearly into your microphone'
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied', {
            description: 'Please allow microphone access to use voice search'
          });
        } else {
          toast.error('Voice recognition failed', {
            description: 'Please try again'
          });
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start voice search', {
        description: 'Please try again'
      });
    }
  };

  const stopRecording = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recognitionRef.current) {
        reject(new Error('No recording in progress'));
        return;
      }

      recognitionRef.current.onresult = (event: any) => {
        setIsRecording(false);
        setIsProcessing(true);

        const transcript = event.results[0][0].transcript;
        
        console.log('Transcription received:', transcript);
        
        toast.success('Voice recognized', {
          description: `"${transcript}"`
        });
        
        setIsProcessing(false);
        resolve(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.stop();
    });
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};
