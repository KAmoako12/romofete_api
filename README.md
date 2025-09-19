# Romofete API

A comprehensive e-commerce API built with Node.js, TypeScript, Express, and PostgreSQL. This API provides full functionality for managing products, orders, customers, users, and delivery options.

## 🚀 Features

- **Product Management**: Full CRUD operations with inventory tracking, search, and filtering
- **Order Management**: Order creation, tracking, payment status, and cancellation
- **Customer Management**: Registration, authentication, and profile management
- **User Management**: Admin user creation and role-based access control
- **Delivery Options**: Configurable shipping options with pricing
- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **Database Migrations**: Structured database schema with Knex.js
- **API Documentation**: Comprehensive documentation with examples

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## 🛠 Installation

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or pnpm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/KAmoako12/romofete_api.git
cd romofete_api
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/romofete_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=romofete_db

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Server
PORT=8080
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🗄 Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE romofete_db;
```

2. Run migrations:
```bash
pnpm run migrate
# or
npm run migrate
```

3. (Optional) Seed the database:
```bash
pnpm run seed
# or
npm run seed
```

## 📚 API Documentation

The API is organized into several modules, each with comprehensive documentation:

### Core APIs
- **[Products API](./PRODUCTS_API.md)** - Product catalog management, inventory, search, and filtering
- **[Orders API](./ORDERS_API.md)** - Order creation, tracking, payment status, and management
- **[Customers API](./CUSTOMERS_API.md)** - Customer registration, authentication, and profile management
- **[Users API](./USERS_API.md)** - Admin user management and role-based access control
- **[Delivery Options API](./DELIVERY_OPTIONS_API.md)** - Shipping options and pricing management

### Base URL
```
http://localhost:8080
```

### Interactive Documentation
Once the server is running, visit `http://localhost:8080/docs` for interactive Swagger documentation.

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication with role-based access control.

### User Types
- **Customer**: Regular users who can place orders and manage their profiles
- **Admin**: Administrative users who can manage products, orders, and customers
- **SuperAdmin**: Highest level users who can create other admin users

### Authentication Flow

1. **Customer Registration/Login**:
```bash
# Register
POST /customers/register
# Login
POST /customers/login
```

2. **Admin Login**:
```bash
POST /users/login
```

3. **Using JWT Token**:
```bash
curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:8080/protected-endpoint
```

### Example Authentication

```javascript
// Customer login
const response = await fetch('/customers/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'customer@example.com',
    password: 'password123'
  })
});

const { customer, token } = await response.json();
localStorage.setItem('token', token);

// Use token for authenticated requests
const protectedResponse = await fetch('/orders/my-orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📁 Project Structure

```
romofete_api/
├── src/
│   ├── _services/           # Shared services and utilities
│   │   ├── authService.ts   # Authentication middleware
│   │   ├── databaseService.ts # Database connection
│   │   ├── modelTypes.ts    # TypeScript interfaces
│   │   └── types.ts         # Type definitions
│   ├── customer/            # Customer module
│   │   ├── routes.ts        # Customer routes
│   │   ├── services.ts      # Customer business logic
│   │   ├── schemas.ts       # Validation schemas
│   │   └── query.ts         # Database queries
│   ├── delivery-option/     # Delivery options module
│   ├── order/               # Orders module
│   ├── product/             # Products module
│   ├── user/                # Admin users module
│   ├── migrations/          # Database migrations
│   └── app.ts               # Express app setup
├── tests/                   # Test files
├── docs/                    # API documentation
│   ├── PRODUCTS_API.md
│   ├── ORDERS_API.md
│   ├── CUSTOMERS_API.md
│   ├── USERS_API.md
│   └── DELIVERY_OPTIONS_API.md
├── knexfile.ts             # Database configuration
├── package.json
└── README.md
```

## 🚀 Development

### Available Scripts

```bash
# Start development server with hot reload
pnpm dev
npm run dev

# Build for production
pnpm build
npm run build

# Start production server
pnpm start
npm start

# Run database migrations
pnpm run migrate
npm run migrate

# Rollback migrations
pnpm run migrate:rollback
npm run migrate:rollback

# Run tests
pnpm test
npm test

