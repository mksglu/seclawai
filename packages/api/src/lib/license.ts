import { nanoid } from "nanoid";

export function generateToken(): string {
  return `sec_${nanoid(32)}`;
}

export function generateTokenId(): string {
  return `tok_${nanoid(24)}`;
}

export function generatePurchaseId(): string {
  return `pur_${nanoid(24)}`;
}
