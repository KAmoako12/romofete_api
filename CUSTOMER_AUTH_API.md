# Customer Authentication API Documentation

## Overview
This document describes the email verification and password reset flows for customer accounts.

## Email Verification Flow

### How It Works
1. Customer registers with email and password
2. System generates a 6-digit verification code
3. Verification code is sent via email
4. Code expires after 2 days
5. Customer must verify email before logging in

### Endpoints

#### 1. Register Customer (POST /customers/register)
Creates a new customer account and sends verification email.

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

**Note:** A verification email with a 6-digit code is automatically sent to the customer's email.

---

#### 2. Verify Email (POST /customers/verify-email)
Verifies customer's email using the email address and 6-digit code.

**Request:**
```json
{
  "email": "customer@example.com",
  "code": "123456"
}
```

**Response:** 200 OK
```json
{
  "message": "Email verified successfully",
  "customer": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "email_verified": true,
    "created_at": "2023-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- 400: Invalid code format or email
- 401: Invalid or expired verification code

---

#### 3. Resend Verification Email (POST /customers/resend-verification)
Resends verification email with a new code.

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response:** 200 OK
```json
{
  "message": "Verification email sent successfully"
}
```

**Error Responses:**
- 400: Email already verified
- 404: Customer not found

---

#### 4. Login (POST /customers/login)
Authenticates customer and returns JWT token.

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123"
}
```

**Response:** 200 OK
```json
{
  "customer": {
    "id": 1,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- 401: Invalid credentials
- 401: "Please verify your email before logging in" (if email not verified)

---

## Password Reset Flow

### How It Works
1. Customer requests password reset
2. System generates a 6-digit reset code
3. Reset code is sent via email
4. Code expires after 24 hours
5. Customer uses code to set new password
6. Confirmation email is sent after successful reset

### Endpoints

#### 1. Request Password Reset (POST /customers/request-password-reset)
Sends password reset code to customer's email.

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response:** 200 OK
```json
{
  "message": "If an account exists with this email, a password reset code has been sent"
}
```

**Note:** For security, the response is the same whether the email exists or not.

---

#### 2. Reset Password (POST /customers/reset-password)
Resets password using the 6-digit code.

**Request:**
```json
{
  "code": "123456",
  "new_password": "newSecurePassword456"
}
```

**Response:** 200 OK
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- 400: Invalid input (code format or password requirements)
- 401: Invalid or expired reset code

**Note:** A confirmation email is automatically sent after successful password reset.

---

## Email Templates

### Verification Email
- **Subject:** "Verify Your Email - Romofete"
- **Content:** Includes 6-digit verification code
- **Expiry:** 2 days
- **Design:** Professional HTML template with clear code display

### Password Reset Email
- **Subject:** "Reset Your Password - Romofete"
- **Content:** Includes 6-digit reset code
- **Expiry:** 24 hours
- **Design:** Professional HTML template with security notice

### Password Changed Confirmation Email
- **Subject:** "Password Changed Successfully - Romofete"
- **Content:** Confirms password change with timestamp
- **Security:** Alerts user to contact support if they didn't make the change

---

## Security Features

### Email Verification
- ✅ Customers cannot login until email is verified
- ✅ Verification codes expire after 2 days
- ✅ Codes are 6-digit numeric for easy entry
- ✅ Users can request new codes if expired

### Password Reset
- ✅ Doesn't reveal if email exists (same response for all requests)
- ✅ Reset codes expire after 24 hours
- ✅ Codes are single-use (cleared after successful reset)
- ✅ Confirmation email sent after password change
- ✅ Old sessions remain valid (user should re-login)

### Code Generation
- ✅ Cryptographically random 6-digit codes (100,000 - 999,999)
- ✅ Stored with expiration timestamps
- ✅ Database indexes for efficient lookups
- ✅ Codes cleared after use

---

## Database Schema

### Customers Table Additions

```sql
-- Email verification columns
email_verified BOOLEAN DEFAULT false
verification_code VARCHAR(6) NULL
verification_code_expires TIMESTAMP NULL

-- Password reset columns
reset_code VARCHAR(6) NULL
reset_code_expires TIMESTAMP NULL

