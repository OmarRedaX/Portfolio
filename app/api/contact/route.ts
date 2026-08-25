import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/schemas/contact";
import { sendContactEmail } from "@/lib/send-contact-email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { error } = await sendContactEmail(parsed.data);
    if (error) {
      return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
