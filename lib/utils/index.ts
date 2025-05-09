import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Exportar módulos de conexão IMAP
export * from './imap-connection';
export * from './imap-connection-pool';
export * from './imap-reader';
export * from './imap-event-handler';
export * from './email-connection'; 