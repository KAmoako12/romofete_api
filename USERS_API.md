# Users API Documentation

This document provides comprehensive examples of how to use the Users API endpoints for admin user management.

## Overview

The Users API provides admin user management functionality including:
- User creation and authentication (admin/superAdmin roles)
- User profile management
- Role-based access control
- Secure password handling
- Administrative operations

## Base URL
```
http://localhost:8080
```

## Authentication

All endpoints require authentication using a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles

- **superAdmin**: Highest level access, can create other users
- **admin**: Administrative access, can manage customers and products

## Endpoints

### 1. Create User (SuperAdmin Only)
**POST** `/users`

Creates a new admin user. Only accessible by superAdmin users.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "admin"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "admin"
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "admin",
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-01-01T00:00:00.000Z"
}
```

### 2. User Login
**POST** `/users/login`

Authenticates a user and returns a JWT token. This is a public endpoint.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepassword123"
  }'
```

**Example Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get All Users (Admin Only)
**GET** `/users`

Retrieves a list of all admin users. Only accessible by admin users.

**Example Request:**
```bash
curl -X GET http://localhost:8080/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "username": "jane_admin",
    "email": "jane@example.com",
    "role": "superAdmin",
    "created_at": "2023-01-02T00:00:00.000Z",
    "updated_at": "2023-01-02T00:00:00.000Z"
  }
]
```

### 4. Get User by ID (Admin Only)
**GET** `/users/{id}`

Retrieves a specific user by their ID. Only accessible by admin users.

**Example Request:**
```bash
curl -X GET http://localhost:8080/users/1 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "admin",
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-01-01T00:00:00.000Z"
}
```

### 5. Delete User (Admin Only)
**DELETE** `/users/{id}`

