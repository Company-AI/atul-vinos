import type { Metadata } from "next";
import { requireStaff } from "@/infra/auth/guards";
import { prisma } from "@/infra/db/prisma";
import { AUDIT_ACTION_LABELS } from "@/domain/audit/service";
import { formatDateTime } from "@/lib/dates";
import { AdminCard, AdminPageHeader, AdminTable, Td } from "@/components/admin/admin-ui";
import { Pagination } from "@/components/shop/pagination";

export const metadata: Metadata = { title: "Auditoría" };

const PER_PAGE = 60;

type PageProps = { searchParams: Promise<{ pagina?: string; accion?: string }> };

export default async function AdminAuditPage({ searchParams }: PageProps) {
  await requireStaff("audit.view");
  const params = await searchParams;
  const page = Math.max(1, Number(params.pagina ?? 1) || 1);

  const where = params.accion ? { action: params.accion } : {};

  const [logs, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["action"], _count: { _all: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  /** Muestra solo los campos que cambiaron, no el objeto entero. */
  const diff = (before: unknown, after: unknown): string => {
    if (!before && !after) return "—";
    const b = (before ?? {}) as Record<string, unknown>;
    const a = (after ?? {}) as Record<string, unknown>;
    const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
    const changes = keys
      .filter((key) => JSON.stringify(b[key]) !== JSON.stringify(a[key]))
      .map((key) => {
        const from = b[key] === undefined ? "—" : JSON.stringify(b[key]);
        const to = a[key] === undefined ? "—" : JSON.stringify(a[key]);
        return `${key}: ${from} → ${to}`;
      });
    return changes.length ? changes.join(" · ") : "—";
  };

  return (
    <>
      <AdminPageHeader
        title="Auditoría"
        description={`${total} acciones registradas · quién cambió qué y cuándo`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <a
          href="/admin/auditoria"
          className={`flex h-8 items-center rounded-sm border px-3 text-[12px] ${
            !params.accion ? "border-carbon-900 bg-carbon-900 text-bone" : "border-linen-300 text-carbon-800"
          }`}
        >
          Todas ({total})
        </a>
        {actions.map((action) => (
          <a
            key={action.action}
            href={`/admin/auditoria?accion=${action.action}`}
            className={`flex h-8 items-center rounded-sm border px-3 text-[12px] ${
              params.accion === action.action
                ? "border-carbon-900 bg-carbon-900 text-bone"
                : "border-linen-300 text-carbon-800"
            }`}
          >
            {AUDIT_ACTION_LABELS[action.action] ?? action.action} ({action._count._all})
          </a>
        ))}
      </div>

      <AdminCard padded={false}>
        <AdminTable
          headers={["Fecha", "Usuario", "Acción", "Entidad", "Cambio", "IP"]}
          empty={<p className="text-[13px] text-stone-500">Todavía no hay acciones registradas.</p>}
        >
          {logs.map((log) => (
            <tr key={log.id}>
              <Td className="whitespace-nowrap tabular text-stone-500">
                {formatDateTime(log.createdAt)}
              </Td>
              <Td>
                {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.actorEmail ?? "Sistema"}
              </Td>
              <Td>{AUDIT_ACTION_LABELS[log.action] ?? log.action}</Td>
              <Td className="text-stone-500">
                {log.entityType}
                {log.entityId && (
                  <span className="ml-1 text-[11px]">{log.entityId.slice(0, 8)}…</span>
                )}
              </Td>
              <Td className="max-w-[320px] truncate text-[12px] text-stone-600">
                {diff(log.before, log.after)}
              </Td>
              <Td className="text-[11px] tabular text-stone-500">{log.ip ?? "—"}</Td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          buildHref={(target) => {
            const search = new URLSearchParams();
            if (params.accion) search.set("accion", params.accion);
            if (target > 1) search.set("pagina", String(target));
            const qs = search.toString();
            return qs ? `/admin/auditoria?${qs}` : "/admin/auditoria";
          }}
        />
      )}
    </>
  );
}
