/**
 * SMS Service integrating Arkesel SMS API
 * https://developers.arkesel.com/#tag/SMS-V2
 */

import axios from 'axios';

export namespace SmsService {
  const ARKESEL_SMS_URL = 'https://sms.arkesel.com/api/v2/sms/send';
  // It is recommended to store the API key in environment variables
  const API_KEY = process.env.ARKESL_SMS_API_KEY || '';

  /**
   * Send an SMS using Arkesel API
   * @param to - Recipient phone number (in international format, e.g. 233XXXXXXXXX)
   * @param message - Message body
   * @param senderId - Sender ID (registered with Arkesel)
   * @returns Promise with API response
   */
  export async function sendSms(to: string, message: string, senderId: string): Promise<any> {
    if (!API_KEY) {
      throw new Error('Arkesel SMS API key is not set in environment variables');
    }
    if(to.startsWith('0')){
      to = '233' + to.slice(1);
    }
    if(to.startsWith('+')){
      to = to.slice(1);
    }
    
    const payload = {
      sender: senderId,
      message,
      recipients: [to],
    };
    try {
      const response = await axios.post(
        ARKESEL_SMS_URL,
        payload,
        {
          headers: {
            'api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Optionally, log error or handle as needed
      throw new Error(error?.response?.data?.message || error.message || 'Failed to send SMS');
    }
  }
}
