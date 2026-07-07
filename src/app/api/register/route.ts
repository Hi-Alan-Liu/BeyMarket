import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "資料格式錯誤" },
      { status: 400 },
    );
  }

  const { email, displayName, lineContact, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "此 Email 已被註冊" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      displayName,
      name: displayName,
      lineContact: lineContact || null,
      passwordHash,
      stats: { create: {} },
    },
    select: { id: true, email: true, displayName: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
