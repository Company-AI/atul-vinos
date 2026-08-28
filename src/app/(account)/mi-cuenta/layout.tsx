import { requireUser } from "@/infra/auth/guards";
import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/ui/layout";

export default async function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <Container className="pb-section pt-2">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
