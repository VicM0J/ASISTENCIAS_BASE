export function exportToExcel(data: any[], filename: string) {
  // Create a simple CSV export since we can't use external libraries
  // In a real implementation, you'd use a library like xlsx or exceljs
  
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        const escapedValue = value ? String(value).replace(/"/g, '""') : '';
        return escapedValue.includes(',') ? `"${escapedValue}"` : escapedValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.xlsx', '.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function formatTimeForExcel(minutes: number): string {
  if (!minutes) return "00:00";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function calculateTotalHours(checkIn: Date, checkOut: Date): number {
  if (!checkIn || !checkOut) return 0;
  return Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
}
