import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Upload } from "lucide-react";
import { createImageUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Credentials() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [companyName, setCompanyName] = useState("JASANA");
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: company } = useQuery({
    queryKey: ["/api/company"],
  });

  const selectedEmployee = employees?.find((emp: any) => emp.id.toString() === selectedEmployeeId);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El logo debe ser menor a 2MB.",
          variant: "destructive",
        });
        return;
      }

      setNewLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCredentialCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedEmployee) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (85mm x 54mm at 300 DPI)
    const width = 1004; // 85mm * 300/25.4
    const height = 638; // 54mm * 300/25.4
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw company logo area (top left)
    ctx.fillStyle = primaryColor;
    ctx.fillRect(40, 40, 60, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(companyName[0], 70, 75);

    // Company name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(companyName, 120, 60);

    // Employee ID (top right)
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('ID:', width - 120, 50);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(selectedEmployee.employeeId, width - 40, 70);

    // Employee name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(selectedEmployee.fullName.toUpperCase(), 40, 150);

    // Department
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText(`ÁREA: ${selectedEmployee.department.toUpperCase()}`, 40, 180);

    // Employee photo placeholder (right side)
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 150, 120, 100, 120);
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(width - 149, 121, 98, 118);

    // Load employee photo if available
    if (selectedEmployee.photo) {
      try {
        const img = new Image();
        const photoUrl = createImageUrl(new Uint8Array(selectedEmployee.photo.data));
        img.onload = () => {
          ctx.drawImage(img, width - 149, 121, 98, 118);
        };
        img.src = photoUrl;
      } catch (error) {
        console.error('Error loading employee photo:', error);
      }
    }

    // Generate barcode using Code-128
    const barcodeY = height - 80;
    const barcodeText = selectedEmployee.barcode || selectedEmployee.employeeId;

    try {
      const { default: JsBarcode } = await import('jsbarcode');
      const barcodeCanvas = document.createElement('canvas');
      const barcodeCtx = barcodeCanvas.getContext('2d');
      
      if (!barcodeCtx) {
        throw new Error('Could not get barcode canvas context');
      }

      // Configuración optimizada para Code-128
      JsBarcode(barcodeCanvas, barcodeText, {
        format: "CODE128",
        width: 2.5, // Ancho óptimo para Code-128
        height: 45,
        displayValue: true,
        fontSize: 12,
        fontOptions: "bold",
        font: "Arial",
        textAlign: "center",
        textPosition: "bottom",
        textMargin: 2,
        marginTop: 0,
        marginBottom: 5,
        marginLeft: 5,
        marginRight: 5,
        background: "#FFFFFF",
        lineColor: "#000000",
        valid: function(valid) {
          if (!valid) {
            console.error('Invalid barcode data for Code-128:', barcodeText);
          }
        }
      });

      // Verificar que el código de barras se generó correctamente
      if (barcodeCanvas.width > 0 && barcodeCanvas.height > 0) {
        const maxBarcodeWidth = width - 80;
        const barcodeWidth = Math.min(barcodeCanvas.width, maxBarcodeWidth);
        const barcodeX = (width - barcodeWidth) / 2;
        const scale = barcodeWidth / barcodeCanvas.width;

        // Dibujar el código de barras escalado si es necesario
        ctx.drawImage(
          barcodeCanvas, 
          barcodeX, 
          barcodeY - 30, 
          barcodeWidth, 
          barcodeCanvas.height * scale
        );
        
        console.log('Code-128 barcode generated successfully for:', barcodeText);
      } else {
        throw new Error('Code-128 barcode canvas generation failed - invalid dimensions');
      }
    } catch (error) {
      console.error('Error generating Code-128 barcode:', error);
      
      // Fallback con simulación de Code-128
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ERROR: No se pudo generar código Code-128', width / 2, barcodeY - 15);
      
      // Mostrar el texto del código como fallback
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Código: ${barcodeText}`, width / 2, barcodeY + 10);
      
      // Dibujar barras simples como indicador visual
      const fallbackBarWidth = 2;
      const fallbackBars = 20;
      const fallbackTotalWidth = fallbackBars * fallbackBarWidth * 2;
      const fallbackStartX = (width - fallbackTotalWidth) / 2;
      
      for (let i = 0; i < fallbackBars; i++) {
        const x = fallbackStartX + (i * fallbackBarWidth * 2);
        ctx.fillRect(x, barcodeY - 5, fallbackBarWidth, 25);
      }
    }

    // Bottom accent bar
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, height - 20, width, 20);
  };

  const downloadCredential = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Por favor selecciona un empleado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateCredentialCanvas();

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Wait a bit for canvas to be fully rendered
      setTimeout(() => {
        // Create download link
        const link = document.createElement('a');
        link.download = `credencial-${selectedEmployee.employeeId}.png`;
        link.href = canvas.toDataURL();
        link.click();

        toast({
          title: "Credencial Descargada",
          description: "La credencial se ha descargado exitosamente.",
        });
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar la credencial.",
        variant: "destructive",
      });
    }
  };

  const printCredential = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Por favor selecciona un empleado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateCredentialCanvas();

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Wait a bit for canvas to be fully rendered
      setTimeout(() => {
        // Create print window
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const imageUrl = canvas.toDataURL();
        printWindow.document.write(`
          <html>
            <head>
              <title>Credencial - ${selectedEmployee.fullName}</title>
              <style>
                body { margin: 0; padding: 20px; text-align: center; }
                img { max-width: 100%; height: auto; }
                @media print {
                  body { margin: 0; padding: 0; }
                  img { width: 85mm; height: 54mm; }
                }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="Credencial" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar la credencial.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="tablet-card shadow-sm border border-gray-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Generador de Credenciales
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Credential Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Vista Previa
                </h3>
                <div className="bg-gray-100 p-8 rounded-lg flex justify-center">
                  {selectedEmployee ? (
                    <div className="credential-card bg-white shadow-lg">
                      <div className="p-4 h-full flex flex-col">
                        {/* Header with logo and ID */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <span className="text-white font-bold text-sm">
                                {companyName[0]}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-secondary">
                              {companyName}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">ID:</p>
                            <p className="text-sm font-bold text-gray-900">
                              {selectedEmployee.employeeId}
                            </p>
                          </div>
                        </div>

                        {/* Employee info and photo */}
                        <div className="flex space-x-3 flex-1">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight">
                              {selectedEmployee.fullName.toUpperCase()}
                            </h4>
                            <p className="text-xs text-gray-600">
                              ÁREA: {selectedEmployee.department.toUpperCase()}
                            </p>
                          </div>

                          {selectedEmployee.photo ? (
                            <img
                              src={createImageUrl(new Uint8Array(selectedEmployee.photo.data))}
                              alt="Empleado"
                              className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-gray-500 text-xs">Foto</span>
                            </div>
                          )}
                        </div>

                        {/* Code-128 Barcode at bottom */}
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="text-center">
                            <div className="flex justify-center items-center mb-1">
                              {/* Code-128 pattern simulation */}
                              {Array.from({ length: 35 }, (_, i) => {
                                const barcodeData = selectedEmployee.barcode || selectedEmployee.employeeId;
                                const charCode = barcodeData.charCodeAt(i % barcodeData.length);
                                const pattern = (charCode * (i + 1)) % 4;
                                
                                return (
                                  <div
                                    key={i}
                                    className="bg-black"
                                    style={{
                                      width: pattern === 0 ? '1px' : pattern === 1 ? '2px' : pattern === 2 ? '3px' : '1px',
                                      height: '16px',
                                      marginRight: i % 2 === 0 ? '1px' : '2px'
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-600 font-mono">
                              {selectedEmployee.barcode || selectedEmployee.employeeId}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Code-128
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Accent bar */}
                      <div
                        className="h-2 rounded-b-lg"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                  ) : (
                    <div className="credential-card bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <p className="text-gray-500">Selecciona un empleado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration Panel */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración
                </h3>
                <div className="space-y-6">
                  {/* Company Settings */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Información de la Empresa
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="company-name" className="text-sm font-medium text-gray-700">
                            Nombre de la Empresa
                          </Label>
                          <Input
                            id="company-name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="tablet-input"
                            data-testid="input-company-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company-logo" className="text-sm font-medium text-gray-700">
                            Logo de la Empresa
                          </Label>
                          <div className="flex space-x-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload"
                            />
                            <Label htmlFor="logo-upload" className="flex-1 cursor-pointer">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full tablet-input"
                                data-testid="upload-logo"
                                asChild
                              >
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {newLogo ? "Logo seleccionado" : "Subir nuevo logo..."}
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Design Settings */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Diseño de Credencial
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="primary-color" className="text-sm font-medium text-gray-700">
                            Color Principal
                          </Label>
                          <div className="flex space-x-2">
                            <input
                              type="color"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="w-12 h-8 rounded border border-gray-300"
                              data-testid="color-picker"
                            />
                            <Input
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="flex-1 tablet-input"
                              data-testid="input-color"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Employee Selection */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Seleccionar Empleado
                      </h4>
                      <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger className="tablet-input" data-testid="select-employee">
                          <SelectValue placeholder="Seleccionar empleado..." />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.fullName} - {employee.employeeId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={downloadCredential}
                      disabled={!selectedEmployee}
                      className="w-full tablet-button"
                      data-testid="download-credential"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Credencial
                    </Button>
                    <Button
                      onClick={printCredential}
                      disabled={!selectedEmployee}
                      variant="outline"
                      className="w-full tablet-button bg-accent text-white hover:bg-accent/90"
                      data-testid="print-credential"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Credencial
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for credential generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}