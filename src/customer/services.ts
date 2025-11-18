// This file contains service functions and business logic for Customer-related operations.
import bcrypt from "bcrypt";
import { Query } from "./query";
import { generateToken, AuthTokenPayload } from "../_services/authService";
import { SmsService } from "../_services/smsService";
import { EmailService } from "../_services/emailService";
import {
  generateSixDigitCode,
  generateVerificationExpiry,
  generateResetExpiry,
  generateVerificationEmailTemplate,
  generatePasswordResetEmailTemplate,
  generatePasswordChangedEmailTemplate,
} from "./authHelpers";

const SALT_ROUNDS = 10;

export async function registerCustomer({
  first_name,
  last_name,
  phone,
  address,
  city,
  state,
  zip_code,
  country,
  email,
  password,
}: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  email: string;
  password: string;
}) {
  // Generate verification code
  const verificationCode = generateSixDigitCode();
  const verificationCodeExpires = generateVerificationExpiry();

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const [customerRaw] = await Query.createCustomer({
    first_name,
    last_name,
    phone,
    address,
    city,
    state,
    zip_code,
    country,
    email,
    password: hashedPassword,
  });

  // Type assertion: we know this is a Customer
  const customer = customerRaw as import("../_services/modelTypes").Customer;

  // Update customer with verification code
  if (customer && customer.id) {
    await Query.updateCustomer(customer.id, {
      verification_code: verificationCode,
      verification_code_expires: verificationCodeExpires,
    });
  }

  // Send verification email
  if (customer && customer.email) {
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
    const emailTemplate = generateVerificationEmailTemplate(customerName, verificationCode);
    
    try {
      const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'noreply@romofete.com';
      await EmailService.sendSimpleEmail(
        fromEmail,
        customer.email,
        emailTemplate.subject,
        emailTemplate.text,
        emailTemplate.html
      );
      console.log(`Verification email sent to ${customer.email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't throw error - registration should succeed even if email fails
    }
  }

  // Send SMS on successful registration if phone is available
  if (customer && customer.phone) {
    const senderId = process.env.ARKESL_SMS_SENDER_ID || "ROMOFETE";
    const smsMessage = "Registration successful! Please check your email to verify your account.";
    try {
      await SmsService.sendSms(customer.phone, smsMessage, senderId);
      console.log(`Registration SMS sent to ${customer.phone}`);
    } catch (smsError) {
      console.error("Failed to send registration SMS:", smsError);
    }
  }

  // Remove sensitive data before returning
  if (customer && customer.password) {
    delete (customer as any).password;
  }
  if (customer && customer.verification_code) {
    delete (customer as any).verification_code;
  }
  if (customer && customer.verification_code_expires) {
    delete (customer as any).verification_code_expires;
  }
  
  return customer;
}

export async function verifyEmail(code: string) {
  const customer = await Query.getCustomerByVerificationCode(code);
  
  if (!customer) {
    throw new Error("Invalid or expired verification code");
  }

  // Update customer to mark email as verified and clear verification code
  const [updatedRaw] = await Query.updateCustomer(customer.id, {
    email_verified: true,
    verification_code: null,
    verification_code_expires: null,
  });

  const updated = updatedRaw as import("../_services/modelTypes").Customer;

  // Remove sensitive data
  if (updated && updated.password) {
    delete (updated as any).password;
  }

  return updated;
}

export async function resendVerificationEmail(email: string) {
  const customer = await Query.getCustomerByEmail(email);
  
  if (!customer) {
    throw new Error("Customer not found");
  }

  if ((customer as any).email_verified) {
    throw new Error("Email is already verified");
  }

  // Generate new verification code
  const verificationCode = generateSixDigitCode();
  const verificationCodeExpires = generateVerificationExpiry();

  // Update customer with new verification code
  await Query.updateCustomer(customer.id, {
    verification_code: verificationCode,
    verification_code_expires: verificationCodeExpires,
  });

  // Send verification email
  const customerName = `${(customer as any).first_name || ''} ${(customer as any).last_name || ''}`.trim() || 'Customer';
  const emailTemplate = generateVerificationEmailTemplate(customerName, verificationCode);
  
  const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'noreply@romofete.com';
  await EmailService.sendSimpleEmail(
    fromEmail,
    (customer as any).email,
    emailTemplate.subject,
    emailTemplate.text,
    emailTemplate.html
  );

  return { message: "Verification email sent successfully" };
}

export async function requestPasswordReset(email: string) {
  const customer = await Query.getCustomerByEmail(email);
  
  if (!customer) {
    // Don't reveal if email exists or not for security
    return { message: "If an account exists with this email, a password reset code has been sent" };
  }

  // Generate reset code
  const resetCode = generateSixDigitCode();
  const resetCodeExpires = generateResetExpiry();

  // Update customer with reset code
  await Query.updateCustomer(customer.id, {
    reset_code: resetCode,
    reset_code_expires: resetCodeExpires,
  });

  // Send password reset email
  const customerName = `${(customer as any).first_name || ''} ${(customer as any).last_name || ''}`.trim() || 'Customer';
  const emailTemplate = generatePasswordResetEmailTemplate(customerName, resetCode);
  
  try {
    const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'noreply@romofete.com';
    await EmailService.sendSimpleEmail(
      fromEmail,
      (customer as any).email,
      emailTemplate.subject,
      emailTemplate.text,
      emailTemplate.html
    );
    console.log(`Password reset email sent to ${(customer as any).email}`);
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    throw new Error("Failed to send password reset email");
  }

  return { message: "If an account exists with this email, a password reset code has been sent" };
}

export async function resetPassword(code: string, newPassword: string) {
  const customer = await Query.getCustomerByResetCode(code);
  
  if (!customer) {
    throw new Error("Invalid or expired reset code");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and clear reset code
  const [updatedRaw] = await Query.updateCustomer(customer.id, {
    password: hashedPassword,
    reset_code: null,
    reset_code_expires: null,
  });

  const updated = updatedRaw as import("../_services/modelTypes").Customer;

  // Send password changed confirmation email
  const customerName = `${(customer as any).first_name || ''} ${(customer as any).last_name || ''}`.trim() || 'Customer';
  const emailTemplate = generatePasswordChangedEmailTemplate(customerName, (customer as any).email);
  
  try {
    const fromEmail = process.env.SMTP2GO_FROM_EMAIL || 'noreply@romofete.com';
    await EmailService.sendSimpleEmail(
      fromEmail,
      (customer as any).email,
      emailTemplate.subject,
      emailTemplate.text,
      emailTemplate.html
    );
    console.log(`Password changed confirmation email sent to ${(customer as any).email}`);
  } catch (emailError) {
    console.error("Failed to send password changed email:", emailError);
    // Don't throw error - password reset should succeed even if email fails
  }

  // Remove sensitive data
  if (updated && updated.password) {
    delete (updated as any).password;
  }

  return { message: "Password reset successfully" };
}

export async function getCustomerById(id: number) {
  const customer = await Query.getCustomerById(id);
  if (customer && (customer as any).password) {
    delete (customer as any).password;
  }
  if (customer && (customer as any).verification_code) {
    delete (customer as any).verification_code;
  }
  if (customer && (customer as any).verification_code_expires) {
    delete (customer as any).verification_code_expires;
  }
  if (customer && (customer as any).reset_code) {
    delete (customer as any).reset_code;
  }
  if (customer && (customer as any).reset_code_expires) {
    delete (customer as any).reset_code_expires;
  }
  return customer;
}

export async function getCustomerByEmail(email: string) {
  const customer = await Query.getCustomerByEmail(email);
  if (customer && (customer as any).password) {
    delete (customer as any).password;
  }
  if (customer && (customer as any).verification_code) {
    delete (customer as any).verification_code;
  }
  if (customer && (customer as any).verification_code_expires) {
    delete (customer as any).verification_code_expires;
  }
  if (customer && (customer as any).reset_code) {
    delete (customer as any).reset_code;
  }
  if (customer && (customer as any).reset_code_expires) {
    delete (customer as any).reset_code_expires;
  }
  return customer;
}

export async function listCustomers() {
  const customers = await Query.listCustomers();
  // listCustomers does not return password field
  return customers;
}

export async function updateCustomer(id: number, updates: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  email?: string;
  password?: string;
}) {
  // Hash password if it's being updated
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
  }
  
  const [customer] = await Query.updateCustomer(id, updates);
  if (customer && (customer as any).password) {
    delete (customer as any).password;
  }
  if (customer && (customer as any).verification_code) {
    delete (customer as any).verification_code;
  }
  if (customer && (customer as any).verification_code_expires) {
    delete (customer as any).verification_code_expires;
  }
  if (customer && (customer as any).reset_code) {
    delete (customer as any).reset_code;
  }
  if (customer && (customer as any).reset_code_expires) {
    delete (customer as any).reset_code_expires;
  }
  return customer;
}

export async function deleteCustomer(id: number) {
  const [customer] = await Query.deleteCustomer(id);
  if (customer && (customer as any).password) {
    delete (customer as any).password;
  }
  if (customer && (customer as any).verification_code) {
    delete (customer as any).verification_code;
  }
  if (customer && (customer as any).verification_code_expires) {
    delete (customer as any).verification_code_expires;
  }
  if (customer && (customer as any).reset_code) {
    delete (customer as any).reset_code;
  }
  if (customer && (customer as any).reset_code_expires) {
    delete (customer as any).reset_code_expires;
  }
  return customer;
}

export async function loginCustomer({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const customer = await Query.getCustomerByEmail(email);
  if (!customer) {
    throw new Error("Invalid email or password");
  }

  // Check if email is verified
  if (!(customer as any).email_verified) {
    throw new Error("Please verify your email before logging in");
  }

  const isMatch = await bcrypt.compare(password, (customer as any).password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Remove sensitive data before returning
  delete (customer as any).password;
  if ((customer as any).verification_code) {
    delete (customer as any).verification_code;
  }
  if ((customer as any).verification_code_expires) {
    delete (customer as any).verification_code_expires;
  }
  if ((customer as any).reset_code) {
    delete (customer as any).reset_code;
  }
  if ((customer as any).reset_code_expires) {
    delete (customer as any).reset_code_expires;
  }

  // Set user_type as "customer" for customers
  const user_type = "customer";

  // Prepare token payload - customers don't have roles, so we'll use a default
  const payload: AuthTokenPayload = {
    id: customer.id,
    username: (customer as any).email, // Use email as username for customers
    email: (customer as any).email,
    role: "customer", // Default role for customers
    user_type,
  };

  const token = generateToken(payload);

  return { customer, token };
}
