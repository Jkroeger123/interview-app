import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

type Body = {
  ageStatus?: "adult" | "minor_with_guardian";
  acceptedTos?: boolean;
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;

  if (
    (body.ageStatus !== "adult" && body.ageStatus !== "minor_with_guardian") ||
    body.acceptedTos !== true
  ) {
    return NextResponse.json(
      { error: "Must confirm age status and accept the Terms of Service." },
      { status: 400 }
    );
  }

  const client = await clerkClient();
  const existing = await client.users.getUser(userId);

  await client.users.updateUser(userId, {
    publicMetadata: {
      ...existing.publicMetadata,
      ageGateAccepted: true,
      ageGateAcceptedAt: new Date().toISOString(),
      ageStatus: body.ageStatus,
      tosAcceptedAt: new Date().toISOString(),
    },
  });

  return NextResponse.json({ ok: true });
}
