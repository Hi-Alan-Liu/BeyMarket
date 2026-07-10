"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validations/listing";

export type ActionResult = { ok: false; error: string } | { ok: true };

/** 更新個人檔案（暱稱、LINE 聯絡、頭像）。 */
export async function updateProfile(raw: {
  displayName: string;
  lineContact?: string;
  image?: string;
}): Promise<ActionResult> {
  const user = await requireUser("/account");
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "格式錯誤" };
  }
  const { displayName, lineContact, image } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName,
      name: displayName,
      lineContact: lineContact || null,
      image: image || null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/dashboard");
  return { ok: true };
}
