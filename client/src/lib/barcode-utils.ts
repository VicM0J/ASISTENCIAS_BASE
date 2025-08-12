export function generateBarcode(employeeId: string): string {
  // Generate a simple barcode format for the employee ID
  // In a real implementation, you might want to use a proper barcode generation library
  return `${employeeId}${Date.now().toString().slice(-3)}`;
}

export function validateBarcode(barcode: string): boolean {
  // Basic validation - ensure barcode is not empty and meets minimum length
  return barcode && barcode.length >= 3;
}

export function formatBarcodeForDisplay(barcode: string): string {
  // Format barcode for display purposes
  return barcode.toUpperCase();
}
