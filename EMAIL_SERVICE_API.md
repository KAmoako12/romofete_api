# Email Service API Documentation

## Overview

The Email Service integrates MailerSend API to provide comprehensive email functionality including basic emails, template-based emails, bulk email sending, and attachment support.

## Setup

### 1. Install Dependencies

The service uses `axios` which should already be installed. If not:

```bash
npm install axios
# or
pnpm install axios
```

### 2. Configure Environment Variables

Add your MailerSend API key to your `.env` file:

```env
MAILERSEND_API_KEY=your_mailersend_api_key_here
```

You can obtain your API key from the [MailerSend Dashboard](https://app.mailersend.com/).

### 3. Import the Service

```typescript
import { EmailService } from './src/_services/emailService';
```

## API Reference

### Basic Email Functions

#### 1. Send Simple Email

Send a basic email with plain text and optional HTML content.

```typescript
const result = await EmailService.sendSimpleEmail(
  'sender@example.com',
  'recipient@example.com',
  'Hello World',
  'This is the plain text content',
  '<p>This is the <strong>HTML</strong> content</p>'
);

console.log('Message ID:', result.messageId);
```

**Multiple Recipients:**
```typescript
const result = await EmailService.sendSimpleEmail(
  'sender@example.com',
  ['recipient1@example.com', 'recipient2@example.com'],
  'Hello World',
  'This is the plain text content',
  '<p>This is the <strong>HTML</strong> content</p>'
);
```

#### 2. Send Template-Based Email

Send an email using a MailerSend template with personalization.

```typescript
const result = await EmailService.sendTemplateEmail(
  'sender@example.com',
  'recipient@example.com',
  'template_id_here',
  [
    {
      email: 'recipient@example.com',
      data: {
        name: 'John Doe',
        company: 'Acme Corp',
        order_id: '12345'
      }
    }
  ]
);
```

#### 3. Send Advanced Email

Send an email with all available options.

```typescript
const result = await EmailService.sendEmail({
  from: {
    email: 'sender@example.com',
    name: 'John Sender'
  },
  to: [
    {
      email: 'recipient@example.com',
      name: 'Jane Recipient'
    }
  ],
  subject: 'Order Confirmation #12345',
  text: 'Thank you for your order!',
  html: '<h1>Thank you for your order!</h1><p>Your order #12345 is confirmed.</p>',
  cc: [
    {
      email: 'manager@example.com',
      name: 'Manager'
    }
  ],
  bcc: [
    {
      email: 'archive@example.com'
    }
  ],
  reply_to: {
    email: 'support@example.com',
    name: 'Support Team'
  },
  tags: ['order', 'confirmation'],
  settings: {
    track_clicks: true,
    track_opens: true,
    track_content: true
  }
});
```

### Email with Attachments

```typescript
import fs from 'fs';

// Read file and encode to base64
const fileBuffer = fs.readFileSync('./invoice.pdf');
const base64Content = EmailService.encodeFileToBase64(fileBuffer);

const result = await EmailService.sendEmail({
  from: { email: 'sender@example.com', name: 'Billing' },
  to: [{ email: 'customer@example.com', name: 'Customer' }],
  subject: 'Your Invoice',
  text: 'Please find your invoice attached.',
  html: '<p>Please find your invoice attached.</p>',
  attachments: [
    {
      content: base64Content,
      filename: 'invoice.pdf',
      disposition: 'attachment'
    }
  ]
});
```

### Inline Images

```typescript
const imageBuffer = fs.readFileSync('./logo.png');
const base64Image = EmailService.encodeFileToBase64(imageBuffer);

const result = await EmailService.sendEmail({
  from: { email: 'sender@example.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Email with Logo',
  html: '<img src="cid:logo" alt="Company Logo"><p>Welcome!</p>',
  attachments: [
    {
      content: base64Image,
      filename: 'logo.png',
      disposition: 'inline',
      id: 'logo'
    }
  ]
});
```

### Email Personalization

```typescript
const result = await EmailService.sendEmail({
  from: { email: 'sender@example.com' },
  to: [
    { email: 'john@example.com', name: 'John' },
    { email: 'jane@example.com', name: 'Jane' }
  ],
  subject: 'Hello {{name}}!',
  html: '<p>Hi {{name}}, welcome to {{company}}!</p>',
  personalization: [
    {
      email: 'john@example.com',
      data: {
        name: 'John',
        company: 'Acme Corp'
      }
    },
    {
      email: 'jane@example.com',
      data: {
        name: 'Jane',
        company: 'Acme Corp'
      }
    }
  ]
});
```

### Scheduled Email

Send an email at a future time (up to 72 hours ahead).

```typescript
// Schedule email for 1 hour from now
const sendAt = Math.floor(Date.now() / 1000) + 3600;

const result = await EmailService.sendEmail({
  from: { email: 'sender@example.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Scheduled Email',
  text: 'This email was scheduled.',
  send_at: sendAt
});
```

### Bulk Email Sending

Send multiple emails at once (up to 500 emails per request).

```typescript
const emails = [
  {
    from: { email: 'sender@example.com', name: 'Newsletter' },
    to: [{ email: 'subscriber1@example.com', name: 'Subscriber 1' }],
    subject: 'Monthly Newsletter - January',
    html: '<h1>Newsletter Content for Subscriber 1</h1>',
    text: 'Newsletter Content for Subscriber 1'
  },
  {
    from: { email: 'sender@example.com', name: 'Newsletter' },
    to: [{ email: 'subscriber2@example.com', name: 'Subscriber 2' }],
    subject: 'Monthly Newsletter - January',
    html: '<h1>Newsletter Content for Subscriber 2</h1>',
    text: 'Newsletter Content for Subscriber 2'
  }
];

const result = await EmailService.sendBulkEmails(emails);
console.log('Bulk Email ID:', result.bulkEmailId);
console.log('Message:', result.message);
```

### Check Bulk Email Status

Monitor the status of bulk email sending.

```typescript
const bulkEmailId = '614470d1588b866d0454f3e2';
const status = await EmailService.getBulkEmailStatus(bulkEmailId);

console.log('State:', status.state);
console.log('Total Recipients:', status.total_recipients_count);
console.log('Suppressed Recipients:', status.suppressed_recipients_count);
console.log('Validation Errors:', status.validation_errors_count);
console.log('Message IDs:', status.messages_id);
```

## TypeScript Interfaces

### SendEmailParams

```typescript
interface SendEmailParams {
  from: EmailSender;
  to: EmailRecipient[];
  subject?: string;
  text?: string;
  html?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  reply_to?: EmailSender;
  attachments?: EmailAttachment[];
  template_id?: string;
  tags?: string[];
  personalization?: EmailPersonalization[];
  precedence_bulk?: boolean;
  send_at?: number; // Unix timestamp
  in_reply_to?: string;
  references?: string[];
  settings?: EmailSettings;
  headers?: EmailHeader[];
  list_unsubscribe?: string;
}
```

### EmailRecipient

```typescript
interface EmailRecipient {
  email: string;
  name?: string;
}
```

### EmailAttachment

```typescript
interface EmailAttachment {
  content: string; // Base64 encoded
  filename: string;
  disposition: 'inline' | 'attachment';
  id?: string; // For inline images
}
```

### EmailPersonalization

```typescript
interface EmailPersonalization {
  email: string;
  data: Record<string, any>;
}
```

## Usage Examples

### Order Confirmation Email

```typescript
async function sendOrderConfirmation(orderId: string, customerEmail: string, customerName: string) {
  try {
    const result = await EmailService.sendEmail({
      from: {
        email: 'orders@romofete.com',
        name: 'Romofete Orders'
      },
      to: [
        {
          email: customerEmail,
          name: customerName
        }
      ],
      subject: `Order Confirmation #${orderId}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Hi ${customerName},</p>
        <p>Your order #${orderId} has been confirmed and is being processed.</p>
        <p>We'll send you another email when your order ships.</p>
        <p>Best regards,<br>Romofete Team</p>
      `,
      text: `Thank you for your order! Your order #${orderId} has been confirmed.`,
      tags: ['order', 'confirmation'],
      settings: {
        track_opens: true,
        track_clicks: true
      }
    });
    
    console.log('Order confirmation sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    throw error;
  }
}
```

### Password Reset Email

```typescript
async function sendPasswordResetEmail(userEmail: string, resetToken: string) {
  const resetUrl = `https://romofete.com/reset-password?token=${resetToken}`;
  
  try {
    const result = await EmailService.sendEmail({
      from: {
        email: 'noreply@romofete.com',
        name: 'Romofete Security'
      },
      to: [{ email: userEmail }],
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}`,
      tags: ['password-reset', 'security']
    });
    
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}
```

### Newsletter with Personalization

```typescript
async function sendNewsletter(subscribers: Array<{email: string, name: string}>) {
  const emails = subscribers.map(subscriber => ({
    from: {
      email: 'newsletter@romofete.com',
      name: 'Romofete Newsletter'
    },
    to: [
      {
        email: subscriber.email,
        name: subscriber.name
      }
    ],
    subject: 'Monthly Newsletter - {{month}}',
    html: `
      <h1>Hello {{name}}!</h1>
      <p>Welcome to our {{month}} newsletter.</p>
      <h2>Latest Products</h2>
      <p>Check out our new arrivals...</p>
    `,
    personalization: [
      {
        email: subscriber.email,
        data: {
          name: subscriber.name,
          month: new Date().toLocaleString('default', { month: 'long' })
        }
      }
    ],
    tags: ['newsletter', 'monthly'],
    settings: {
      track_opens: true,
      track_clicks: true
    }
  }));
  
  try {
    const result = await EmailService.sendBulkEmails(emails);
    console.log('Newsletter sent to', subscribers.length, 'subscribers');
    return result;
  } catch (error) {
    console.error('Failed to send newsletter:', error);
    throw error;
  }
}
```

## Error Handling

```typescript
try {
  const result = await EmailService.sendSimpleEmail(
    'sender@example.com',
    'recipient@example.com',
    'Test Email',
    'Test content'
  );
  console.log('Email sent successfully:', result.messageId);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error sending email:', error.message);
    // Handle specific errors
    if (error.message.includes('API key is not set')) {
      console.error('Configure MAILERSEND_API_KEY in .env file');
    } else if (error.message.includes('domain must be verified')) {
      console.error('Verify your sending domain in MailerSend dashboard');
    }
  }
}
```

## Limitations

- **File attachments**: Maximum 25MB total size (after Base64 decoding)
- **Recipients per email**: Maximum 50 for `to`, 10 for `cc`, 10 for `bcc`
- **Bulk emails**: Maximum 500 emails per request (5 for Trial plan)
- **Subject line**: Maximum 998 characters
- **Email body**: Maximum 2MB per email
- **Tags**: Maximum 5 tags per email
- **Scheduled emails**: Can be scheduled up to 72 hours in advance

## Supported File Types

Text files, images (jpg, png, gif, svg), documents (pdf, doc, docx), audio/video files, spreadsheets, presentations, archives, and more. See [MailerSend documentation](https://developers.mailersend.com/api/v1/email.html#supported-file-types) for the complete list.

## Best Practices

1. **Always use verified domains** - Verify your sending domain in MailerSend dashboard
2. **Handle errors gracefully** - Implement proper error handling and logging
3. **Use templates** - Create reusable email templates in MailerSend for consistency
4. **Track email metrics** - Enable tracking settings to monitor email performance
5. **Personalize content** - Use personalization for better engagement
6. **Test before sending** - Always test emails in development before production
7. **Respect rate limits** - Be mindful of MailerSend's API rate limits
8. **Secure your API key** - Never commit API keys to version control
9. **Use appropriate tags** - Tag emails for better organization and analytics
10. **Monitor deliverability** - Regularly check your email deliverability metrics

## Resources

- [MailerSend API Documentation](https://developers.mailersend.com/)
- [MailerSend Dashboard](https://app.mailersend.com/)
- [MailerSend Support](https://www.mailersend.com/help)
