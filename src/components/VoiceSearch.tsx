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
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    if (isOpen && !isRecording) {
      startRecording();
    }

    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      // Check browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error('Speech recognition not supported', {
          description: 'Your browser does not support voice search'
        });
        onClose();
        return;
      }

      // Initialize audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        
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
        const transcript = event.results[0][0].transcript;
        setIsProcessing(true);
        
        setTimeout(() => {
          toast.success('Voice recognized!', {
            description: `"${transcript}"`
          });
          onTranscript(transcript);
          handleClose();
        }, 500);
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
        stream.getTracks().forEach(track => track.stop());
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
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleClose = () => {
    stopRecording();
    setIsRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
    setAudioLevel(0);
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

          {/* Status */}
          <div className="text-center space-y-2">
            {isProcessing ? (
              <p className="text-sm text-muted-foreground animate-pulse">
                Processing...
              </p>
            ) : isRecording ? (
              <>
                <p className="text-lg font-medium">
                  Listening...
                </p>
                <p className="text-2xl font-mono text-primary">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Speak clearly into your microphone
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Starting microphone...
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
