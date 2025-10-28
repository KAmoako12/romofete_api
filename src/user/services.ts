// This file contains service functions and business logic for User-related operations.
import bcrypt from "bcrypt";
import { Query } from "./query";
import { generateToken, AuthTokenPayload } from "../_services/authService";
import { SmsService } from "../_services/smsService";

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
