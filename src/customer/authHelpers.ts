/**
 * Helper functions for authentication operations like
 * generating verification codes, password reset codes, etc.
 */

/**
 * Generate a 6-digit numeric code
 */
export function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate expiration date for verification code (2 days from now)
 */
export function generateVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 2); // 2 days
  return expiry;
}

/**
 * Generate expiration date for password reset code (24 hours from now)
 */
export function generateResetExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hours
  return expiry;
}

/**
 * Generate verification email HTML template
 */
export function generateVerificationEmailTemplate(
  customerName: string,
  verificationCode: string
): { subject: string; text: string; html: string } {
  const subject = "Verify Your Email - Romofete";
  
  const text = `Dear ${customerName},\n\nThank you for registering with Romofete!\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 2 days.\n\nPlease enter this code to verify your email address and activate your account.\n\nIf you didn't create an account with us, please ignore this email.\n\nBest regards,\nRomofete Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin: 0;">Romofete</h1>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email</h2>
        
        <p style="color: #555; line-height: 1.6;">Dear <strong>${customerName}</strong>,</p>
        
        <p style="color: #555; line-height: 1.6;">Thank you for registering with Romofete! To complete your registration and activate your account, please use the verification code below:</p>
        
        <div style="background-color: #f0f0f0; border: 2px dashed #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${verificationCode}
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
          This code will expire in <strong>2 days</strong>.
        </p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px; border-radius: 4px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Security Notice:</strong> If you didn't create an account with us, please ignore this email.
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-top: 30px;">
          Best regards,<br>
          <strong>Romofete Team</strong>
        </p>
      </div>
      
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  `;
  
  return { subject, text, html };
}

/**
 * Generate password reset email HTML template
 */
export function generatePasswordResetEmailTemplate(
  customerName: string,
  resetCode: string
): { subject: string; text: string; html: string } {
  const subject = "Reset Your Password - Romofete";
  
  const text = `Dear ${customerName},\n\nWe received a request to reset your password.\n\nYour password reset code is: ${resetCode}\n\nThis code will expire in 24 hours.\n\nIf you didn't request a password reset, please ignore this email or contact us if you have concerns.\n\nBest regards,\nRomofete Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin: 0;">Romofete</h1>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
        
        <p style="color: #555; line-height: 1.6;">Dear <strong>${customerName}</strong>,</p>
        
        <p style="color: #555; line-height: 1.6;">We received a request to reset your password. Please use the code below to reset your password:</p>
        
        <div style="background-color: #f0f0f0; border: 2px dashed #ff5722; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #ff5722; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${resetCode}
          </div>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
          This code will expire in <strong>24 hours</strong>.
        </p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px; border-radius: 4px;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact us immediately if you have concerns about your account security.
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-top: 30px;">
          Best regards,<br>
          <strong>Romofete Team</strong>
        </p>
      </div>
      
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  `;
  
  return { subject, text, html };
}

/**
 * Generate password changed confirmation email HTML template
 */
export function generatePasswordChangedEmailTemplate(
  customerName: string,
  email: string
): { subject: string; text: string; html: string } {
  const subject = "Password Changed Successfully - Romofete";
  
  const text = `Dear ${customerName},\n\nYour password has been changed successfully.\n\nIf you made this change, no further action is required.\n\nIf you didn't change your password, please contact us immediately to secure your account.\n\nAccount email: ${email}\n\nBest regards,\nRomofete Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin: 0;">Romofete</h1>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #4CAF50; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 36px;">✓</span>
          </div>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Password Changed Successfully</h2>
        
        <p style="color: #555; line-height: 1.6;">Dear <strong>${customerName}</strong>,</p>
        
        <p style="color: #555; line-height: 1.6;">This is a confirmation that your password has been changed successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #555;"><strong>Account:</strong> ${email}</p>
          <p style="margin: 5px 0; color: #555;"><strong>Changed:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">If you made this change, no further action is required.</p>
        
        <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin-top: 30px; border-radius: 4px;">
          <p style="color: #c62828; margin: 0; font-size: 14px;">
            <strong>Didn't make this change?</strong> If you didn't change your password, please contact us immediately to secure your account.
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-top: 30px;">
          Best regards,<br>
          <strong>Romofete Team</strong>
        </p>
      </div>
      
      <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
        This is an automated message, please do not reply to this email.
      </p>
    </div>
  `;
  
  return { subject, text, html };
}
