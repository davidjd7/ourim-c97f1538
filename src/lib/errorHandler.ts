// Centralized error handling utility

export interface ErrorContext {
  component?: string;
  function?: string;
  userId?: string;
  investmentId?: string;
  additionalData?: Record<string, any>;
}

export function logError(error: any, context: ErrorContext = {}) {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  };

  // Log to console with structured format
  console.error('[ERROR]', errorData);

  // In production, this could also send to external logging service
  // Example: sendToLoggingService(errorData);
}

export function handleAsyncError(error: any, context: ErrorContext = {}) {
  logError(error, context);
  
  // Return user-friendly error message
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Une erreur inattendue s\'est produite';
}