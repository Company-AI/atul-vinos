import type { Metadata } from "next";
import { requireUser } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { ProfileForm } from "@/components/account/profile-form";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Mis datos",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const current = await requireUser("/mi-cuenta/datos");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: current.id } });

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="md" className="mt-3 mb-10">Mis datos</Heading>
      <ProfileForm
        userId={user.id}
        initial={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          documentId: user.documentId,
          acceptsMarketing: user.acceptsMarketing,
        }}
      />
    </>
  );
}
