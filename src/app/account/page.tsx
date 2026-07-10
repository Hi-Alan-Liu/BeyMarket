import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/app/account/profile-form";

export const metadata = { title: "帳號設定 — BeyMarket" };

export default async function AccountPage() {
  const sessionUser = await requireUser("/account");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: {
      email: true,
      displayName: true,
      name: true,
      lineContact: true,
      image: true,
    },
  });

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">帳號設定</h1>
      <p className="mb-6 text-sm text-gray-500">{user.email}</p>
      <ProfileForm
        initial={{
          displayName: user.displayName ?? user.name ?? "",
          lineContact: user.lineContact ?? "",
          image: user.image ?? "",
        }}
      />
    </main>
  );
}
