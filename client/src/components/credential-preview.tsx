import { Building } from "lucide-react";

interface CredentialPreviewProps {
  employee?: {
    employeeId: string;
    fullName: string;
    department: string;
    photoUrl?: string;
  };
  color?: string;
  font?: string;
  companyName?: string;
}

export default function CredentialPreview({ 
  employee, 
  color = "#2563EB", 
  font = "Inter",
  companyName = "TimeCheck Pro" 
}: CredentialPreviewProps) {
  if (!employee) {
    return (
      <div className="mx-auto bg-slate-200 rounded-xl shadow-lg p-1" style={{ width: "340px", height: "216px" }}>
        <div className="bg-white rounded-lg h-full flex items-center justify-center">
          <p className="text-slate-500">Seleccione un empleado</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="mx-auto rounded-xl shadow-lg p-1" 
      style={{ 
        width: "340px", 
        height: "216px",
        background: `linear-gradient(to right, ${color}, ${color}dd)`
      }}
    >
      <div className="bg-white rounded-lg h-full p-4 relative overflow-hidden" style={{ fontFamily: font }}>
        {/* Company Logo */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-slate-200 rounded flex items-center justify-center">
          <Building className="w-4 h-4 text-slate-400" />
        </div>
        
        {/* Employee ID */}
        <div className="absolute top-3 left-3">
          <p className="text-xs font-bold text-slate-900">{employee.employeeId}</p>
        </div>
        
        {/* Employee Info */}
        <div className="absolute top-8 left-3 right-12">
          <p className="text-sm font-semibold text-slate-900 truncate">{employee.fullName}</p>
          <p className="text-xs text-slate-600 truncate">{employee.department}</p>
        </div>
        
        {/* Employee Photo */}
        <div className="absolute top-3 right-14 w-12 h-12 bg-slate-200 rounded overflow-hidden">
          {employee.photoUrl ? (
            <img 
              src={employee.photoUrl} 
              alt="Employee photo" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-slate-400">
              {employee.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Barcode */}
        <div className="absolute bottom-3 left-3 right-3 bg-black h-8 rounded flex items-center justify-center">
          <div className="flex space-x-px">
            {/* Barcode lines simulation */}
            {Array.from({ length: 20 }, (_, i) => (
              <div 
                key={i}
                className="bg-white" 
                style={{
                  width: '1px',
                  height: Math.random() > 0.5 ? '16px' : '24px'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Company Name */}
        <div className="absolute bottom-14 left-3 right-3">
          <p className="text-xs text-slate-500 text-center">{companyName}</p>
        </div>
      </div>
    </div>
  );
}
