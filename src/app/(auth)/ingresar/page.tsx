import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/infra/auth/session";
import { LoginForm } from "@/components/site/auth-forms";
import { Eyebrow, Heading } from "@/ui/layout";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) redirect(next && next.startsWith("/") ? next : "/mi-cuenta");

  return (
    <>
      <Eyebrow>Mi cuenta</Eyebrow>
      <Heading level={1} size="sm" className="mt-3 mb-8">
        Ingresá a tu cuenta
      </Heading>
      <LoginForm next={next} />
    </>
  );
}
