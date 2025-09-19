import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './src/app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const startServer = async () => {
  try {
    // Create and start the app
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`PG_DATABASE from .env: ${process.env.PG_DATABASE}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Only start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export the app factory for testing
export { createApp };
