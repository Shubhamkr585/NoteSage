import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { generatePresignedReadUrl } from "@/lib/s3";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const document = await db.document.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Generate a fresh 15-minute presigned URL exactly when the user clicks the link
    const url = await generatePresignedReadUrl(document.s3Key);
    
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[DOWNLOAD ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
