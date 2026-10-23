"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/dal";

import { profileMessages } from "./messages";
import {
  changePassword,
  changePasswordSchema,
  type ChangePasswordFailure,
} from "./password";
import { saveProfile, saveProfileSchema, type SaveProfileFailure } from "./save";

export interface SaveProfileActionState {
  ok?: boolean;
  formError?: string;
  fieldErrors?: { name?: string; avatarColor?: string };
}

const failureToMessage: Record<SaveProfileFailure, string> = {
  "invalid-name": profileMessages.errors.invalidName,
  "invalid-avatar-color": profileMessages.errors.invalidAvatarColor,
};

function revalidateAfterProfileChange() {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  revalidatePath("/predictions");
}

export async function saveProfileAction(
  _previous: SaveProfileActionState | null,
  formData: FormData,
): Promise<SaveProfileActionState> {
  const user = await requireUser();

  const parsed = saveProfileSchema.safeParse({
    name: formData.get("name"),
    avatarColor: formData.get("avatarColor"),
  });
  if (!parsed.success) {
    const fieldErrors: SaveProfileActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name") {
        fieldErrors.name = profileMessages.errors.invalidName;
      } else if (key === "avatarColor") {
        fieldErrors.avatarColor = profileMessages.errors.invalidAvatarColor;
      }
    }
    return {
      formError: profileMessages.errors.invalidName,
      fieldErrors,
    };
  }

  try {
    const result = await saveProfile(user.id, parsed.data);
    if (!result.ok) {
      return {
        formError:
          failureToMessage[result.error ?? "invalid-name"] ??
          profileMessages.errors.server,
      };
    }
  } catch (error) {
    console.error("saveProfileAction failed", error);
    return { formError: profileMessages.errors.server };
  }

  revalidateAfterProfileChange();
  return { ok: true };
}

export interface ChangePasswordActionState {
  ok?: boolean;
  formError?: string;
  fieldErrors?: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
}

const changePasswordFailureMessage: Record<ChangePasswordFailure, string> = {
  "current-required": profileMessages.errors.currentPasswordRequired,
  "current-wrong": profileMessages.errors.currentPasswordWrong,
  "new-required": profileMessages.errors.newPasswordRequired,
  "new-too-short": profileMessages.errors.newPasswordTooShort,
  "new-missing-letter": profileMessages.errors.newPasswordMissingLetter,
  "new-missing-number": profileMessages.errors.newPasswordMissingNumber,
  "confirm-mismatch": profileMessages.errors.confirmPasswordMismatch,
  "user-not-found": profileMessages.errors.server,
};

export async function changePasswordAction(
  _previous: ChangePasswordActionState | null,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: ChangePasswordActionState["fieldErrors"] = {};
    let formError: string | undefined;
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<
        ChangePasswordActionState["fieldErrors"]
      >;
      const code = issue.message as ChangePasswordFailure;
      const message =
        changePasswordFailureMessage[code] ?? profileMessages.errors.server;
      if (key && typeof key === "string") {
        fieldErrors[key] = message;
      }
      if (!formError) formError = message;
    }
    return { formError, fieldErrors };
  }

  try {
    const result = await changePassword(user.id, parsed.data);
    if (!result.ok) {
      const code = result.error ?? "user-not-found";
      return {
        formError:
          changePasswordFailureMessage[code] ?? profileMessages.errors.server,
        fieldErrors:
          code === "current-wrong"
            ? { currentPassword: changePasswordFailureMessage[code] }
            : undefined,
      };
    }
  } catch (error) {
    console.error("changePasswordAction failed", error);
    return { formError: profileMessages.errors.server };
  }

  return { ok: true };
}
