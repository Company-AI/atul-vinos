"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DailySalesPoint, MonthlySalesPoint, SubscriptionFlowPoint } from "@/domain/reports/dashboard";

/** Paleta del design system, en literales porque recharts recibe props. */
const COLORS = {
  store: "#5E1A26",
  club: "#C0A265",
  total: "#2A2521",
  signups: "#3F7D5B",
  cancellations: "#A6362F",
  grid: "#E8DFD1",
  axis: "#8A8378",
};

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

type ChartValue = number | string | readonly (number | string)[] | undefined;

const asNumber = (value: ChartValue): number => {
  if (Array.isArray(value)) return Number(value[0] ?? 0);
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const seriesLabel = (name: unknown): string => {
  const key = String(name ?? "");
  if (key === "store") return "Tienda";
  if (key === "club") return "Club";
  if (key === "signups") return "Altas";
  if (key === "cancellations") return "Bajas";
  if (key === "mrr") return "Cobrado";
  return key;
};

const compact = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const axisProps = {
  stroke: COLORS.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  backgroundColor: "#FDFBF7",
  border: "1px solid #D8CDBA",
  borderRadius: 3,
  fontSize: 12,
  padding: "8px 10px",
} as const;

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${MONTHS_SHORT[Number(month) - 1]} ${year.slice(2)}`;
}

export function DailySalesChart({ data }: { data: DailySalesPoint[] }) {
  const points = data.map((p) => ({ ...p, label: dayLabel(p.date) }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={points} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="storeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.store} stopOpacity={0.28} />
            <stop offset="100%" stopColor={COLORS.store} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="clubFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.club} stopOpacity={0.32} />
            <stop offset="100%" stopColor={COLORS.club} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} tickFormatter={(v: ChartValue) => compact.format(asNumber(v))} width={52} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: ChartValue, name: unknown) => [
            currency.format(asNumber(value)),
            seriesLabel(name),
          ]}
        />
        <Legend
          formatter={(value: unknown) => seriesLabel(value)}
          wrapperStyle={{ fontSize: 12, color: COLORS.axis }}
        />
        <Area type="monotone" dataKey="store" stroke={COLORS.store} strokeWidth={1.6} fill="url(#storeFill)" stackId="1" />
        <Area type="monotone" dataKey="club" stroke={COLORS.club} strokeWidth={1.6} fill="url(#clubFill)" stackId="1" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlySalesChart({ data }: { data: MonthlySalesPoint[] }) {
  const points = data.map((p) => ({ ...p, label: monthLabel(p.month) }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={points} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v: ChartValue) => compact.format(asNumber(v))} width={52} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: ChartValue, name: unknown) => [
            currency.format(asNumber(value)),
            seriesLabel(name),
          ]}
        />
        <Legend
          formatter={(value: unknown) => seriesLabel(value)}
          wrapperStyle={{ fontSize: 12, color: COLORS.axis }}
        />
        <Bar dataKey="store" fill={COLORS.store} stackId="1" maxBarSize={26} />
        <Bar dataKey="club" fill={COLORS.club} stackId="1" maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SubscriptionFlowChart({ data }: { data: SubscriptionFlowPoint[] }) {
  const points = data.map((p) => ({ ...p, label: monthLabel(p.month) }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={points} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={36} allowDecimals={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: ChartValue, name: unknown) => [
            String(asNumber(value)),
            seriesLabel(name),
          ]}
        />
        <Legend
          formatter={(value: unknown) => seriesLabel(value)}
          wrapperStyle={{ fontSize: 12, color: COLORS.axis }}
        />
        <Line type="monotone" dataKey="signups" stroke={COLORS.signups} strokeWidth={1.8} dot={{ r: 2 }} />
        <Line type="monotone" dataKey="cancellations" stroke={COLORS.cancellations} strokeWidth={1.8} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RecurringRevenueChart({ data }: { data: SubscriptionFlowPoint[] }) {
  const points = data.map((p) => ({ ...p, label: monthLabel(p.month) }));

  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={points} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.club} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COLORS.club} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v: ChartValue) => compact.format(asNumber(v))} width={52} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: ChartValue) => [currency.format(asNumber(value)), "Cobrado"]}
        />
        <Area type="monotone" dataKey="mrr" stroke={COLORS.club} strokeWidth={1.8} fill="url(#mrrFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
