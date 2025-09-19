# Customers API Documentation

This document provides comprehensive examples of how to use the Customers API endpoints for customer management.

## Overview

The Customers API provides customer account management functionality including:
- Customer registration and authentication
- Profile management and updates
- Admin customer management
- Secure password handling
- Role-based access control

## Base URL
```
http://localhost:8080
```

## Authentication

Most endpoints require authentication using a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Register Customer
**POST** `/customers/register`

Creates a new customer account. This is a public endpoint.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "phone": "+1234567890"
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA",
  "email": "john.doe@example.com",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

### 2. Customer Login
**POST** `/customers/login`

Authenticates a customer and returns a JWT token. This is a public endpoint.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }'
```

**Example Response:**
```json
{
  "customer": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get All Customers (Admin Only)
**GET** `/customers`

Retrieves a list of all customers. Only accessible by admin users.

**Example Request:**
```bash
curl -X GET http://localhost:8080/customers \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567891",
    "is_active": true,
    "created_at": "2023-01-02T00:00:00.000Z"
  }
]
```

### 4. Get Customer by ID
**GET** `/customers/{id}`

Retrieves a specific customer by their ID. Accessible by admin users or the customer themselves.

**Example Request:**
```bash
curl -X GET http://localhost:8080/customers/1 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

### 5. Update Customer
**PUT** `/customers/{id}`

Updates a specific customer by their ID. Accessible by admin users or the customer themselves.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+1234567890",
  "address": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zip_code": "90210"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:8080/customers/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "first_name": "John",
    "last_name": "Smith",
    "phone": "+1234567890"
  }'
```

**Example Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "address": "456 Oak Ave",
  "city": "Los Angeles",
  "state": "CA",
  "zip_code": "90210",
  "country": "USA",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

### 6. Delete Customer (Admin Only)
**DELETE** `/customers/{id}`

Soft deletes a specific customer by their ID. Only accessible by admin users.

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/customers/1 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
{
  "message": "Customer deleted",
  "customer": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "is_active": false,
    "created_at": "2023-01-01T00:00:00.000Z"
  }
}
```

## Frontend Integration Examples

### React Customer Registration Component

```tsx
import React, { useState } from 'react';

interface CustomerRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

const CustomerRegistration: React.FC = () => {
  const [formData, setFormData] = useState<CustomerRegistrationData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const customer = await response.json();
      console.log('Registration successful:', customer);
      
      // Redirect to login or automatically log in
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="customer-registration">
      <h2>Create Account</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-row">
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
      </div>

      <input
        type="email"
        name="email"
        placeholder="Email Address"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password (min 8 characters)"
        value={formData.password}
        onChange={handleChange}
        minLength={8}
        required
      />

      <input
        type="tel"
        name="phone"
        placeholder="Phone Number"
        value={formData.phone}
        onChange={handleChange}
      />

      <input
        type="text"
        name="address"
        placeholder="Street Address"
        value={formData.address}
        onChange={handleChange}
      />

      <div className="form-row">
        <input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleChange}
        />
        <input
          type="text"
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleChange}
        />
        <input
          type="text"
          name="zip_code"
          placeholder="ZIP Code"
          value={formData.zip_code}
          onChange={handleChange}
        />
      </div>

      <input
        type="text"
        name="country"
        placeholder="Country"
        value={formData.country}
        onChange={handleChange}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default CustomerRegistration;
```

### Customer Login Component

```tsx
import React, { useState } from 'react';

interface LoginCredentials {
  email: string;
  password: string;
}

const CustomerLogin: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/customers/login', {
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

      const { customer, token } = await response.json();
      
      // Store token and customer data
      localStorage.setItem('token', token);
      localStorage.setItem('customer', JSON.stringify(customer));
      
      // Redirect to dashboard or home
      window.location.href = '/dashboard';
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
    <form onSubmit={handleSubmit} className="customer-login">
      <h2>Sign In</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <input
        type="email"
        name="email"
        placeholder="Email Address"
        value={credentials.email}
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
      
      <p>
        Don't have an account? <a href="/register">Create one here</a>
      </p>
    </form>
  );
};

export default CustomerLogin;
```

### Customer Profile Management

```tsx
import React, { useState, useEffect } from 'react';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
}

