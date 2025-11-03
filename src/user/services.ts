// This file contains service functions and business logic for User-related operations.
import bcrypt from "bcrypt";
import { Query } from "./query";
import { generateToken, AuthTokenPayload } from "../_services/authService";
import { SmsService } from "../_services/smsService";
import { EmailService } from "../_services/emailService";

const SALT_ROUNDS = 10;

export async function addUser({
  username,
  email,
  password,
  role,
  phone,
}: {
  username: string;
  email: string;
  password: string;
  role: "superAdmin" | "admin";
  phone?: string;
}) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const [userRaw] = await Query.createUser({
    username,
    email,
    password: hashedPassword,
    role,
    phone,
  });

  // Type assertion: we know this is a User
  const user = userRaw as import("../_services/modelTypes").User;

  // Send SMS on successful registration if phone is available
  if (user && user.phone) {
    const senderId = process.env.ARKESL_SMS_SENDER_ID || "ROMOFETE";
    const smsMessage = "Registration successful! Welcome to Romofete.";
    try {
      await SmsService.sendSms(user.phone, smsMessage, senderId);
      console.log(`Registration SMS sent to ${user.phone}`);
    } catch (smsError) {
      console.error("Failed to send registration SMS:", smsError);
    }
  }

  // Send welcome email on successful registration
  if (user && user.email) {
    const emailSubject = "Welcome to Romofete!";
    const emailText = `Dear ${user.username},\n\nYour registration was successful! Welcome to Romofete.\n\nYou can now log in and start managing your orders.\n\nBest regards,\nRomofete Team`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to Romofete! 🎉</h2>
        <p>Dear <strong>${user.username}</strong>,</p>
        <p>Your registration was successful! We're excited to have you on board.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Username:</strong> ${user.username}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role}</p>
        </div>
        <p>You can now log in and start managing your orders.</p>
        <p style="margin-top: 30px;">Best regards,<br><strong>Romofete Team</strong></p>
      </div>
    `;
    
    try {
      const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'noreply@romofete.com';
      await EmailService.sendSimpleEmail(fromEmail, user.email, emailSubject, emailText, emailHtml);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }
  }

  // Remove password before returning
  //@ts-ignore
  if (user && user.password) {
    delete (user as any).password;
  }
  return user;
}

export async function getUserById(id: number) {
  const user = await Query.getUserById(id);
  //@ts-ignore
  if (user && user.password) {
    delete (user as any).password;
  }
  return user;
}

export async function getUserByUsername(username: string) {
  const user = await Query.getUserByUsername(username);
  //@ts-ignore
  if (user && user.password) {
    delete (user as any).password;
  }
  return user;
}

export async function listUsers() {
  const users = await Query.listUsers();
  // listUsers does not return password field
  return users;
}

export async function deleteUser(id: number) {
  const [user] = await Query.deleteUser(id);
  //@ts-ignore
  if (user && user.password) {
    delete (user as any).password;
  }
  return user;
}

export async function loginUser({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const user = await Query.getUserByUsername(username);
  if (!user) {
    throw new Error("Invalid username or password");
  }
  //@ts-ignore
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }
  // Remove password before returning
  delete (user as any).password;

  // Determine user_type (default to "admin" for now, but this should be based on business logic)
  const user_type = "admin";

  // Prepare token payload
  
  const payload: AuthTokenPayload = {
    id: user.id,
    //@ts-ignore
    username: user.username,
    //@ts-ignore
    email: user.email,
    //@ts-ignore
    role: user.role,
    user_type,
  };

  const token = generateToken(payload);

  return { user, token };
}
