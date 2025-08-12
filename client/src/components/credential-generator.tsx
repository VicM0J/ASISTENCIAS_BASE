import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileImage } from "lucide-react";

export default function CredentialGenerator() {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [outputFormat, setOutputFormat] = useState("pdf");
  const [layout, setLayout] = useState("single");
  const [includeBack, setIncludeBack] = useState(false);
  const [colorScheme, setColorScheme] = useState("default");
  const [fontSize, setFontSize] = useState("medium");
  const [showDepartment, setShowDepartment] = useState(true);
  const [roundedCorners, setRoundedCorners] = useState(true);

  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
  });

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (employees && Array.isArray(employees)) {
      setSelectedEmployees(employees.map((emp: any) => emp.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedEmployees([]);
  };

  const handleGenerateCredentials = async () => {
    if (selectedEmployees.length === 0) {
      alert("Selecciona al menos un empleado para generar credenciales");
      return;
    }

    try {
      const settings = {
        outputFormat,
        layout,
        includeBack,
        colorScheme,
        fontSize,
        showDepartment,
        roundedCorners,
      };

      const response = await fetch('/api/credentials/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
          settings,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credenciales_${new Date().toISOString().split('T')[0]}.${outputFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Error al generar credenciales");
      }
    } catch (error) {
      console.error("Error generating credentials:", error);
      alert("Error al generar credenciales");
    }
  };

  const colorSchemes = [
    { id: "default", name: "Por defecto", color: "bg-navy" },
    { id: "turquoise", name: "Turquesa", color: "bg-turquoise" },
    { id: "green", name: "Verde", color: "bg-green-600" },
    { id: "red", name: "Rojo", color: "bg-red-600" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-8 py-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">Generador de Credenciales</h2>
          <p className="text-slate-600">Genera credenciales profesionales para empleados</p>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Selection Panel */}
          <div className="space-y-6">
            {/* Employee Selection */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">Seleccionar Empleados</h3>
                
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {(employees && Array.isArray(employees)) ? employees.map((employee: any) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => handleEmployeeToggle(employee.id)}
                        />
                        {employee.photo ? (
                          <img 
                            src={employee.photo} 
                            alt={`Foto de ${employee.fullName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-xs">👤</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-navy">{employee.fullName}</p>
                          <p className="text-sm text-slate-600">{employee.id} • {employee.department}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Activo</span>
                    </div>
                  )) : null}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <Button variant="link" onClick={handleSelectAll} className="text-turquoise">
                      Seleccionar todos
                    </Button>
                    <Button variant="link" onClick={handleClearSelection} className="text-slate-500">
                      Limpiar selección
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Options */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">Opciones de Generación</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Formato de Salida</label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF (Recomendado)</SelectItem>
                        <SelectItem value="png">PNG (Alta calidad)</SelectItem>
                        <SelectItem value="jpg">JPG (Comprimido)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Disposición</label>
                    <Select value={layout} onValueChange={setLayout}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Una credencial por página</SelectItem>
                        <SelectItem value="grid-2x5">2x5 credenciales por página</SelectItem>
                        <SelectItem value="grid-3x7">3x7 credenciales por página</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-back"
                      checked={includeBack}
                      onCheckedChange={(checked) => setIncludeBack(checked === true)}
                    />
                    <label htmlFor="include-back" className="text-sm text-slate-700">
                      Incluir reverso con información adicional
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateCredentials}
                  className="w-full mt-6 bg-turquoise hover:bg-cyan-600"
                  disabled={selectedEmployees.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generar Credenciales ({selectedEmployees.length})
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {/* Live Preview */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">Vista Previa</h3>
                
                {/* Credential Preview (Actual Size: 85mm x 54mm) */}
                <div className="mx-auto" style={{ width: '340px', height: '216px' }}>
                  <div className="w-full h-full bg-white border-2 border-slate-200 rounded-lg relative overflow-hidden shadow-lg">
                    {/* Header with Logo and ID */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 ${colorScheme === 'default' ? 'bg-navy' : colorScheme === 'turquoise' ? 'bg-turquoise' : colorScheme === 'green' ? 'bg-green-600' : 'bg-red-600'} rounded-lg flex items-center justify-center`}>
                          <span className="text-white text-sm font-bold">J</span>
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-navy">JASANA</div>
                          <div className="text-slate-600 text-xs">UNIFORMES CORPORATIVOS</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-600">ID:</div>
                        <div className="font-bold text-navy text-sm">MOJV040815</div>
                      </div>
                    </div>

                    {/* Employee Info and Photo */}
                    <div className="absolute top-16 left-3 right-3 flex items-start space-x-3">
                      {/* Employee Photo */}
                      <div className="w-16 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <span className="text-slate-400">👤</span>
                        </div>
                      </div>
                      
                      {/* Employee Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-navy leading-tight ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                          VICTOR MANUEL MONTAÑO JUANPEDRO
                        </h4>
                        {showDepartment && (
                          <p className="text-xs text-slate-600 mt-1">ÁREA: SISTEMAS</p>
                        )}
                      </div>
                    </div>

                    {/* Barcode */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="h-8 bg-slate-100 rounded flex items-center justify-center">
                        <div className="text-xs font-mono text-slate-700">||||| ||| || ||||||| || ||||| ||| |||||</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dimensions Info */}
                <div className="mt-4 text-center text-sm text-slate-600">
                  <p>Dimensiones: 85mm × 54mm (Tamaño estándar)</p>
                </div>
              </CardContent>
            </Card>

            {/* Customization Options */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-navy mb-4">Personalización</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Color Principal</label>
                    <div className="flex space-x-2">
                      {colorSchemes.map((scheme) => (
                        <button
                          key={scheme.id}
                          onClick={() => setColorScheme(scheme.id)}
                          className={`w-8 h-8 ${scheme.color} rounded border-2 ${
                            colorScheme === scheme.id ? 'border-gray-300' : 'border-transparent'
                          }`}
                          title={scheme.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tamaño de Fuente</label>
                    <Select value={fontSize} onValueChange={setFontSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeño</SelectItem>
                        <SelectItem value="medium">Mediano</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-department"
                        checked={showDepartment}
                        onCheckedChange={(checked) => setShowDepartment(checked === true)}
                      />
                      <label htmlFor="show-department" className="text-sm text-slate-700">
                        Mostrar departamento
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="rounded-corners"
                        checked={roundedCorners}
                        onCheckedChange={(checked) => setRoundedCorners(checked === true)}
                      />
                      <label htmlFor="rounded-corners" className="text-sm text-slate-700">
                        Esquinas redondeadas
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