const CustomerProfile: React.FC = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      const storedCustomer = localStorage.getItem('customer');
      if (storedCustomer) {
        const customerData = JSON.parse(storedCustomer);
        
        // Fetch fresh data from API
        const response = await fetch(`/customers/${customerData.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const freshCustomerData = await response.json();
          setCustomer(freshCustomerData);
          setFormData(freshCustomerData);
        }
      }
    } catch (err) {
      console.error('Error fetching customer profile:', err);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData(customer || {});
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData(customer || {});
    setError('');
  };

  const handleSave = async () => {
    if (!customer) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      const updatedCustomer = await response.json();
      setCustomer(updatedCustomer);
      localStorage.setItem('customer', JSON.stringify(updatedCustomer));
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!customer) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="customer-profile">
      <h2>My Profile</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="profile-section">
        <h3>Personal Information</h3>
        
        {editing ? (
          <div className="edit-form">
            <div className="form-row">
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name || ''}
                onChange={handleChange}
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name || ''}
                onChange={handleChange}
              />
            </div>
            
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email || ''}
              onChange={handleChange}
            />
            
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone || ''}
              onChange={handleChange}
            />
            
            <div className="form-actions">
              <button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancel} type="button">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-display">
            <p><strong>Name:</strong> {customer.first_name} {customer.last_name}</p>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Phone:</strong> {customer.phone || 'Not provided'}</p>
            <p><strong>Member since:</strong> {new Date(customer.created_at).toLocaleDateString()}</p>
            
            <button onClick={handleEdit}>Edit Profile</button>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>Address Information</h3>
        
        {editing ? (
          <div className="address-form">
            <input
              type="text"
              name="address"
              placeholder="Street Address"
              value={formData.address || ''}
              onChange={handleChange}
            />
            
            <div className="form-row">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city || ''}
                onChange={handleChange}
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state || ''}
                onChange={handleChange}
              />
              <input
                type="text"
                name="zip_code"
                placeholder="ZIP Code"
                value={formData.zip_code || ''}
                onChange={handleChange}
              />
            </div>
            
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country || ''}
              onChange={handleChange}
            />
          </div>
        ) : (
          <div className="address-display">
            <p><strong>Address:</strong> {customer.address || 'Not provided'}</p>
            <p><strong>City:</strong> {customer.city || 'Not provided'}</p>
            <p><strong>State:</strong> {customer.state || 'Not provided'}</p>
            <p><strong>ZIP Code:</strong> {customer.zip_code || 'Not provided'}</p>
            <p><strong>Country:</strong> {customer.country || 'Not provided'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
```

### Customer Service Class

```typescript
interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  is_active: boolean;
  created_at: string;
}

interface CustomerRegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

class CustomerService {
  async register(data: CustomerRegistrationData): Promise<Customer> {
    const response = await fetch('/customers/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<{ customer: Customer; token: string }> {
    const response = await fetch('/customers/login', {
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
    
    // Store token and customer data
    localStorage.setItem('token', result.token);
    localStorage.setItem('customer', JSON.stringify(result.customer));
    
    return result;
  }

  async getProfile(customerId: number): Promise<Customer> {
    const response = await fetch(`/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  }

  async updateProfile(customerId: number, data: Partial<Customer>): Promise<Customer> {
    const response = await fetch(`/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }

    const updatedCustomer = await response.json();
    localStorage.setItem('customer', JSON.stringify(updatedCustomer));
    
    return updatedCustomer;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    window.location.href = '/login';
  }

  getCurrentCustomer(): Customer | null {
    const customerData = localStorage.getItem('customer');
    return customerData ? JSON.parse(customerData) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export default new CustomerService();
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "\"email\" must be a valid email"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid email or password"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. You can only access your own profile."
}
```

### 404 Not Found
```json
{
  "error": "Customer not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

## Security Considerations

### 1. Password Requirements
- Minimum 8 characters
- Passwords are hashed using bcrypt
- Never store plain text passwords

### 2. JWT Token Management
- Tokens expire after a set time
- Store tokens securely (httpOnly cookies recommended for production)
- Implement token refresh mechanism

### 3. Access Control
- Customers can only access/modify their own data
- Admin users can access all customer data
- Proper role validation on all endpoints

### 4. Data Validation
- All input is validated using Joi schemas
- Email format validation
- Phone number format validation
- Required field validation

## Best Practices

### 1. Registration Flow
```javascript
// Validate email before registration
const checkEmailAvailability = async (email) => {
  // Implementation depends on your backend
  // You might want to add an endpoint for this
};

// Complete registration with validation
const registerCustomer = async (data) => {
  try {
    // Validate required fields
    if (!data.email || !data.password) {
      throw new Error('Email and password are required');
    }
    
    // Check password strength
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    const customer = await CustomerService.register(data);
    return customer;
  } catch (error) {
    throw error;
  }
};
```

### 2. Authentication State Management
```javascript
// Check authentication status
const checkAuthStatus = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  return true;
};

// Auto-logout on token expiration
const setupTokenExpiration = () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Decode JWT to check expiration (you'll need a JWT library)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    if (currentTime >= expirationTime) {
      CustomerService.logout();
    } else {
      // Set timeout to logout when token expires
      setTimeout(() => {
        CustomerService.logout();
      }, expirationTime - currentTime);
    }
  }
};
```

### 3. Profile Updates
```javascript
// Validate profile data before update
const updateProfile = async (customerId, data) => {
  // Remove empty fields
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== '' && value !== null)
  );
  
  try {
    const updatedCustomer = await CustomerService.updateProfile(customerId, cleanData);
    showSuccess('Profile updated successfully');
    return updatedCustomer;
  } catch (error) {
    showError(error.message);
    throw error;
  }
};
```

## API Documentation

Full interactive API documentation is available at: `http://localhost:8080/docs`

This includes all endpoints with request/response examples and the ability to test endpoints directly from the browser.
