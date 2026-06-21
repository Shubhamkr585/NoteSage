import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUploadUrl } from "@/lib/s3";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
    }

    // Create a unique key for the file
    const uniqueId = crypto.randomUUID();
    const extension = filename.split(".").pop();
    const key = `users/${session.user.id}/${uniqueId}.${extension}`;

    const presignedUrl = await generatePresignedUploadUrl(key, contentType);

    return NextResponse.json({
      presignedUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
