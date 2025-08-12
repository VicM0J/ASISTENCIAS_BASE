import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function BarcodeScanner({ onScan, disabled, className }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsScanning(true);
    } catch (err) {
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Here you would typically use a barcode detection library
    // For now, we'll simulate barcode detection
    simulateBarcodeDetection();
  };

  const simulateBarcodeDetection = () => {
    // This is a simulation - in a real app, you'd use a library like zxing-js or QuaggaJS
    // For demonstration, we'll trigger after a few seconds
    setTimeout(() => {
      const simulatedBarcode = "DEMO123456";
      onScan(simulatedBarcode);
      stopCamera();
    }, 2000);
  };

  // Handle physical barcode scanner input
  useEffect(() => {
    let buffer = "";
    let timeout: NodeJS.Timeout;
    let lastInputTime = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // If too much time passed between inputs, reset buffer (not from scanner)
      if (currentTime - lastInputTime > 50 && buffer.length > 0) {
        buffer = "";
      }
      
      lastInputTime = currentTime;

      // Physical scanners typically send Enter after the barcode
      if (event.key === "Enter" && buffer.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        onScan(buffer.trim());
        buffer = "";
        return;
      }

      // Accumulate characters (exclude special keys)
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault(); // Prevent typing in inputs
        buffer += event.key;
        
        // Clear buffer after 200ms of inactivity (scanner sends data quickly)
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = "";
        }, 200);
      }
    };

    // Always listen for scanner input, even when camera is active
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      clearTimeout(timeout);
    };
  }, [onScan]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera Scanner */}
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6">
            <div className="text-center">
              {!isScanning ? (
                <>
                  <Camera className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Escanear con Cámara
                  </h3>
                  <Button
                    onClick={startCamera}
                    disabled={disabled}
                    className="tablet-button"
                    data-testid="start-camera"
                  >
                    Activar Cámara
                  </Button>
                  {error && (
                    <div className="mt-4 flex items-center justify-center text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full max-w-sm mx-auto rounded-lg"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Square className="h-20 w-20 text-primary opacity-50" />
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 justify-center">
                    <Button
                      onClick={captureFrame}
                      disabled={disabled}
                      data-testid="capture-frame"
                    >
                      Capturar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={stopCamera}
                      data-testid="stop-camera"
                    >
                      Detener
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Physical Scanner */}
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Escáner Físico
              </h3>
              <p className="text-gray-600 mb-4">
                Conecta tu escáner y escanea directamente
              </p>
              <div className="text-sm text-green-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Listo para escanear
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
