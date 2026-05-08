// utils/normalizePhoneNumber.ts
export function normalizePhoneNumber(rawPhone: string, defaultCountry = "IN"): string {
  const trimmedPhone = rawPhone.trim().replace(/[\s()-]/g, "");

  if (!trimmedPhone) {
    throw new Error("Invalid phone number");
  }

  if (trimmedPhone.startsWith("+")) {
    if (!/^\+\d{8,15}$/.test(trimmedPhone)) {
      throw new Error("Invalid phone number");
    }
    return trimmedPhone;
  }

  const digitsOnly = trimmedPhone.replace(/\D/g, "");

  if (!/^\d{8,15}$/.test(digitsOnly)) {
    throw new Error("Invalid phone number");
  }

  if (defaultCountry === "IN" && digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}
