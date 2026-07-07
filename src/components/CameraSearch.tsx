import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CameraSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCapture: (imageData: string) => void;
}

export const CameraSearch = ({ isOpen, onClose, onImageCapture }: CameraSearchProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    try {
      // Check secure context (required for getUserMedia)
      if (!window.isSecureContext) {
        toast.error('Secure connection required', {
          description: 'Camera access requires HTTPS or localhost. Please access the app via localhost:8080'
        });
        onClose();
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Media devices not available', {
          description: 'Your browser does not support camera access'
        });
        onClose();
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera access denied', {
          description: 'Please allow camera access in your browser settings and try again'
        });
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found', {
          description: 'Please connect a camera and try again'
        });
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera is in use', {
          description: 'Another application may be using your camera'
        });
      } else {
        toast.error('Camera error', {
          description: `Could not access camera: ${error.message}`
        });
      }
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
      
      toast.success('Photo captured!', {
        description: 'Review and search or retake'
      });
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSearch = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    stopCamera();
    onClose();
  };

  const selectFromGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageData = reader.result as string;
          setCapturedImage(imageData);
          stopCamera();
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Search
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-[400px] object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Camera overlay grid */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              </div>

              {/* Camera controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={selectFromGallery}
                    className="text-white hover:bg-white/20 rounded-full w-14 h-14"
                  >
                    <ImageIcon className="w-6 h-6" />
                  </Button>

                  <Button
                    variant="default"
                    size="icon"
                    onClick={capturePhoto}
                    className="bg-white hover:bg-white/90 rounded-full w-20 h-20 shadow-2xl"
                  >
                    <Camera className="w-8 h-8 text-black" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={switchCamera}
                    className="text-white hover:bg-white/20 rounded-full w-14 h-14"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-[400px] object-contain"
              />
              
              {/* Image review controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={retakePhoto}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-full px-6"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>

                  <Button
                    onClick={handleSearch}
                    className="bg-primary hover:bg-primary/90 rounded-full px-8 shadow-2xl"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Similar
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};
