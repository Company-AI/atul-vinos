import nodemailer from "nodemailer";
import type {
  NotificationChannel, NotificationMessage, NotificationRecipient,
} from "@/domain/notifications/ports";
import { getSettings } from "@/domain/settings/service";

/** Plantilla HTML con la identidad de la marca (spec §50). */
function renderHtml(
  message: NotificationMessage,
  brand: { name: string; logoUrl: string; siteUrl: string; footer: string },
): string {
  const rows = (message.rows ?? [])
    .map(
      (row) => `
      <tr>
        <td style="padding:6px 0;color:#8A8378;font-size:13px;">${escapeHtml(row.label)}</td>
        <td style="padding:6px 0;color:#14110F;font-size:13px;text-align:right;">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");

  const items = (message.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E8DFD1;color:#14110F;font-size:14px;">
          ${item.quantity}× ${escapeHtml(item.name)}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E8DFD1;color:#14110F;font-size:14px;text-align:right;">
          ${escapeHtml(item.price ?? "")}
        </td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(message.subject)}</title></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F3EC;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDFBF7;border:1px solid #E8DFD1;">
        <tr>
          <td style="background:#14110F;padding:28px 32px;text-align:center;">
            <a href="${brand.siteUrl}" style="color:#F7F3EC;font-size:20px;letter-spacing:6px;text-decoration:none;font-weight:300;">
              ${escapeHtml(brand.name.toUpperCase())}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:300;color:#14110F;line-height:1.3;">
              ${escapeHtml(message.heading ?? message.subject)}
            </h1>
            ${message.intro ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3A342E;">${escapeHtml(message.intro)}</p>` : ""}
            ${items ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${items}</table>` : ""}
            ${rows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">${rows}</table>` : ""}
            ${
              message.cta
                ? `<a href="${message.cta.url}" style="display:inline-block;background:#5E1A26;color:#FDFBF7;padding:14px 28px;text-decoration:none;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;">${escapeHtml(message.cta.label)}</a>`
                : ""
            }
            ${message.footnote ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8A8378;">${escapeHtml(message.footnote)}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#F1EBE0;border-top:1px solid #E8DFD1;">
            <p style="margin:0;font-size:11px;line-height:1.6;color:#8A8378;">${escapeHtml(brand.footer)}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class EmailChannel implements NotificationChannel {
  readonly code = "EMAIL" as const;

  isConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST);
  }

  async send(recipient: NotificationRecipient, message: NotificationMessage): Promise<void> {
    const settings = await getSettings();
    const brand = {
      name: settings.company.name,
      logoUrl: settings.company.logoLightUrl,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      footer: settings.email.footerText,
    };
    const html = renderHtml(message, brand);
    const from = `${settings.email.fromName} <${settings.email.fromEmail}>`;

    // Sin SMTP configurado se registra en consola: el flujo no se interrumpe en dev.
    if (!this.isConfigured()) {
      console.info(
        `\n[email:console] Para: ${recipient.email}\nAsunto: ${message.subject}\n${message.body}\n`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await transporter.sendMail({
      from,
      to: recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
      replyTo: settings.email.replyTo || undefined,
      subject: message.subject,
      text: message.body,
      html,
    });
  }
}
