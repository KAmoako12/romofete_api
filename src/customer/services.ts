// This file contains service functions and business logic for Customer-related operations.
import bcrypt from "bcrypt";
import { Query } from "./query";
import { generateToken, AuthTokenPayload } from "../_services/authService";
import { SmsService } from "../_services/smsService";
import { EmailService } from "../_services/emailService";

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

  // Send SMS on successful registration if phone is available
  if (customer && customer.phone) {
    const senderId = process.env.ARKESL_SMS_SENDER_ID || "ROMOFETE";
    const smsMessage = "Registration successful! Welcome to Romofete.";
    try {
      await SmsService.sendSms(customer.phone, smsMessage, senderId);
      console.log(`Registration SMS sent to ${customer.phone}`);
    } catch (smsError) {
      console.error("Failed to send registration SMS:", smsError);
    }
  }

  // Send welcome email on successful registration
  if (customer && customer.email) {
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
    const emailSubject = "Welcome to Romofete!";
    const emailText = `Dear ${customerName},\n\nYour registration was successful! Welcome to Romofete.\n\nYou can now log in and start placing orders.\n\nBest regards,\nRomofete Team`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to Romofete! 🎉</h2>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your registration was successful! We're excited to have you as a customer.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${customer.email}</p>
          ${customer.phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${customer.phone}</p>` : ''}
        </div>
        <p>You can now log in and start placing orders.</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>Romofete Team</strong></p>
      </div>
    `;
    
    try {
      const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'noreply@romofete.com';
      await EmailService.sendSimpleEmail(fromEmail, customer.email, emailSubject, emailText, emailHtml);
      console.log(`Welcome email sent to ${customer.email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }
  }

  // Remove password before returning
  //@ts-ignore
  if (customer && customer.password) {
    delete (customer as any).password;
  }
  return customer;
}

export async function getCustomerById(id: number) {
  const customer = await Query.getCustomerById(id);
  //@ts-ignore
  if (customer && customer.password) {
    delete (customer as any).password;
  }
  return customer;
}

export async function getCustomerByEmail(email: string) {
  const customer = await Query.getCustomerByEmail(email);
  //@ts-ignore
  if (customer && customer.password) {
    delete (customer as any).password;
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
  //@ts-ignore
  if (customer && customer.password) {
    delete (customer as any).password;
  }
  return customer;
}

export async function deleteCustomer(id: number) {
  const [customer] = await Query.deleteCustomer(id);
  //@ts-ignore
  if (customer && customer.password) {
    delete (customer as any).password;
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
  //@ts-ignore
  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }
  // Remove password before returning
  delete (customer as any).password;

  // Set user_type as "customer" for customers
  const user_type = "customer";

  // Prepare token payload - customers don't have roles, so we'll use a default
  const payload: AuthTokenPayload = {
    id: customer.id,
    //@ts-ignore
    username: customer.email, // Use email as username for customers
    //@ts-ignore
    email: customer.email,
    role: "customer", // Default role for customers
    user_type,
  };

  const token = generateToken(payload);

  return { customer, token };
}
