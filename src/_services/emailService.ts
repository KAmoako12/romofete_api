/**
 * Email Service integrating MailerSend API
 * https://developers.mailersend.com/api/v1/email.html#send-an-email
 */

import axios from 'axios';

export namespace EmailService {
  const MAILERSEND_API_URL = 'https://api.mailersend.com/v1';
  // It is recommended to store the API key in environment variables
  const API_KEY = process.env.MAILERSEND_API_KEY || '';

  /**
   * Email recipient interface
   */
  export interface EmailRecipient {
    email: string;
    name?: string;
  }

  /**
   * Email sender interface
   */
  export interface EmailSender {
    email: string;
    name?: string;
  }

  /**
   * Email attachment interface
   */
  export interface EmailAttachment {
    content: string; // Base64 encoded content
    filename: string;
    disposition: 'inline' | 'attachment';
    id?: string; // Used for inline images with cid
  }

  /**
   * Email personalization interface
   */
  export interface EmailPersonalization {
    email: string;
    data: Record<string, any>;
  }

  /**
   * Email settings interface
   */
  export interface EmailSettings {
    track_clicks?: boolean;
    track_opens?: boolean;
    track_content?: boolean;
  }

  /**
   * Custom email headers interface
   */
  export interface EmailHeader {
    name: string;
    value: string;
  }

  /**
   * Basic email parameters
   */
  export interface SendEmailParams {
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

  /**
   * Bulk email status interface
   */
  export interface BulkEmailStatus {
    id: string;
    state: string;
    total_recipients_count: number;
    suppressed_recipients_count: number;
    suppressed_recipients: any;
    validation_errors_count: number;
    validation_errors: any;
    messages_id: string[];
    created_at: string;
    updated_at: string;
  }

  /**
   * Send a single email using MailerSend API
   * @param params - Email parameters
   * @returns Promise with API response including x-message-id
   */
  export async function sendEmail(params: SendEmailParams): Promise<{
    messageId: string;
    sendPaused?: boolean;
    warnings?: any[];
  }> {
    if (!API_KEY) {
      throw new Error('MailerSend API key is not set in environment variables');
    }

    // Validate required fields
    if (!params.from || !params.from.email) {
      throw new Error('Sender email (from.email) is required');
    }

    if (!params.to || params.to.length === 0) {
      throw new Error('At least one recipient (to) is required');
    }

    // Validate that either text, html, or template_id is provided
    if (!params.text && !params.html && !params.template_id) {
      throw new Error('Either text, html, or template_id must be provided');
    }

    // Validate that subject is provided unless template_id is present
    if (!params.subject && !params.template_id) {
      throw new Error('Subject is required unless template_id is provided');
    }

    try {
      const response = await axios.post(
        `${MAILERSEND_API_URL}/email`,
        params,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        messageId: response.headers['x-message-id'],
        sendPaused: response.headers['x-send-paused'] === 'true',
        warnings: response.data?.warnings,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to send email';
      const errors = error?.response?.data?.errors;
      
      if (errors) {
        const errorDetails = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('; ');
        throw new Error(`${errorMessage} - ${errorDetails}`);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Send bulk emails using MailerSend API
   * @param emailsParams - Array of email parameters
   * @returns Promise with bulk email ID
   */
  export async function sendBulkEmails(emailsParams: SendEmailParams[]): Promise<{
    bulkEmailId: string;
    message: string;
  }> {
    if (!API_KEY) {
      throw new Error('MailerSend API key is not set in environment variables');
    }

    if (!emailsParams || emailsParams.length === 0) {
      throw new Error('At least one email is required for bulk sending');
    }

    try {
      const response = await axios.post(
        `${MAILERSEND_API_URL}/bulk-email`,
        emailsParams,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        bulkEmailId: response.data.bulk_email_id,
        message: response.data.message,
      };
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error.message || 'Failed to send bulk emails');
    }
  }

  /**
   * Get bulk email status
   * @param bulkEmailId - Bulk email ID returned from sendBulkEmails
   * @returns Promise with bulk email status
   */
  export async function getBulkEmailStatus(bulkEmailId: string): Promise<BulkEmailStatus> {
    if (!API_KEY) {
      throw new Error('MailerSend API key is not set in environment variables');
    }

    if (!bulkEmailId) {
      throw new Error('Bulk email ID is required');
    }

    try {
      const response = await axios.get(
        `${MAILERSEND_API_URL}/bulk-email/${bulkEmailId}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error.message || 'Failed to get bulk email status');
    }
  }

  /**
   * Helper function to create a simple email
   * @param from - Sender email
   * @param to - Recipient email(s)
   * @param subject - Email subject
   * @param text - Plain text content
   * @param html - HTML content (optional)
   * @returns Promise with API response
   */
  export async function sendSimpleEmail(
    from: string,
    to: string | string[],
    subject: string,
    text: string,
    html?: string
  ): Promise<{ messageId: string; sendPaused?: boolean; warnings?: any[] }> {
    const recipients = Array.isArray(to) ? to : [to];
    
    return sendEmail({
      from: { email: from },
      to: recipients.map(email => ({ email })),
      subject,
      text,
      html,
    });
  }

  /**
   * Helper function to send a template-based email
   * @param from - Sender email
   * @param to - Recipient email(s)
   * @param templateId - MailerSend template ID
   * @param personalization - Personalization data (optional)
   * @returns Promise with API response
   */
  export async function sendTemplateEmail(
    from: string,
    to: string | string[],
    templateId: string,
    personalization?: EmailPersonalization[]
  ): Promise<{ messageId: string; sendPaused?: boolean; warnings?: any[] }> {
    const recipients = Array.isArray(to) ? to : [to];
    
    return sendEmail({
      from: { email: from },
      to: recipients.map(email => ({ email })),
      template_id: templateId,
      personalization,
    });
  }

  /**
   * Helper function to encode file to Base64
   * @param file - File buffer or string
   * @returns Base64 encoded string
   */
  export function encodeFileToBase64(file: Buffer | string): string {
    if (Buffer.isBuffer(file)) {
      return file.toString('base64');
    }
    return Buffer.from(file).toString('base64');
  }
}