# Run tests in watch mode
pnpm test:watch
npm run test:watch
```

### Development Workflow

1. **Start the development server**:
```bash
pnpm dev
```

2. **Make changes** to the code - the server will automatically restart

3. **Test your changes** using the interactive documentation at `http://localhost:8080/docs`

4. **Run tests** to ensure everything works:
```bash
pnpm test
```

### Adding New Features

1. **Create a new module** in the `src/` directory
2. **Define routes** in `routes.ts`
3. **Implement business logic** in `services.ts`
4. **Add validation schemas** in `schemas.ts`
5. **Create database queries** in `query.ts`
6. **Add tests** in the `tests/` directory
7. **Update documentation**

## 🧪 Testing

The project uses Jest for testing with comprehensive test coverage.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

```
tests/
├── setup.ts              # Test configuration
├── user.e2e.test.ts      # User endpoint tests
├── customer.e2e.test.ts  # Customer endpoint tests
├── product.e2e.test.ts   # Product endpoint tests
└── order.e2e.test.ts     # Order endpoint tests
```

### Writing Tests

```typescript
import request from 'supertest';
import app from '../src/app';

describe('Products API', () => {
  test('GET /products should return products list', async () => {
    const response = await request(app)
      .get('/products')
      .expect(200);
    
    expect(response.body).toHaveProperty('products');
    expect(Array.isArray(response.body.products)).toBe(true);
  });
});
```

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**:
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
PORT=8080
```

2. **Build the application**:
```bash
pnpm build
```

3. **Run migrations**:
```bash
pnpm run migrate
```

4. **Start the server**:
```bash
pnpm start
```

### Docker Deployment

1. **Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
```

2. **Build and run**:
```bash
docker build -t romofete-api .
docker run -p 8080:8080 romofete-api
```

### Deployment Platforms

The API can be deployed to various platforms:

- **Heroku**: Use the provided `Procfile`
- **Railway**: Connect your GitHub repository
- **DigitalOcean App Platform**: Use the app spec configuration
- **AWS/GCP/Azure**: Deploy using their respective container services

## 🔧 Configuration

### Database Configuration

The application uses Knex.js for database operations. Configuration is in `knexfile.ts`:

```typescript
const config = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: './src/migrations',
    },
  },
  // ... other environments
};
```

### CORS Configuration

CORS is configured in `src/app.ts`:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
```

## 📊 API Endpoints Overview

### Products
- `GET /products` - List products with filtering and pagination
- `POST /products` - Create product (admin)
- `GET /products/:id` - Get product by ID
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Delete product (admin)
- `GET /products/featured` - Get featured products
- `PATCH /products/:id/stock` - Update product stock (admin)

### Orders
- `POST /orders` - Create order
- `GET /orders` - List orders (admin)
- `GET /orders/my-orders` - Get user's orders
- `GET /orders/:id` - Get order by ID
- `PUT /orders/:id` - Update order (admin)
- `PATCH /orders/:id/cancel` - Cancel order

### Customers
- `POST /customers/register` - Register customer
- `POST /customers/login` - Customer login
- `GET /customers` - List customers (admin)
- `GET /customers/:id` - Get customer by ID
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer (admin)

### Users (Admin)
- `POST /users` - Create user (superAdmin)
- `POST /users/login` - User login
- `GET /users` - List users (admin)
- `GET /users/:id` - Get user by ID (admin)
- `DELETE /users/:id` - Delete user (admin)

### Delivery Options
- `GET /delivery-options` - List delivery options
- `POST /delivery-options` - Create delivery option (admin)
- `GET /delivery-options/:id` - Get delivery option by ID
- `PUT /delivery-options/:id` - Update delivery option (admin)
- `DELETE /delivery-options/:id` - Delete delivery option (admin)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [API documentation](./docs/)
2. Review the [issues](https://github.com/KAmoako12/romofete_api/issues) on GitHub
3. Create a new issue if your problem isn't already reported

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database management with [Knex.js](https://knexjs.org/)
- Authentication with [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- Validation with [Joi](https://joi.dev/)
- Testing with [Jest](https://jestjs.io/)

---

**Happy coding! 🚀**
