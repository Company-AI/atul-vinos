"use server";

import { cookies } from "next/headers";
import { AGE_GATE_COOKIE } from "@/components/site/age-gate";

/** Guarda la confirmación para no volver a preguntar. */
export async function confirmAge(rememberDays = 180): Promise<void> {
  const store = await cookies();
  store.set(AGE_GATE_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * Math.max(1, rememberDays),
  });
}
