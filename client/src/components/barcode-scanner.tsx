import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
}

export default function BarcodeScanner({ onBarcodeDetected }: BarcodeScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(true);

  // In a real implementation, you would use a barcode detection library
  // like @zxing/library or quagga2. For now, we'll simulate detection
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isScanning) {
      // Simulate barcode detection every few seconds for demo
      intervalId = setInterval(() => {
        // In real implementation, this would analyze the webcam feed
        // For demo, we'll generate a sample barcode after 5 seconds
        const sampleBarcodes = ["MOJV040815", "HEGU789123", "MARC456789"];
        const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
        
        // Uncomment the line below to test auto-detection
        // onBarcodeDetected(randomBarcode);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, onBarcodeDetected]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment", // Use back camera on mobile
  };

  return (
    <div className="relative w-full h-full">
      <Webcam
        ref={webcamRef}
        audio={false}
        height="100%"
        width="100%"
        videoConstraints={videoConstraints}
        className="object-cover rounded-lg"
      />
      
      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-red-500 rounded-lg">
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-500"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-red-500"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>
        </div>
        
        {/* Scanning line animation */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-24 overflow-hidden">
          <div className="absolute w-full h-0.5 bg-red-500 animate-pulse"></div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded text-sm">
        Alinea el código de barras dentro del marco
      </div>
    </div>
  );
}
