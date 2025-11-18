/**
 * Email Service integrating SMTP2GO API
 * https://developers.smtp2go.com/docs/introduction-guide
 * https://developers.smtp2go.com/reference/send-standard-email
 */

import axios from 'axios';

export namespace EmailService {
  const SMTP2GO_API_URL = 'https://api.smtp2go.com/v3';
  // It is recommended to store the API key in environment variables
  const API_KEY = process.env.SMTP2GO_API_KEY || '';

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
    filename: string;
    fileblob?: string; // Base64 encoded content
    url?: string; // URL where SMTP2GO will fetch the attachment
    mimetype: string;
  }

  /**
   * Email personalization interface (for template data)
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
  }

  /**
   * Custom email headers interface
   */
  export interface EmailHeader {
    header: string;
    value: string;
  }

  /**
   * Inline image interface
   */
  export interface EmailInline {
    filename: string;
    fileblob: string; // Base64 encoded content
    mimetype: string;
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
    inlines?: EmailInline[];
    template_id?: string;
    template_data?: Record<string, any>;
    tags?: string[];
    schedule?: string; // ISO 8601 timestamp for scheduled sending
    custom_headers?: EmailHeader[];
  }

  /**
   * SMTP2GO API request format
   */
  interface SMTP2GOEmailRequest {
    sender: string;
    to: string[];
    subject?: string;
    text_body?: string;
    html_body?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{
      filename: string;
      fileblob?: string;
      url?: string;
      mimetype: string;
    }>;
    inlines?: Array<{
      filename: string;
      fileblob: string;
      mimetype: string;
    }>;
    template_id?: string;
    template_data?: Record<string, any>;
    custom_headers?: Array<{
      header: string;
      value: string;
    }>;
    schedule?: string;
  }

  /**
   * SMTP2GO API response format
   */
  interface SMTP2GOEmailResponse {
    request_id: string;
    data: {
      succeeded: number;
      failed: number;
      failures: any[];
      email_id?: string;
      schedule_id?: string;
    };
  }

  /**
   * Helper function to format email address
   */
  function formatEmailAddress(recipient: EmailSender | EmailRecipient): string {
    if (recipient.name) {
      return `${recipient.name} <${recipient.email}>`;
    }
    return recipient.email;
  }

  /**
   * Send a single email using SMTP2GO API
   * @param params - Email parameters
   * @returns Promise with API response including email_id
   */
  export async function sendEmail(params: SendEmailParams): Promise<{
    emailId?: string;
    scheduleId?: string;
    succeeded: number;
    failed: number;
    failures: any[];
    requestId: string;
  }> {
    if (!API_KEY) {
      throw new Error('SMTP2GO API key is not set in environment variables');
    }

    // Validate required fields
    if (!params.from || !params.from.email) {
      throw new Error('Sender email (from.email) is required');
    }

    if (!params.to || params.to.length === 0) {
      throw new Error('At least one recipient (to) is required');
    }

    // Check maximum recipients per field (SMTP2GO limit is 100)
    if (params.to.length > 100) {
      throw new Error('Maximum 100 recipients allowed in "to" field');
    }
    if (params.cc && params.cc.length > 100) {
      throw new Error('Maximum 100 recipients allowed in "cc" field');
    }
    if (params.bcc && params.bcc.length > 100) {
      throw new Error('Maximum 100 recipients allowed in "bcc" field');
    }

    // Validate that either text, html, or template_id is provided
    if (!params.text && !params.html && !params.template_id) {
      throw new Error('Either text, html, or template_id must be provided');
    }

    // Validate that subject is provided unless template_id is present
    if (!params.subject && !params.template_id) {
      throw new Error('Subject is required unless template_id is provided');
    }

    // Build SMTP2GO request
    const requestData: SMTP2GOEmailRequest = {
      sender: formatEmailAddress(params.from),
      to: params.to.map(formatEmailAddress),
      subject: params.subject,
      text_body: params.text,
      html_body: params.html,
    };

    // Add optional fields
    if (params.cc && params.cc.length > 0) {
      requestData.cc = params.cc.map(formatEmailAddress);
    }

    if (params.bcc && params.bcc.length > 0) {
      requestData.bcc = params.bcc.map(formatEmailAddress);
    }

    if (params.attachments && params.attachments.length > 0) {
      requestData.attachments = params.attachments.map(att => ({
        filename: att.filename,
        fileblob: att.fileblob,
        url: att.url,
        mimetype: att.mimetype,
      }));
    }

    if (params.inlines && params.inlines.length > 0) {
      requestData.inlines = params.inlines;
    }

    if (params.template_id) {
      requestData.template_id = params.template_id;
      if (params.template_data) {
        requestData.template_data = params.template_data;
      }
    }

    if (params.schedule) {
      requestData.schedule = params.schedule;
    }

    // Handle custom headers including Reply-To
    const customHeaders: Array<{ header: string; value: string }> = [];
    
    if (params.reply_to) {
      customHeaders.push({
        header: 'Reply-To',
        value: formatEmailAddress(params.reply_to),
      });
    }

    if (params.custom_headers && params.custom_headers.length > 0) {
      customHeaders.push(...params.custom_headers);
    }

    if (customHeaders.length > 0) {
      requestData.custom_headers = customHeaders;
    }

    try {
      const response = await axios.post<SMTP2GOEmailResponse>(
        `${SMTP2GO_API_URL}/email/send`,
        requestData,
        {
          headers: {
            'X-Smtp2go-Api-Key': API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      return {
        emailId: response.data.data.email_id,
        scheduleId: response.data.data.schedule_id,
        succeeded: response.data.data.succeeded,
        failed: response.data.data.failed,
        failures: response.data.data.failures,
        requestId: response.data.request_id,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.data?.error || error?.response?.data?.error || error.message || 'Failed to send email';
      const errorCode = error?.response?.data?.data?.error_code || error?.response?.data?.error_code;
      
      if (errorCode) {
        throw new Error(`${errorMessage} (Error Code: ${errorCode})`);
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Send bulk emails using SMTP2GO API
   * Note: SMTP2GO doesn't have a specific bulk endpoint, so we send multiple emails
   * @param emailsParams - Array of email parameters
   * @returns Promise with results for each email
   */
  export async function sendBulkEmails(emailsParams: SendEmailParams[]): Promise<{
    results: Array<{
      success: boolean;
      emailId?: string;
      error?: string;
      index: number;
    }>;
    totalSucceeded: number;
    totalFailed: number;
  }> {
    if (!API_KEY) {
      throw new Error('SMTP2GO API key is not set in environment variables');
    }

    if (!emailsParams || emailsParams.length === 0) {
      throw new Error('At least one email is required for bulk sending');
    }

    const results: Array<{
      success: boolean;
      emailId?: string;
      error?: string;
      index: number;
    }> = [];

    let totalSucceeded = 0;
    let totalFailed = 0;

    // Send emails sequentially to avoid rate limiting issues
    for (let i = 0; i < emailsParams.length; i++) {
      try {
        const result = await sendEmail(emailsParams[i]);
        results.push({
          success: result.succeeded > 0,
          emailId: result.emailId,
          index: i,
        });
        totalSucceeded += result.succeeded;
        totalFailed += result.failed;
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          index: i,
        });
        totalFailed++;
      }
    }

    return {
      results,
      totalSucceeded,
      totalFailed,
    };
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
  ): Promise<{
    emailId?: string;
    scheduleId?: string;
    succeeded: number;
    failed: number;
    failures: any[];
    requestId: string;
  }> {
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
   * @param templateId - SMTP2GO template ID
   * @param templateData - Template data variables (optional)
   * @returns Promise with API response
   */
  export async function sendTemplateEmail(
    from: string,
    to: string | string[],
    templateId: string,
    templateData?: Record<string, any>
  ): Promise<{
    emailId?: string;
    scheduleId?: string;
    succeeded: number;
    failed: number;
    failures: any[];
    requestId: string;
  }> {
    const recipients = Array.isArray(to) ? to : [to];
    
    return sendEmail({
      from: { email: from },
      to: recipients.map(email => ({ email })),
      template_id: templateId,
      template_data: templateData,
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
