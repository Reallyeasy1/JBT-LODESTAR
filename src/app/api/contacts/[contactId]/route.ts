import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getContactById } from "@/services/contact.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contactId: string }> },
) {
  const user = await getCurrentUser();
  const { contactId } = await params;
  const contact = await getContactById(contactId, user.id);
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json(contact);
}
