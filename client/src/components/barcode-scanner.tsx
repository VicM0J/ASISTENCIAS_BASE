import { useEffect, useRef, useState } from "react";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
}

export default function BarcodeScanner({ onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const { startScanning, stopScanning } = useBarcodeScanner({
    onDetected: (barcode) => {
      onDetected(barcode);
      setIsScanning(false);
    },
    onError: (error) => {
      setError(error);
      setIsScanning(false);
    },
  });

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsScanning(true);
          startScanning(videoRef.current);
        }
      } catch (err) {
        setError("No se pudo acceder a la cámara. Verifique los permisos.");
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      stopScanning();
    };
  }, [startScanning, stopScanning]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
        <Alert className="m-4 bg-red-900 border-red-700 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
      {isScanning && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
          Escaneando código de barras...
        </div>
      )}
    </div>
  );
}
