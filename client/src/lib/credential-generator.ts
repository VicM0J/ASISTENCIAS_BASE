export interface CredentialSettings {
  colorScheme: "default" | "turquoise" | "green" | "red" | "purple";
  fontSize: "small" | "medium" | "large";
  showDepartment: boolean;
  showPhoto: boolean;
  showBarcode: boolean;
  fontFamily: "inter" | "roboto" | "arial" | "helvetica";
  logoUrl?: string;
}

export interface EmployeeCredentialData {
  id: string;
  fullName: string;
  department: string;
  photo?: string;
  barcode: string;
}

export interface CredentialGenerationOptions {
  employees: EmployeeCredentialData[];
  settings: CredentialSettings;
  outputFormat: "pdf" | "png" | "jpg";
  layout: "single" | "grid-2x5" | "grid-3x7";
  includeBack: boolean;
}

// Credential dimensions in mm (converted to pixels at 300 DPI)
export const CREDENTIAL_DIMENSIONS = {
  width: 85, // mm
  height: 54, // mm
  widthPx: 1004, // 85mm at 300 DPI
  heightPx: 638, // 54mm at 300 DPI
};

export class CredentialGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CREDENTIAL_DIMENSIONS.widthPx;
    this.canvas.height = CREDENTIAL_DIMENSIONS.heightPx;
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateCredentials(options: CredentialGenerationOptions): Promise<Blob[]> {
    const credentials: Blob[] = [];
    
    for (const employee of options.employees) {
      const credentialBlob = await this.generateSingleCredential(employee, options.settings);
      credentials.push(credentialBlob);
    }
    
    if (options.layout !== "single") {
      // Generate grid layout
      return this.generateGridLayout(credentials, options);
    }
    
    return credentials;
  }

  private async generateSingleCredential(
    employee: EmployeeCredentialData, 
    settings: CredentialSettings
  ): Promise<Blob> {
    // Clear canvas
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background and borders
    this.drawBackground(settings);
    
    // Draw company logo
    await this.drawLogo(settings);
    
    // Draw employee ID
    this.drawEmployeeId(employee.id, settings);
    
    // Draw employee name
    this.drawEmployeeName(employee.fullName, settings);
    
    // Draw department
    if (settings.showDepartment) {
      this.drawDepartment(employee.department, settings);
    }
    
    // Draw employee photo
    if (settings.showPhoto && employee.photo) {
      await this.drawEmployeePhoto(employee.photo);
    }
    
    // Draw barcode
    if (settings.showBarcode) {
      this.drawBarcode(employee.barcode, settings);
    }
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 1.0);
    });
  }

  private drawBackground(settings: CredentialSettings) {
    // Draw white background
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw border
    this.ctx.strokeStyle = '#E2E8F0';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw rounded corners if needed
    this.ctx.beginPath();
    this.ctx.roundRect(0, 0, this.canvas.width, this.canvas.height, 20);
    this.ctx.clip();
  }

  private async drawLogo(settings: CredentialSettings) {
    // Draw JASANA logo in top-left corner
    const logoSize = 80;
    const margin = 30;
    
    // Draw logo background
    const logoColor = this.getColorScheme(settings.colorScheme).primary;
    this.ctx.fillStyle = logoColor;
    this.ctx.beginPath();
    this.ctx.roundRect(margin, margin, logoSize, logoSize, 10);
    this.ctx.fill();
    
    // Draw "J" text
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 48px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('J', margin + logoSize / 2, margin + logoSize / 2);
    
    // Draw company name
    this.ctx.fillStyle = logoColor;
    this.ctx.font = 'bold 24px Inter';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('JASANA', margin + logoSize + 20, margin + 25);
    
    this.ctx.font = '16px Inter';
    this.ctx.fillStyle = '#64748B';
    this.ctx.fillText('UNIFORMES CORPORATIVOS', margin + logoSize + 20, margin + 55);
  }

  private drawEmployeeId(id: string, settings: CredentialSettings) {
    const margin = 30;
    const topMargin = 30;
    
    this.ctx.fillStyle = '#64748B';
    this.ctx.font = '16px Inter';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('ID:', this.canvas.width - margin - 120, topMargin + 25);
    
    this.ctx.fillStyle = this.getColorScheme(settings.colorScheme).primary;
    this.ctx.font = 'bold 20px Inter';
    this.ctx.fillText(id, this.canvas.width - margin, topMargin + 50);
  }

  private drawEmployeeName(name: string, settings: CredentialSettings) {
    const margin = 30;
    const photoArea = 160; // Width reserved for photo
    const nameStartY = 160;
    
    const fontSize = this.getFontSize(settings.fontSize);
    this.ctx.font = `bold ${fontSize}px ${this.getFontFamily(settings.fontFamily)}`;
    this.ctx.fillStyle = this.getColorScheme(settings.colorScheme).primary;
    this.ctx.textAlign = 'left';
    
    // Split name if too long
    const maxWidth = this.canvas.width - margin - photoArea - 40;
    const words = name.split(' ');
    let line1 = '';
    let line2 = '';
    
    for (const word of words) {
      const testLine = line1 + (line1 ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line1) {
        line2 = (line2 ? line2 + ' ' : '') + word;
      } else {
        line1 = testLine;
      }
    }
    
    this.ctx.fillText(line1, margin + photoArea + 20, nameStartY);
    if (line2) {
      this.ctx.fillText(line2, margin + photoArea + 20, nameStartY + fontSize + 5);
    }
  }

  private drawDepartment(department: string, settings: CredentialSettings) {
    const margin = 30;
    const photoArea = 160;
    const deptStartY = 240;
    
    this.ctx.font = '18px Inter';
    this.ctx.fillStyle = '#64748B';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`ÁREA: ${department.toUpperCase()}`, margin + photoArea + 20, deptStartY);
  }

  private async drawEmployeePhoto(photoUrl: string) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise<void>((resolve) => {
        img.onload = () => {
          const photoX = 30;
          const photoY = 140;
          const photoWidth = 140;
          const photoHeight = 180;
          
          // Create circular clipping path
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 15);
          this.ctx.clip();
          
          // Draw photo
          this.ctx.drawImage(img, photoX, photoY, photoWidth, photoHeight);
          this.ctx.restore();
          
          resolve();
        };
        
        img.onerror = () => {
          // Draw placeholder
          this.ctx.fillStyle = '#F1F5F9';
          this.ctx.fillRect(30, 140, 140, 180);
          this.ctx.fillStyle = '#94A3B8';
          this.ctx.font = '48px Inter';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('👤', 100, 240);
          resolve();
        };
        
        img.src = photoUrl;
      });
    } catch (error) {
      console.error('Error loading employee photo:', error);
    }
  }

  private drawBarcode(barcode: string, settings: CredentialSettings) {
    const barcodeY = this.canvas.height - 80;
    const barcodeHeight = 50;
    const margin = 30;
    const barcodeWidth = this.canvas.width - (margin * 2);
    
    // Draw barcode background
    this.ctx.fillStyle = '#F8FAFC';
    this.ctx.fillRect(margin, barcodeY, barcodeWidth, barcodeHeight);
    
    // Generate simple barcode pattern
    const barcodePattern = this.generateBarcodePattern(barcode);
    const barWidth = barcodeWidth / barcodePattern.length;
    
    let currentX = margin;
    for (const bar of barcodePattern) {
      if (bar === '1') {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(currentX, barcodeY + 5, barWidth * 0.8, barcodeHeight - 10);
      }
      currentX += barWidth;
    }
    
    // Draw barcode text
    this.ctx.fillStyle = '#475569';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(barcode, this.canvas.width / 2, barcodeY + barcodeHeight + 20);
  }

  private generateBarcodePattern(data: string): string {
    // Simple barcode pattern generation
    let pattern = '';
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      const binary = char.toString(2).padStart(8, '0');
      pattern += binary;
    }
    
    // Pad to desired length
    while (pattern.length < 80) {
      pattern += '01';
    }
    
    return pattern.substring(0, 80);
  }

  private generateGridLayout(credentials: Blob[], options: CredentialGenerationOptions): Promise<Blob[]> {
    // This would implement grid layout generation
    // For now, return individual credentials
    return Promise.resolve(credentials);
  }

  private getColorScheme(scheme: CredentialSettings['colorScheme']) {
    const schemes = {
      default: { primary: '#1e293b', secondary: '#0891b2' },
      turquoise: { primary: '#0891b2', secondary: '#1e293b' },
      green: { primary: '#059669', secondary: '#1e293b' },
      red: { primary: '#dc2626', secondary: '#1e293b' },
      purple: { primary: '#9333ea', secondary: '#1e293b' },
    };
    
    return schemes[scheme];
  }

  private getFontSize(size: CredentialSettings['fontSize']): number {
    const sizes = {
      small: 20,
      medium: 24,
      large: 28,
    };
    
    return sizes[size];
  }

  private getFontFamily(family: CredentialSettings['fontFamily']): string {
    const families = {
      inter: 'Inter',
      roboto: 'Roboto',
      arial: 'Arial',
      helvetica: 'Helvetica',
    };
    
    return families[family];
  }
}

export const generateCredentials = async (options: CredentialGenerationOptions): Promise<void> => {
  const generator = new CredentialGenerator();
  const credentials = await generator.generateCredentials(options);
  
  if (options.outputFormat === 'pdf') {
    // Convert to PDF and download
    await downloadAsPdf(credentials, options);
  } else {
    // Download as images
    await downloadAsImages(credentials, options);
  }
};

const downloadAsPdf = async (credentials: Blob[], options: CredentialGenerationOptions): Promise<void> => {
  // This would use a PDF library like jsPDF to create a PDF
  console.log('PDF generation not implemented yet');
};

const downloadAsImages = async (credentials: Blob[], options: CredentialGenerationOptions): Promise<void> => {
  for (let i = 0; i < credentials.length; i++) {
    const url = URL.createObjectURL(credentials[i]);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credencial_${options.employees[i].id}.${options.outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
