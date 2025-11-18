# SMTP2GO Migration Guide

## Overview
This guide will help you migrate from MailerSend to SMTP2GO for your email service integration.

---

## What Changed

### 1. API Provider
- **Before:** MailerSend API (`https://api.mailersend.com/v1`)
- **After:** SMTP2GO API (`https://api.smtp2go.com/v3`)

### 2. Environment Variables
Update your `.env` file with the new SMTP2GO credentials:

**Remove:**
```env
MAILERSEND_API_KEY=your_mailersend_api_key_here
```

**Add:**
```env
SMTP2GO_API_KEY=your_smtp2go_api_key_here
```

### 3. API Key Setup
To get your SMTP2GO API key:
1. Log in to your [SMTP2GO account](https://app.smtp2go.com/)
2. Navigate to **Sending > API Keys** from the left-side menu
3. Create a new API key or use an existing one
4. Copy the API key to your `.env` file

### 4. Sender Verification
**Important:** SMTP2GO requires sender verification before you can send emails.

You must verify your sender either by:
- **Option 1 (Recommended):** Verify your domain in **Sending > Verified Senders > Sender Domain**
  - This allows sending from any email address at that domain
  - Enables SPF and DKIM alignment for better deliverability
  
- **Option 2:** Verify individual email addresses in **Sending > Verified Senders > Single Sender Emails**
  - Use this only if you cannot update your domain's DNS records

**Attempts to send from unverified senders will be rejected.**

---

## API Changes

### Response Format Changes

#### Before (MailerSend)
```typescript
const result = await EmailService.sendEmail(params);
// Returns:
{
  messageId: string;
  sendPaused?: boolean;
  warnings?: any[];
}
```

#### After (SMTP2GO)
```typescript
const result = await EmailService.sendEmail(params);
// Returns:
{
  emailId?: string;
  scheduleId?: string;
  succeeded: number;
  failed: number;
  failures: any[];
  requestId: string;
}
```

### Bulk Email Changes

#### Before (MailerSend)
```typescript
const result = await EmailService.sendBulkEmails(emailsParams);
// Returns:
{
  bulkEmailId: string;
  message: string;
}
```

#### After (SMTP2GO)
```typescript
const result = await EmailService.sendBulkEmails(emailsParams);
// Returns:
{
  results: Array<{
    success: boolean;
    emailId?: string;
    error?: string;
    index: number;
  }>;
  totalSucceeded: number;
  totalFailed: number;
}
```

**Note:** SMTP2GO doesn't have a specific bulk endpoint, so emails are sent sequentially.

---

## Interface Changes

### EmailAttachment Interface

#### Before (MailerSend)
```typescript
interface EmailAttachment {
  content: string;        // Base64 encoded
  filename: string;
  disposition: 'inline' | 'attachment';
  id?: string;
}
```

#### After (SMTP2GO)
```typescript
interface EmailAttachment {
  filename: string;
  fileblob?: string;      // Base64 encoded (optional)
  url?: string;           // URL to fetch attachment (optional)
  mimetype: string;       // Required
}
```

**Benefits:**
- You can now specify a URL and SMTP2GO will fetch the attachment
- Attachments from URLs are cached for 24 hours, improving performance
- Either `fileblob` or `url` must be provided

### Custom Headers

#### Before (MailerSend)
```typescript
interface EmailHeader {
  name: string;
  value: string;
}
```

#### After (SMTP2GO)
```typescript
interface EmailHeader {
  header: string;         // Changed from 'name' to 'header'
  value: string;
}
```

### Template Data (Personalization)

#### Before (MailerSend)
```typescript
personalization?: EmailPersonalization[];  // Array of per-recipient data

interface EmailPersonalization {
  email: string;
  data: Record<string, any>;
}
```

#### After (SMTP2GO)
```typescript
template_data?: Record<string, any>;       // Single object for all recipients

// Use with template_id to pass variables to your SMTP2GO template
```

---

## Features Comparison

### ✅ Supported Features

Both MailerSend and SMTP2GO support:
- HTML and plain text emails
- Multiple recipients (To, CC, BCC)
- Attachments
- Templates
- Custom headers
- Reply-To addresses
- Scheduled sending

### 📝 Feature Differences

#### SMTP2GO Specific Features:
- **Inline Images:** Use `inlines` parameter to embed images in emails
- **URL-based Attachments:** Provide a URL instead of base64 data
- **Attachment Caching:** URLs are cached for 24 hours for better performance

#### MailerSend Features Not in SMTP2GO:
- **Tags:** SMTP2GO doesn't support email tags in the same way
- **Per-recipient Personalization:** SMTP2GO uses a single template data object
- **Tracking Settings per Email:** Tracking is configured at the API key level, not per email

---

## Configuration Recommendations

### API Key Settings
When setting up your SMTP2GO API key, consider enabling:

1. **Open Tracking** - Track when emails are opened
2. **Click Tracking** - Track when links are clicked
3. **Unsubscribe Footer** - Automatically add unsubscribe links
4. **Email Archiving** - Store emails for compliance (paid plans only)
5. **Rate Limiting** - Set limits to prevent abuse

These settings are configured in your SMTP2GO account under **Sending > API Keys**.

---

## Limits and Quotas

### SMTP2GO Limits:
- **Maximum Email Size:** 50 MB (including content, attachments, and headers)
- **Maximum Recipients per Field:** 100 per To/CC/BCC field
- **Sender Verification:** Required before sending

### Important Notes:
- Each recipient counts as one email from your monthly quota
- Multiple recipients in a single email = multiple emails from your quota
- Scheduled emails must be within the next 3 days

---

## Code Migration Examples

### Example 1: Simple Email

```typescript
// No code changes needed! The interface remains the same
await EmailService.sendSimpleEmail(
  'sender@yourdomain.com',
  'recipient@example.com',
  'Test Subject',
  'Plain text body',
  '<h1>HTML Body</h1>'
);
```

### Example 2: Email with Attachments

#### Before (MailerSend)
```typescript
await EmailService.sendEmail({
  from: { email: 'sender@yourdomain.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Document Attached',
  html: '<p>Please find the document attached.</p>',
  attachments: [{
    filename: 'document.pdf',
    content: base64Content,
    disposition: 'attachment'
  }]
});
```

#### After (SMTP2GO)
```typescript
await EmailService.sendEmail({
  from: { email: 'sender@yourdomain.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Document Attached',
  html: '<p>Please find the document attached.</p>',
  attachments: [{
    filename: 'document.pdf',
    fileblob: base64Content,
    mimetype: 'application/pdf'
  }]
});

// Or use URL-based attachments:
await EmailService.sendEmail({
  from: { email: 'sender@yourdomain.com' },
  to: [{ email: 'recipient@example.com' }],
  subject: 'Document Attached',
  html: '<p>Please find the document attached.</p>',
  attachments: [{
    filename: 'document.pdf',
    url: 'https://yourdomain.com/documents/file.pdf',
    mimetype: 'application/pdf'
  }]
});
```

### Example 3: Template Email

```typescript
// Works the same way, just update the template_id to your SMTP2GO template
await EmailService.sendTemplateEmail(
  'sender@yourdomain.com',
  'recipient@example.com',
  'your-smtp2go-template-id',
  {
    name: 'John Doe',
    order_number: '12345',
    total: '$99.99'
  }
);
```

---

## Testing Your Migration

### 1. Set Up SMTP2GO Account
- Sign up at [SMTP2GO](https://www.smtp2go.com/)
- Create an API key
- Verify your sender domain or email address

### 2. Update Environment Variables
```bash
# In your .env file
SMTP2GO_API_KEY=your_actual_api_key_here
```

### 3. Test Sending
```typescript
// Try a simple test email
import { EmailService } from './src/_services/emailService';

await EmailService.sendSimpleEmail(
  'your-verified@yourdomain.com',
  'test@example.com',
  'SMTP2GO Test',
  'This is a test email from SMTP2GO!'
);
```

### 4. Monitor Results
- Check your SMTP2GO dashboard for delivery status
- Review any errors or bounce notifications
- Verify tracking is working (if enabled)

---

## Troubleshooting

### Common Issues

#### 1. "Sender not verified" Error
**Solution:** Verify your sender domain or email address in SMTP2GO dashboard

#### 2. "401 Unauthorized" Error
**Solution:** Check that your API key is correct and enabled in SMTP2GO

#### 3. Attachments Not Working
**Solution:** Ensure `mimetype` is specified for all attachments

#### 4. Template Variables Not Replacing
**Solution:** Check that your SMTP2GO template variable names match your `template_data` keys

---

## Support and Documentation

### SMTP2GO Resources:
- [SMTP2GO Documentation](https://developers.smtp2go.com/)
- [Getting Started Guide](https://developers.smtp2go.com/docs/getting-started)
- [API Reference](https://developers.smtp2go.com/reference/send-standard-email)
- [Support](https://www.smtp2go.com/contact/)

### Need Help?
- Contact SMTP2GO support for API-related issues
- Review the [status page](https://smtp2gostatus.com/) for service updates
- Check your API logs in the SMTP2GO dashboard

---

## Summary Checklist

- [ ] Create SMTP2GO account
- [ ] Generate API key
- [ ] Verify sender domain or email address
- [ ] Update `.env` file with `SMTP2GO_API_KEY`
- [ ] Remove old `MAILERSEND_API_KEY` from `.env`
- [ ] Configure API key settings (tracking, archiving, etc.)
- [ ] Test sending a simple email
- [ ] Update any code that accesses response fields directly
- [ ] Update attachment code to include `mimetype`
- [ ] Test template emails with new template IDs
- [ ] Monitor SMTP2GO dashboard for delivery status
- [ ] Update any monitoring/alerting to use new response format

---

## Notes

- The EmailService API remains largely backward compatible
- Most existing code will work without changes
- Main updates needed are environment variables and attachment mimetypes
- Response format has changed, so update any code that reads response fields

**Recommendation:** Test thoroughly in a development environment before deploying to production.
