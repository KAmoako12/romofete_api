// This file contains service functions and business logic for Mailing List operations.
import { Query } from "./query";
import { EmailService } from "../_services/emailService";

export async function addEmailToMailingList(email: string) {
  // Check if email already exists
  const existing = await Query.getEmailFromMailingList(email);
  
  if (existing) {
    // Return success even if already exists (as per requirement)
    return { message: "Email added to mailing list successfully" };
  }

  await Query.addEmailToMailingList(email);
  return { message: "Email added to mailing list successfully" };
}

export async function getAllMailingListEmails() {
  const emails = await Query.getAllMailingListEmails();
  return emails;
}

export async function sendContactUsEmail({
  name,
  email,
  company,
  message
}: {
  name: string;
  email: string;
  company?: string | null;
  message: string;
}) {
  const recipientEmail = "Nicky.babe911@gmail.com";
  const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'noreply@romofete.com';
  
  const subject = `New Contact Form Submission from ${name}`;
  
  const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Company: ${company || 'N/A'}

Message:
${message}

---
This message was sent from the Romofete contact form.
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #007bff;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 0 0 5px 5px;
    }
    .field {
      margin-bottom: 15px;
    }
    .field-label {
      font-weight: bold;
      color: #555;
    }
    .field-value {
      margin-top: 5px;
    }
    .message-box {
      background-color: white;
      padding: 15px;
      border-left: 4px solid #007bff;
      margin-top: 10px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Name:</div>
        <div class="field-value">${name}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Email:</div>
        <div class="field-value"><a href="mailto:${email}">${email}</a></div>
      </div>
      
      <div class="field">
        <div class="field-label">Company:</div>
        <div class="field-value">${company || 'N/A'}</div>
      </div>
      
      <div class="field">
        <div class="field-label">Message:</div>
        <div class="message-box">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div class="footer">
        This message was sent from the Romofete contact form.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  await EmailService.sendSimpleEmail(
    fromEmail,
    recipientEmail,
    subject,
    textContent,
    htmlContent
  );

  return { message: "Message sent successfully" };
}
