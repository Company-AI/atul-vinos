import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/infra/auth/session";
import { userCan } from "@/infra/auth/guards";
import { recordAudit } from "@/domain/audit/service";
import { getReport, type ReportRow } from "@/domain/reports/exports";

/** Escapa un valor para CSV según RFC 4180. */
function csvCell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(columns: { key: string; header: string }[], rows: ReportRow[]): string {
  const header = columns.map((c) => csvCell(c.header)).join(";");
  const body = rows
    .map((row) => columns.map((c) => csvCell(row[c.key] ?? "")).join(";"))
    .join("\n");
  // BOM para que Excel en Windows respete los acentos.
  return `﻿${header}\n${body}`;
}

async function toXlsx(
  label: string,
  columns: { key: string; header: string; width?: number }[],
  rows: ReportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Aurora Selección";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(label.slice(0, 30));
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? 18,
  }));

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8DFD1" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) sheet.addRow(row);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ report: string }> },
) {
  const user = await getCurrentUser();
  if (!user?.isStaff) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { report: reportKey } = await context.params;
  const report = getReport(reportKey);
  if (!report) {
    return NextResponse.json({ error: "Reporte inexistente." }, { status: 404 });
  }

  if (!userCan(user, report.permission)) {
    return NextResponse.json({ error: "Sin permiso para este reporte." }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("formato") === "xlsx" ? "xlsx" : "csv";
  const fromParam = url.searchParams.get("desde");
  const toParam = url.searchParams.get("hasta");

  const range = {
    from: fromParam ? new Date(`${fromParam}T00:00:00`) : undefined,
    to: toParam ? new Date(`${toParam}T23:59:59`) : undefined,
  };

  const rows = await report.load(range);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${report.key}-${stamp}.${format}`;

  await recordAudit(user, {
    action: "reports.export",
    entityType: "Report",
    entityId: report.key,
    after: { format, rows: rows.length, from: fromParam, to: toParam },
  });

  if (format === "xlsx") {
    const buffer = await toXlsx(report.label, report.columns, rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(toCsv(report.columns, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
