import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import userRoutes from './user/routes';
import customerRoutes from './customer/routes';
import { Database } from './_services/databaseService';

const createApp = () => {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger configuration
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'romofete_api',
        version: '1.0.0',
        description: 'Express API with Knex and PostgreSQL, documented with Swagger'
      },
      servers: [
        {
          url: `http://localhost:${PORT}`
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter JWT token obtained from login endpoint'
          }
        }
      }
    },
    apis: ['./src/app.ts', './src/user/routes.ts', './src/customer/routes.ts']
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  // Swagger UI options to enable authorization
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization after page refresh
      displayRequestDuration: true
    }
  };
  
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  /**
   * @openapi
   * /:
   *   get:
   *     summary: Test the Express server and database connection
   *     responses:
   *       200:
   *         description: Server and DB connection successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 dbTest:
   *                   type: object
   *       500:
   *         description: Database connection failed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                 details:
   *                   type: string
   */
  // Test route
  app.get('/', async (req: Request, res: Response) => {
    try {
      const db = Database.getDBInstance();
      // Simple query to test DB connection
      const result = await db.raw('SELECT 1+1 AS result');
      res.json({ message: 'Express server is running!', dbTest: result.rows?.[0] || result });
    } catch (err: any) {
      res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  });

  app.use('/users', userRoutes);
  app.use('/customers', customerRoutes);

  return app;
};

export { createApp };
