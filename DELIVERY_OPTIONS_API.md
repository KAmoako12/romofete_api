# Delivery Options API Documentation

This document provides examples of how to use the new Delivery Options API endpoints.

## Overview

The Delivery Options API allows you to manage delivery options for your e-commerce platform. It provides CRUD operations for delivery options that can be used by the frontend to calculate shipping costs.

## Base URL
```
http://localhost:8080
```

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Delivery Options
**GET** `/delivery-options`

Returns a list of all available delivery options. This is a public endpoint.

**Example Request:**
```bash
curl -X GET http://localhost:8080/delivery-options
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "Standard Delivery",
    "amount": "5.99",
    "created_at": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Express Delivery",
    "amount": "12.99",
    "created_at": "2023-01-01T00:00:00.000Z"
  }
]
```

### 2. Get Delivery Option by ID
**GET** `/delivery-options/:id`

Returns a specific delivery option by its ID. This is a public endpoint.

**Example Request:**
```bash
curl -X GET http://localhost:8080/delivery-options/1
```

**Example Response:**
```json
{
  "id": 1,
  "name": "Standard Delivery",
  "amount": "5.99",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

### 3. Create Delivery Option
**POST** `/delivery-options`

Creates a new delivery option. Requires admin or superAdmin role.

**Example Request:**
```bash
curl -X POST http://localhost:8080/delivery-options \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Express Delivery",
    "amount": 12.99
  }'
```

**Example Response:**
```json
{
  "id": 2,
  "name": "Express Delivery",
  "amount": "12.99",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

### 4. Update Delivery Option
**PUT** `/delivery-options/:id`

Updates an existing delivery option. Requires admin or superAdmin role.

**Example Request:**
```bash
curl -X PUT http://localhost:8080/delivery-options/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "name": "Premium Express Delivery",
    "amount": 15.99
  }'
```

**Example Response:**
```json
{
  "id": 2,
  "name": "Premium Express Delivery",
  "amount": "15.99",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

### 5. Delete Delivery Option
**DELETE** `/delivery-options/:id`

Deletes a delivery option (soft delete). Requires admin or superAdmin role.

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/delivery-options/2 \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Example Response:**
```json
{
  "message": "Delivery option deleted",
  "deliveryOption": {
    "id": 2,
    "name": "Premium Express Delivery",
    "amount": "15.99",
    "created_at": "2023-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "\"name\" is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
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
  "error": "Delivery option not found"
}
```

### 409 Conflict
```json
{
  "error": "Delivery option with this name already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Database connection failed"
}
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
// Types
interface DeliveryOption {
  id: number;
  name: string;
  amount: string;
  created_at: string;
}

// Get all delivery options
async function getDeliveryOptions(): Promise<DeliveryOption[]> {
  const response = await fetch('/delivery-options');
  if (!response.ok) {
    throw new Error('Failed to fetch delivery options');
  }
  return response.json();
}

// Calculate total with delivery
function calculateTotalWithDelivery(subtotal: number, deliveryOption: DeliveryOption): number {
  return subtotal + parseFloat(deliveryOption.amount);
}

// Usage example
const deliveryOptions = await getDeliveryOptions();
const selectedOption = deliveryOptions[0]; // User selects standard delivery
const subtotal = 99.99;
const total = calculateTotalWithDelivery(subtotal, selectedOption);
console.log(`Total: $${total.toFixed(2)}`); // Total: $105.98
```

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';

interface DeliveryOption {
  id: number;
  name: string;
  amount: string;
  created_at: string;
}

const DeliverySelector: React.FC<{ onSelect: (option: DeliveryOption) => void }> = ({ onSelect }) => {
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [selected, setSelected] = useState<DeliveryOption | null>(null);

  useEffect(() => {
    fetch('/delivery-options')
      .then(res => res.json())
      .then(setOptions)
      .catch(console.error);
  }, []);

  const handleSelect = (option: DeliveryOption) => {
    setSelected(option);
    onSelect(option);
  };

  return (
    <div>
      <h3>Select Delivery Option</h3>
      {options.map(option => (
        <label key={option.id} className="delivery-option">
          <input
            type="radio"
            name="delivery"
            checked={selected?.id === option.id}
            onChange={() => handleSelect(option)}
          />
          {option.name} - ${option.amount}
        </label>
      ))}
    </div>
  );
};
```

## Database Schema

The delivery options are stored in the `delivery_options` table with the following structure:

```sql
CREATE TABLE delivery_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

## API Documentation

Full API documentation is available at: `http://localhost:8080/docs`

This includes interactive Swagger UI where you can test all endpoints directly from the browser.
