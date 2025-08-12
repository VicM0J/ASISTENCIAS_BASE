import { useCallback, useRef, useEffect } from "react";

interface BarcodeScannerOptions {
  onDetected: (barcode: string) => void;
  onError: (error: string) => void;
  autoScan?: boolean; // Para detectar automáticamente escáneres físicos
}

export function useBarcodeScanner({ onDetected, onError, autoScan = false }: BarcodeScannerOptions) {
  const scannerRef = useRef<any>(null);
  const isScanning = useRef(false);
  const barcodeBuffer = useRef<string>("");
  const lastInputTime = useRef<number>(0);

  // Detectar códigos de barras de escáneres físicos automáticamente
  useEffect(() => {
    if (!autoScan) return;

    const handlePhysicalScannerInput = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastInputTime.current;

      // Si es Enter y hay datos en el buffer, procesar como código de barras
      if (event.key === 'Enter') {
        event.preventDefault();
        if (barcodeBuffer.current.length > 0) {
          const barcode = barcodeBuffer.current.trim();
          if (barcode.length >= 3) { // Validar longitud mínima
            onDetected(barcode);
          }
          barcodeBuffer.current = "";
        }
        return;
      }

      // Si es un carácter alfanumérico, agregarlo al buffer
      if (event.key.length === 1 && /^[a-zA-Z0-9]$/.test(event.key)) {
        // Si el tiempo entre caracteres es muy corto, probablemente es un escáner
        if (timeDiff < 100 || barcodeBuffer.current.length === 0) {
          barcodeBuffer.current += event.key;
          event.preventDefault(); // Prevenir que aparezca en inputs
        } else {
          // Tiempo demasiado largo, limpiar buffer (escritura manual)
          barcodeBuffer.current = event.key;
        }
      }

      lastInputTime.current = currentTime;

      // Limpiar buffer después de 1 segundo de inactividad
      setTimeout(() => {
        if (Date.now() - lastInputTime.current > 1000) {
          barcodeBuffer.current = "";
        }
      }, 1000);
    };

    document.addEventListener('keydown', handlePhysicalScannerInput, true);
    
    return () => {
      document.removeEventListener('keydown', handlePhysicalScannerInput, true);
    };
  }, [autoScan, onDetected]);

  const startScanning = useCallback((videoElement: HTMLVideoElement) => {
    if (isScanning.current) return;

    try {
      isScanning.current = true;
      
      // Simulación de escáner de cámara con Ctrl+Enter
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && event.ctrlKey) {
          const simulatedBarcode = prompt("Ingrese código de barras (simulación de cámara):");
          if (simulatedBarcode) {
            onDetected(simulatedBarcode);
          }
        }
      };

      document.addEventListener('keydown', handleKeyPress);
      scannerRef.current = { cleanup: () => document.removeEventListener('keydown', handleKeyPress) };
      
    } catch (error) {
      onError("Error al inicializar el escáner de códigos de barras");
    }
  }, [onDetected, onError]);

  const stopScanning = useCallback(() => {
    if (scannerRef.current?.cleanup) {
      scannerRef.current.cleanup();
      scannerRef.current = null;
    }
    isScanning.current = false;
  }, []);

  return {
    startScanning,
    stopScanning,
    isScanning: isScanning.current,
  };
}
