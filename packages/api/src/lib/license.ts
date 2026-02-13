import { nanoid } from "nanoid";

export function generateLicenseKey(): string {
  return nanoid(32);
}

export function generateLicenseId(): string {
  return `lic_${nanoid(24)}`;
}
