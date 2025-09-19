// This file contains service functions and business logic for User-related operations.
import bcrypt from "bcrypt";
import { Query } from "./query";
import { generateToken, AuthTokenPayload } from "../_services/authService";

const SALT_ROUNDS = 10;

export async function addUser({
  username,
  email,
  password,
  role,
}: {
  username: string;
  email: string;
  password: string;
  role: "superAdmin" | "admin";
}) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const [user] = await Query.createUser({
    username,
    email,
    password: hashedPassword,
    role,
  });
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
