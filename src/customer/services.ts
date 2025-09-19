// This file contains service functions and business logic for Customer-related operations.
import bcrypt from "bcrypt";
import { Query } from "./query";
import { generateToken, AuthTokenPayload } from "../_services/authService";

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
  const [customer] = await Query.createCustomer({
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
