import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/dal";
import { profileMessages } from "@/lib/profile/messages";
import { saveProfile, saveProfileSchema } from "@/lib/profile/save";

function revalidateAfterProfileChange() {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");
  revalidatePath("/predictions");
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: profileMessages.errors.unauthenticated },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: profileMessages.errors.invalidName },
      { status: 400 },
    );
  }

  const parsed = saveProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: profileMessages.errors.invalidName },
      { status: 400 },
    );
  }

  try {
    const result = await saveProfile(user.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: profileMessages.errors.server },
        { status: 400 },
      );
    }
    revalidateAfterProfileChange();
    return NextResponse.json({ ok: true, profile: result.profile });
  } catch (error) {
    console.error("PATCH /api/profile crashed", error);
    return NextResponse.json(
      { ok: false, error: profileMessages.errors.server },
      { status: 500 },
    );
  }
}