-- Indexes
INDEX idx_verification_code (verification_code)
INDEX idx_reset_code (reset_code)
```

---

## Complete User Flow Examples

### New Customer Registration & Login

1. **Register**
   ```bash
   POST /customers/register
   {
     "email": "newuser@example.com",
     "password": "SecurePass123",
     "first_name": "Jane",
     "last_name": "Smith"
   }
   ```
   → Customer created, verification email sent

2. **Receive Email**
   → Customer receives email with code: `456789`

3. **Verify Email**
   ```bash
   POST /customers/verify-email
   {
     "email": "newuser@example.com",
     "code": "456789"
   }
   ```
   → Email verified successfully

4. **Login**
   ```bash
   POST /customers/login
   {
     "email": "newuser@example.com",
     "password": "SecurePass123"
   }
   ```
   → Returns customer data and JWT token

---

### Forgot Password Flow

1. **Request Reset**
   ```bash
   POST /customers/request-password-reset
   {
     "email": "newuser@example.com"
   }
   ```
   → Reset email sent

2. **Receive Email**
   → Customer receives email with code: `789123`

3. **Reset Password**
   ```bash
   POST /customers/reset-password
   {
     "code": "789123",
     "new_password": "NewSecurePass456"
   }
   ```
   → Password updated, confirmation email sent

4. **Login with New Password**
   ```bash
   POST /customers/login
   {
     "email": "newuser@example.com",
     "password": "NewSecurePass456"
   }
   ```
   → Successfully logged in

---

### Resend Verification

1. **Try to Login (unverified)**
   ```bash
   POST /customers/login
   {
     "email": "newuser@example.com",
     "password": "SecurePass123"
   }
   ```
   → Error: "Please verify your email before logging in"

2. **Resend Verification**
   ```bash
   POST /customers/resend-verification
   {
     "email": "newuser@example.com"
   }
   ```
   → New verification email sent

3. **Verify with New Code**
   ```bash
   POST /customers/verify-email
   {
     "email": "newuser@example.com",
     "code": "654321"
   }
   ```
   → Email verified

4. **Login**
   → Now able to login successfully

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "Verification code must be exactly 6 digits"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid or expired verification code"
}
```
```json
{
  "error": "Please verify your email before logging in"
}
```

**404 Not Found**
```json
{
  "error": "Customer not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to send verification email"
}
```

---

## Testing Checklist

### Email Verification
- [ ] Register new customer
- [ ] Verify verification email received
- [ ] Verify with correct code
- [ ] Try to login before verification (should fail)
- [ ] Verify email successfully
- [ ] Login after verification (should succeed)
- [ ] Try to verify with expired code
- [ ] Resend verification email
- [ ] Try to resend for already verified email

### Password Reset
- [ ] Request password reset
- [ ] Verify reset email received
- [ ] Reset password with correct code
- [ ] Verify confirmation email received
- [ ] Login with new password
- [ ] Try to reset with expired code
- [ ] Try to reuse same reset code
- [ ] Request reset for non-existent email (should return generic message)

### Security
- [ ] Verify codes expire correctly (2 days for verification, 24 hours for reset)
- [ ] Verify codes are cleared after use
- [ ] Verify unverified users cannot login
- [ ] Verify password requirements enforced (min 8 characters)
- [ ] Verify code format validation (6 digits)

---

## Configuration

### Environment Variables

Required for email functionality:
```env
MAILERSEND_API_KEY=your_api_key_here
MAILERSEND_FROM_EMAIL=noreply@romofete.com
```

Optional for SMS notifications:
```env
ARKESL_SMS_SENDER_ID=ROMOFETE
```

---

## Migration Details

**Migration File:** `20251112204000_add_verification_reset_to_customers.ts`

**Changes:**
- Adds `email_verified` column (default: false)
- Adds `verification_code` and `verification_code_expires` columns
- Adds `reset_code` and `reset_code_expires` columns
- Creates indexes for efficient code lookups

**Rollback:**
- Removes all added columns

---

## Implementation Notes

1. **Email Service:** Uses existing MailerSend integration
2. **Code Generation:** Random 6-digit numbers (100000-999999)
3. **Expiration:**
   - Verification codes: 2 days (48 hours)
   - Reset codes: 24 hours
4. **Soft Delete:** Customers maintain verification status even after soft delete
5. **Security:** Passwords hashed with bcrypt (10 salt rounds)
6. **Validation:** Joi schemas enforce all input requirements
7. **Error Messages:** Designed to not reveal sensitive information

---

## API Documentation

All endpoints are documented in Swagger/OpenAPI format and available at:
```
http://localhost:8080/docs
```

Look for the "Customers" tag to find all customer-related endpoints including:
- `/customers/register`
- `/customers/login`
- `/customers/verify-email`
- `/customers/resend-verification`
- `/customers/request-password-reset`
- `/customers/reset-password`
