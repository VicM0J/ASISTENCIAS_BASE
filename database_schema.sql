-- TimeCheck Pro - Database Schema
-- Archivo SQL para crear las tablas en PostgreSQL/pgAdmin
-- Fecha de creación: 2025-08-12

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de horarios laborales
CREATE TABLE work_schedules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    entry_time TEXT NOT NULL,
    breakfast_out_time TEXT,
    breakfast_in_time TEXT,
    lunch_out_time TEXT,
    lunch_in_time TEXT,
    exit_time TEXT NOT NULL,
    overtime_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de departamentos/áreas
CREATE TABLE departments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de empleados
CREATE TABLE employees (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    work_schedule_id VARCHAR REFERENCES work_schedules(id),
    photo_url TEXT,
    barcode_data TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros de asistencia
CREATE TABLE attendance_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR REFERENCES employees(id) NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    breakfast_out_time TIMESTAMP,
    breakfast_in_time TIMESTAMP,
    lunch_out_time TIMESTAMP,
    lunch_in_time TIMESTAMP,
    total_hours INTEGER, -- en minutos
    overtime_hours INTEGER, -- en minutos
    date TEXT NOT NULL, -- formato YYYY-MM-DD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuraciones de credenciales
CREATE TABLE credential_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#2563EB',
    font_family TEXT DEFAULT 'Inter',
    template JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuraciones del sistema
CREATE TABLE system_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT DEFAULT 'TimeCheck Pro',
    timezone TEXT DEFAULT 'America/Mexico_City',
    email_notifications BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_work_schedule ON employees(work_schedule_id);
CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_check_in ON attendance_records(check_in_time);

-- Datos de ejemplo para horarios laborales
INSERT INTO work_schedules (name, entry_time, breakfast_out_time, breakfast_in_time, lunch_out_time, lunch_in_time, exit_time, overtime_enabled) VALUES
('Horario Administrativo', '08:00', '10:00', '10:30', '13:00', '14:00', '17:00', true),
('Horario 1', '07:00', '09:30', '10:00', '13:00', '14:00', '17:00', true),
('Horario 2', '09:00', '11:00', '11:30', '15:00', '16:00', '19:00', false);

-- Datos de ejemplo para departamentos
INSERT INTO departments (name, description, is_active) VALUES
('Administración', 'Área administrativa general', true),
('Ventas', 'Departamento de ventas', true),
('Recursos Humanos', 'Gestión de personal', true),
('Tecnología', 'Departamento de IT', true),
('Operaciones', 'Operaciones y logística', true),
('Marketing', 'Marketing y publicidad', true),
('Finanzas', 'Departamento financiero', true);

-- Configuraciones iniciales del sistema
INSERT INTO system_settings (company_name, timezone, email_notifications, dark_mode) VALUES
('TimeCheck Pro', 'America/Mexico_City', true, false);

-- Configuraciones iniciales de credenciales
INSERT INTO credential_settings (company_name, primary_color, font_family, template) VALUES
('TimeCheck Pro', '#2563EB', 'Inter', '{
    "width": 85,
    "height": 54,
    "elements": [
        {
            "type": "employeeId",
            "position": {"x": 3, "y": 3},
            "size": {"width": 20, "height": 4},
            "style": {"fontSize": "10px", "fontWeight": "bold"}
        },
        {
            "type": "employeeName",
            "position": {"x": 3, "y": 8},
            "size": {"width": 40, "height": 6},
            "style": {"fontSize": "12px", "fontWeight": "600"}
        },
        {
            "type": "department",
            "position": {"x": 3, "y": 14},
            "size": {"width": 40, "height": 4},
            "style": {"fontSize": "8px"}
        },
        {
            "type": "photo",
            "position": {"x": 67, "y": 3},
            "size": {"width": 12, "height": 12},
            "style": {}
        },
        {
            "type": "barcode",
            "position": {"x": 3, "y": 45},
            "size": {"width": 79, "height": 6},
            "style": {}
        }
    ]
}');

-- Comentarios sobre las tablas
COMMENT ON TABLE work_schedules IS 'Tabla de horarios laborales configurables';
COMMENT ON TABLE departments IS 'Tabla de departamentos y áreas de la empresa';
COMMENT ON TABLE employees IS 'Tabla de empleados con información personal y laboral';
COMMENT ON TABLE attendance_records IS 'Tabla de registros de asistencias con check-in/out y descansos';
COMMENT ON TABLE credential_settings IS 'Configuraciones para la generación de credenciales';
COMMENT ON TABLE system_settings IS 'Configuraciones generales del sistema';

-- Comentarios sobre campos importantes
COMMENT ON COLUMN employees.barcode_data IS 'Datos del código de barras para identificación';
COMMENT ON COLUMN attendance_records.total_hours IS 'Total de horas trabajadas en minutos';
COMMENT ON COLUMN attendance_records.overtime_hours IS 'Horas extra trabajadas en minutos';
COMMENT ON COLUMN credential_settings.template IS 'Plantilla JSON para el diseño de credenciales';