Deletes a specific user by their ID. Only accessible by admin users.

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/users/1 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
{
  "message": "User deleted",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### 6. Demo Endpoints

The following endpoints demonstrate different access control patterns:

#### Admin Only Endpoint
**GET** `/users/admin-only`

Only accessible by users with admin or superAdmin role.

**Example Request:**
```bash
curl -X GET http://localhost:8080/users/admin-only \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Super Admin Only Endpoint
**GET** `/users/super-admin-only`

Only accessible by users with superAdmin role.

**Example Request:**
```bash
curl -X GET http://localhost:8080/users/super-admin-only \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Admin User Type Only Endpoint
**GET** `/users/admin-type-only`

Only accessible by users with admin user type.

**Example Request:**
```bash
curl -X GET http://localhost:8080/users/admin-type-only \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Customer User Type Only Endpoint
**GET** `/users/customer-type-only`

Only accessible by users with customer user type.

**Example Request:**
```bash
curl -X GET http://localhost:8080/users/customer-type-only \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Combined Role and User Type Endpoint
**GET** `/users/admin-role-and-admin-type`

Only accessible by users with admin role AND admin user type.

**Example Request:**
```bash
curl -X GET http://localhost:8080/users/admin-role-and-admin-type \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Frontend Integration Examples

### React Admin User Management Component

```tsx
import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'superAdmin';
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'superAdmin';
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const usersData = await response.json();
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(createUserData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      setShowCreateForm(false);
      setCreateUserData({ username: '', email: '', password: '', role: 'admin' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCreateUserData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="user-management">
      <div className="header">
        <h2>User Management</h2>
        <button onClick={() => setShowCreateForm(true)}>
          Create New User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="create-user-form">
          <h3>Create New User</h3>
          <form onSubmit={createUser}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={createUserData.username}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={createUserData.email}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              value={createUserData.password}
              onChange={handleInputChange}
              minLength={8}
              required
            />
            <select
              name="role"
              value={createUserData.role}
              onChange={handleInputChange}
              required
            >
              <option value="admin">Admin</option>
              <option value="superAdmin">Super Admin</option>
            </select>
            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showCreateForm ? (
        <div>Loading users...</div>
      ) : (
        <div className="users-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => deleteUser(user.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
```

### Admin Login Component

```tsx
import React, { useState } from 'react';

interface LoginCredentials {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { user, token } = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to admin dashboard
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <h2>Admin Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={credentials.username}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
```

### User Service Class

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'superAdmin';
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'superAdmin';
}

interface LoginCredentials {
  username: string;
  password: string;
}

class UserService {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch('/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    
    // Store token and user data
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    return result;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await fetch('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    return response.json();
  }

  async getAllUsers(): Promise<User[]> {
    const response = await fetch('/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  async getUserById(userId: number): Promise<User> {
    const response = await fetch(`/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }

  async deleteUser(userId: number): Promise<{ message: string; user: User }> {
    const response = await fetch(`/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }

    return response.json();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  hasRole(role: 'admin' | 'superAdmin'): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (role === 'admin') {
      return user.role === 'admin' || user.role === 'superAdmin';
    }
    
    return user.role === role;
  }
}

export default new UserService();
```

### Authentication Guard Hook

```typescript
import { useEffect, useState } from 'react';
import UserService from './UserService';

interface UseAuthGuardOptions {
  requiredRole?: 'admin' | 'superAdmin';
  redirectTo?: string;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = UserService.isAuthenticated();
      const currentUser = UserService.getCurrentUser();
      
      setIsAuthenticated(authenticated);
      setUser(currentUser);

      if (!authenticated) {
        setIsAuthorized(false);
        setLoading(false);
        if (options.redirectTo) {
          window.location.href = options.redirectTo;
        }
        return;
      }

      // Check role authorization
      if (options.requiredRole) {
        const authorized = UserService.hasRole(options.requiredRole);
        setIsAuthorized(authorized);
        
        if (!authorized && options.redirectTo) {
          window.location.href = options.redirectTo;
        }
      } else {
        setIsAuthorized(true);
      }

      setLoading(false);
    };

    checkAuth();
  }, [options.requiredRole, options.redirectTo]);

  return {
    isAuthenticated,
    isAuthorized,
    loading,
    user
  };
};

// Usage example:
const AdminDashboard: React.FC = () => {
  const { isAuthenticated, isAuthorized, loading, user } = useAuthGuard({
    requiredRole: 'admin',
    redirectTo: '/admin/login'
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !isAuthorized) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      {/* Dashboard content */}
    </div>
  );
};
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "\"username\" is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid username or password"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Insufficient role."
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

## Security Considerations

### 1. Role-Based Access Control
- **superAdmin**: Can create other admin users
- **admin**: Can manage customers, products, and orders
- Proper role validation on all endpoints

### 2. Password Security
- Minimum 8 characters required
- Passwords are hashed using bcrypt
- Never store plain text passwords

### 3. JWT Token Management
- Tokens expire after a set time
- Store tokens securely
- Implement proper token validation

### 4. Input Validation
- All input validated using Joi schemas
- Username and email uniqueness enforced
- Required field validation

## Best Practices

### 1. User Creation
```javascript
// Validate user data before creation
const createUser = async (userData) => {
  try {
    // Validate required fields
    if (!userData.username || !userData.email || !userData.password) {
      throw new Error('Username, email, and password are required');
    }
    
    // Check password strength
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    const user = await UserService.createUser(userData);
    return user;
  } catch (error) {
    throw error;
  }
};
```

### 2. Authentication Management
```javascript
// Check authentication status on app load
const initializeAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Verify token is still valid
    UserService.getCurrentUser();
  } else {
    // Redirect to login
    window.location.href = '/admin/login';
  }
};

// Auto-logout on token expiration
const setupTokenExpiration = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        UserService.logout();
      } else {
        setTimeout(() => {
          UserService.logout();
        }, expirationTime - currentTime);
      }
    } catch (error) {
      // Invalid token format
      UserService.logout();
    }
  }
};
```

### 3. Role-Based UI
```javascript
// Show/hide UI elements based on user role
const AdminActions: React.FC = () => {
  const user = UserService.getCurrentUser();
  const isSuperAdmin = user?.role === 'superAdmin';

  return (
    <div className="admin-actions">
      <button>Manage Products</button>
      <button>Manage Orders</button>
      <button>Manage Customers</button>
      
      {isSuperAdmin && (
        <button>Manage Users</button>
      )}
    </div>
  );
};
```

## API Documentation

Full interactive API documentation is available at: `http://localhost:8080/docs`

This includes all endpoints with request/response examples and the ability to test endpoints directly from the browser.
