import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date | string | null): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-ES", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

export function getWeekRange(date: Date = new Date()): { start: string; end: string } {
  // Get Friday to Thursday range (excluding weekends)
  const friday = new Date(date);
  const dayOfWeek = friday.getDay();
  const daysToFriday = dayOfWeek === 0 ? -2 : 5 - dayOfWeek; // Sunday = 0, Friday = 5
  friday.setDate(friday.getDate() + daysToFriday);
  
  const thursday = new Date(friday);
  thursday.setDate(thursday.getDate() + 6); // Friday + 6 days = Thursday
  
  return {
    start: friday.toISOString().split('T')[0],
    end: thursday.toISOString().split('T')[0],
  };
}

export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function getYearRange(date: Date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function calculateWorkingHours(checkIn: Date | string, checkOut: Date | string): number {
  const start = typeof checkIn === "string" ? new Date(checkIn) : checkIn;
  const end = typeof checkOut === "string" ? new Date(checkOut) : checkOut;
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return Math.round(diffHours * 100) / 100;
}

export function generateEmployeeId(name: string): string {
  // Generate employee ID based on name
  const nameParts = name.trim().split(' ');
  let id = '';
  
  if (nameParts.length >= 2) {
    // First two letters of first name + first two letters of last name
    id += nameParts[0].substring(0, 2).toUpperCase();
    id += nameParts[nameParts.length - 1].substring(0, 2).toUpperCase();
  } else {
    // Just first 4 letters of name
    id += nameParts[0].substring(0, 4).toUpperCase();
  }
  
  // Add random numbers
  id += Math.floor(Math.random() * 900000 + 100000);
  
  return id;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function createImageUrl(buffer: ArrayBuffer | Uint8Array | null): string {
  if (!buffer) return '';
  
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function validateBarcode(barcode: string): boolean {
  // Basic barcode validation - alphanumeric, 6-20 characters
  const barcodeRegex = /^[A-Z0-9]{6,20}$/;
  return barcodeRegex.test(barcode);
}

export function validateEmployeeId(employeeId: string): boolean {
  // Employee ID validation - alphanumeric, 6-15 characters
  const employeeIdRegex = /^[A-Z0-9]{6,15}$/;
  return employeeIdRegex.test(employeeId);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function isTabletDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /tablet|ipad|playbook|silk|(android(?!.*mobile))/i.test(userAgent);
  const isLargeScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  return isTablet || (isTouchDevice() && isLargeScreen);
}
