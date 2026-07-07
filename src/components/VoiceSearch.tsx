import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, X, StopCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export const VoiceSearch = ({ isOpen, onClose, onTranscript }: VoiceSearchProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const transcriptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isRecording) {
      setInterimTranscript('');
      startRecording();
    }

    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      // Check browser support for Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!window.isSecureContext || !SpeechRecognition) {
        toast.info('Voice search fallback', {
          description: 'Voice requires HTTPS and browser support. Using manual input instead.'
        });
        
        setTimeout(() => {
          const manualInput = prompt('Demo Voice Search Mode: Type your search query here:');
          if (manualInput) {
            toast.success('Voice recognized!', { description: `"${manualInput}"` });
            onTranscript(manualInput);
          }
          handleClose();
        }, 100);
        return;
      }

      // Simulate audio visualization instead of locking the mic with getUserMedia
      // This prevents the "audio-capture" failure on mobile devices where SpeechRecognition
      // conflicts with getUserMedia for exclusive microphone access.
      activeRef.current = true;
      const simulateLevel = () => {
        if (!activeRef.current) return;
        setAudioLevel(Math.random() * 50 + 10);
        rafRef.current = requestAnimationFrame(() => {
          setTimeout(simulateLevel, 100);
        });
      };
      simulateLevel();

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        setInterimTranscript('');
        
        // Start timer
        const interval = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        timerRef.current = interval;

        toast.success('Listening...', {
          description: 'Speak clearly into your microphone'
        });
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        
        const currentText = interimStr || finalStr;
        setInterimTranscript(currentText);
        transcriptRef.current = currentText;
        
        if (finalStr) {
          transcriptRef.current = ''; // clear immediately to prevent onend from double-submitting
          setIsProcessing(true);
          setTimeout(() => {
            toast.success('Voice recognized!', {
              description: `"${finalStr}"`
            });
            onTranscript(finalStr);
            handleClose();
          }, 500);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied', {
            description: 'Please allow microphone access'
          });
        } else if (event.error === 'no-speech') {
          toast.info('No speech detected', {
            description: 'Please try again'
          });
        } else {
          toast.error('Voice recognition failed', {
            description: 'Please try again'
          });
        }
        onClose();
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        
        // If it ended naturally but didn't trigger handleClose via finalStr in onresult,
        // we should process whatever we have or close it.
        const currentText = transcriptRef.current;
        if (currentText) {
          setIsProcessing(true);
          setTimeout(() => {
            toast.success('Voice recognized!', { description: `"${currentText}"` });
            onTranscript(currentText);
            handleClose();
          }, 500);
        } else {
          // No speech detected, just close
          handleClose();
        }
      };

      recognition.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start voice search', {
        description: 'Please check microphone permissions'
      });
      onClose();
    }
  };

  const stopRecording = () => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Manual stop: process whatever transcript we captured so far
    const currentText = transcriptRef.current;
    if (currentText) {
      setIsProcessing(true);
      setTimeout(() => {
        toast.success('Voice recognized!', {
          description: `"${currentText}"`
        });
        onTranscript(currentText);
        handleClose();
      }, 500);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    activeRef.current = false;
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
    setAudioLevel(0);
    setInterimTranscript('');
    transcriptRef.current = '';
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <Mic className="w-5 h-5" />
            Voice Search
          </DialogTitle>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Microphone Animation */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              {/* Pulsing circles */}
              {isRecording && (
                <>
                  <div 
                    className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
                    style={{ 
                      animationDuration: '2s',
                      transform: `scale(${1 + audioLevel / 100})`
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"
                    style={{ 
                      animationDuration: '1.5s',
                      transform: `scale(${1.2 + audioLevel / 150})`
                    }}
                  />
                </>
              )}
              
              {/* Microphone icon */}
              <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-primary text-primary-foreground shadow-2xl' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Mic className="w-16 h-16" />
              </div>
            </div>

            {/* Audio level bars */}
            {isRecording && (
              <div className="flex gap-1 mt-6 h-16 items-end justify-center">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-primary rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(10, (audioLevel / 2) * Math.random())}%`,
                      opacity: audioLevel > 10 ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status & Live Transcript */}
          <div className="text-center space-y-3 min-h-[100px] flex flex-col justify-center items-center">
            {isProcessing ? (
              <p className="text-lg text-muted-foreground animate-pulse font-medium">
                Searching...
              </p>
            ) : isRecording ? (
              <>
                <p className="text-2xl font-mono text-primary/70">
                  {formatTime(recordingTime)}
                </p>
                {interimTranscript ? (
                  <p className="text-xl font-medium text-foreground bg-accent/30 p-4 rounded-xl shadow-inner max-w-full break-words border border-border/50">
                    "{interimTranscript}"
                  </p>
                ) : (
                  <p className="text-lg text-muted-foreground animate-pulse">
                    Listening... Speak now
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Initializing microphone...
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {isRecording && (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="rounded-full shadow-lg"
              >
                <StopCircle className="w-5 h-5 mr-2" />
                Stop
              </Button>
            )}
            
            <Button
              size="lg"
              variant="outline"
              onClick={handleClose}
              className="rounded-full"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
