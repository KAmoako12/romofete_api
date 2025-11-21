# Contact Us & Mailing List API Documentation

## Overview
This document describes the contact form and mailing list endpoints for the Romofete API.

---

## Contact Us Endpoint

### POST /contact-us
Sends a contact form submission via email to Nicky.babe911@gmail.com.

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "company": "Acme Corp",
  "message": "I would like to inquire about your services."
}
```

**Parameters:**
- `name` (string, required): Name of the person contacting (max 120 characters)
- `email` (string, required): Email address of the person contacting (valid email format, max 120 characters)
- `company` (string, optional): Company name (max 120 characters, can be null or empty)
- `message` (string, required): Message content (max 1000 characters)

**Success Response:** 200 OK
```json
{
  "message": "Message sent successfully"
}
```

**Error Responses:**

400 Bad Request - Invalid input
```json
{
  "error": "\"email\" must be a valid email"
}
```

500 Internal Server Error
```json
{
  "error": "Failed to send email"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:8080/contact-us \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "company": "Acme Corp",
    "message": "I would like to inquire about your services."
  }'
```

**Notes:**
- The message is sent via email only and is not stored in the database
- The company field is optional and can be omitted or set to null
- The email is sent to Nicky.babe911@gmail.com with a formatted HTML template

---

## Mailing List Endpoints

### POST /mailing-list
Adds an email address to the mailing list.

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "subscriber@example.com"
}
```

**Parameters:**
- `email` (string, required): Email address to add to the mailing list (valid email format, max 120 characters)

**Success Response:** 200 OK
```json
{
  "message": "Email added to mailing list successfully"
}
```

**Behavior:**
- If the email already exists in the mailing list, the endpoint returns success without adding a duplicate
- No error is thrown for duplicate emails (idempotent operation)

**Error Responses:**

400 Bad Request - Invalid email format
```json
{
  "error": "\"email\" must be a valid email"
}
```

500 Internal Server Error
```json
{
  "error": "Database error message"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:8080/mailing-list \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com"
  }'
```

---

### GET /mailing-list
Retrieves all email addresses from the mailing list.

**Access:** Admin only (requires authentication)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response:** 200 OK
```json
[
  {
    "id": 1,
    "email": "subscriber1@example.com",
    "created_at": "2023-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "email": "subscriber2@example.com",
    "created_at": "2023-01-02T00:00:00.000Z"
  }
]
```

**Response Fields:**
- `id` (integer): Unique identifier for the mailing list entry
- `email` (string): Email address
- `created_at` (timestamp): When the email was added to the list

**Sorting:**
- Results are sorted by `created_at` in descending order (newest first)

**Error Responses:**

401 Unauthorized - Missing or invalid token
```json
{
  "error": "Access denied. No token provided."
}
```

403 Forbidden - Not an admin user
```json
{
  "error": "Access denied. Insufficient permissions."
}
```

500 Internal Server Error
```json
{
  "error": "Database error message"
}
```

**Example cURL:**
```bash
curl -X GET http://localhost:8080/mailing-list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Database Schema

### mailing_list Table

```sql
CREATE TABLE mailing_list (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Auto-incrementing primary key
- `email`: Unique email address (max 120 characters)
- `created_at`: Timestamp of when the email was added

**Indexes:**
- Primary key on `id`
- Unique constraint on `email`

---

## Email Configuration

Both endpoints use the email service configured with the following environment variables:

```env
SMTP2GO_FROM_EMAIL=noreply@romofete.com
SMTP2GO_API_KEY=your_api_key_here
```

**Contact Us Email Template:**
- Recipient: Nicky.babe911@gmail.com
- Subject: "New Contact Form Submission from [Name]"
- Format: Professional HTML template with all form fields formatted clearly

---

## Usage Examples

### Complete Contact Form Flow

1. **User fills out contact form on website**
   ```javascript
   const contactData = {
     name: "Jane Smith",
     email: "jane.smith@example.com",
     company: "Tech Solutions Inc",
     message: "I'm interested in learning more about your products."
   };
   ```

2. **Frontend sends POST request**
   ```javascript
   fetch('http://localhost:8080/contact-us', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(contactData)
   })
   .then(response => response.json())
   .then(data => console.log(data.message));
   ```

3. **Email is sent to Nicky.babe911@gmail.com**
   - Contains all submitted information
   - Formatted with professional HTML template

---

### Newsletter Subscription Flow

1. **User subscribes to newsletter**
   ```javascript
   const subscriptionData = {
     email: "newsubscriber@example.com"
   };
   ```

2. **Frontend sends POST request**
   ```javascript
   fetch('http://localhost:8080/mailing-list', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(subscriptionData)
   })
   .then(response => response.json())
   .then(data => console.log(data.message));
   ```

3. **Email is added to database**
   - Stored in `mailing_list` table
   - Duplicate emails are handled gracefully

---

### Admin Viewing Mailing List

1. **Admin logs in and gets JWT token**

2. **Admin requests mailing list**
   ```javascript
   fetch('http://localhost:8080/mailing-list', {
     method: 'GET',
     headers: {
       'Authorization': `Bearer ${jwtToken}`
     }
   })
   .then(response => response.json())
   .then(emails => console.log(emails));
   ```

3. **Admin receives array of all subscribers**
   - Sorted by most recent first
   - Can export for email marketing campaigns

---

## Migration

**Migration File:** `20251121225000_create_mailing_list_table.ts`

**Apply Migration:**
```bash
npx knex migrate:latest
```

**Rollback Migration:**
```bash
npx knex migrate:rollback
```

---

## Testing Checklist

### Contact Us Endpoint
- [ ] Send message with all required fields
- [ ] Verify email is received at Nicky.babe911@gmail.com
- [ ] Test with company field populated
- [ ] Test with company field null/empty
- [ ] Test with invalid email format
- [ ] Test with missing required fields
- [ ] Test with message exceeding 1000 characters
- [ ] Verify HTML email formatting

### Mailing List POST Endpoint
- [ ] Add new email to list
- [ ] Verify email is stored in database
- [ ] Add duplicate email (should return success)
- [ ] Verify duplicate is not created in database
- [ ] Test with invalid email format
- [ ] Test with missing email field

### Mailing List GET Endpoint
- [ ] Access without authentication (should fail)
- [ ] Access with customer token (should fail)
- [ ] Access with admin token (should succeed)
- [ ] Verify emails are returned in descending order
- [ ] Verify all fields are present (id, email, created_at)

---

## Security Considerations

1. **Rate Limiting:** Consider implementing rate limiting on the public endpoints to prevent spam
2. **Input Validation:** All inputs are validated using Joi schemas
3. **Email Validation:** Email format is validated before processing
4. **Admin Protection:** GET /mailing-list is protected and requires admin authentication
5. **No Data Exposure:** Public endpoints don't expose sensitive information

---

## Integration Notes

1. **Frontend Integration:**
   - Contact form should validate email format client-side
   - Show success message after form submission
   - Clear form after successful submission
   - Handle errors gracefully with user-friendly messages

2. **Email Marketing:**
   - Export mailing list regularly for campaigns
   - Consider adding unsubscribe functionality in the future
   - Track email engagement metrics

3. **Future Enhancements:**
   - Add email confirmation for new subscribers
   - Add unsubscribe endpoint
   - Add subscriber preferences/segmentation
   - Store contact form submissions in database for reference
   - Add rate limiting to prevent spam

---

## API Documentation

All endpoints are documented in Swagger/OpenAPI format and available at:
```
http://localhost:8080/docs
```

Look for the following tags:
- **Contact** - Contact form endpoint
- **Mailing List** - Mailing list endpoints
