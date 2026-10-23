import { z } from "zod";

import { authMessages } from "./messages";

const { validation } = authMessages;

const USERNAME_PATTERN = /^[\p{L}\p{N}._\- ]+$/u;

export function normalizeUsername(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const usernameField = z
  .string({ error: validation.usernameRequired })
  .trim()
  .min(2, { error: validation.usernameTooShort })
  .max(30, { error: validation.usernameTooLong })
  .refine((value) => USERNAME_PATTERN.test(value), {
    error: validation.usernameInvalidChars,
  });

const passwordField = z
  .string({ error: validation.passwordRequired })
  .min(1, { error: validation.passwordRequired });

const newPasswordField = z
  .string({ error: validation.passwordRequired })
  .min(8, { error: validation.passwordTooShort })
  .regex(/[a-zA-Z]/, { error: validation.passwordMissingLetter })
  .regex(/[0-9]/, { error: validation.passwordMissingNumber });

const tokenField = z
  .string({ error: validation.tokenRequired })
  .trim()
  .min(5, { error: validation.tokenInvalidFormat })
  .max(120, { error: validation.tokenInvalidFormat });

export const loginSchema = z.object({
  username: usernameField,
  password: passwordField,
});

export const registerSchema = z.object({
  token: tokenField,
  username: usernameField,
  password: newPasswordField,
});

export const invitePromptSchema = z.object({
  token: tokenField,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type InvitePromptInput = z.infer<typeof invitePromptSchema>;
