import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import { getSession } from "@backend/lib/auth";
import { ensureSeeded } from "@backend/lib/bootstrap";
import { env } from "@backend/lib/env";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function POST(req: Request) {
  const user = getSession(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { subject, message } = await req.json();
  const title = String(subject || "").trim();
  const details = String(message || "").trim();
  if (!title || !details || title.length > 200 || details.length > 10_000)
    return NextResponse.json({ error: "A subject and message are required" }, { status: 400 });
  await ensureSeeded();
  const ticketId = randomUUID();
  await queryBigQuery(`INSERT INTO \`${env.projectId}.${env.dataset}.support_tickets\`
    (id,event_ts,tenant,user_id,subject,message,status)
    VALUES (@ticketId,CURRENT_TIMESTAMP(),@tenant,@userId,@subject,@message,'pending_email')`,
    { ticketId, tenant: user.orgId, userId: user.email, subject: title, message: details });
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD)
    return NextResponse.json({ ticketId, error: "Ticket saved; email delivery is not configured" }, { status: 503 });
  try {
    const mailer = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
    await mailer.sendMail({ from: process.env.SMTP_FROM || "ai@nelture.ai", to: "ai@nelture.ai", replyTo: user.email,
      subject: `[PRISM support ${ticketId}] ${title}`, text: `Tenant: ${user.orgId}\nUser: ${user.email}\n\n${details}` });
    await queryBigQuery(`UPDATE \`${env.projectId}.${env.dataset}.support_tickets\` SET status='submitted' WHERE id=@ticketId`, { ticketId });
    return NextResponse.json({ ticketId, status: "submitted" }, { status: 201 });
  } catch {
    await queryBigQuery(`UPDATE \`${env.projectId}.${env.dataset}.support_tickets\` SET status='email_failed' WHERE id=@ticketId`, { ticketId });
    return NextResponse.json({ ticketId, error: "Ticket saved, but email delivery failed" }, { status: 502 });
  }
}
