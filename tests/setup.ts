// Global test setup
process.env.NODE_ENV = 'test';

// Suppress console logs during tests unless there's an error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  // Only log if it's not a migration or server startup message
  const message = args.join(' ');
  if (!message.includes('Database migrated') && 
      !message.includes('Server is running') && 
      !message.includes('PG_DATABASE from .env')) {
    originalConsoleLog(...args);
  }
};

console.error = (...args: any[]) => {
  originalConsoleError(...args);
};
