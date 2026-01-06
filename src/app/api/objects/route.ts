import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCES_KEY as string,
    secretAccessKey: process.env.AWS_SECRET_KEY as string,
  },
  region: "ap-south-1",
});

export async function GET(req: Request) {
  const command = new ListObjectsV2Command({
    Bucket: "wekraft-demo-rox-1",
  });
  const result = await client.send(command);
  console.log(result);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  console.log("POST /api/objects - Upload request received");
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const oldUrl = formData.get("oldUrl") as string;

    if (!file) {
      console.error("No file found in formData");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

    // Validation
    // Max size: 5MB
    if (file.size > 1 * 1024 * 1024) {
        console.warn("File too large");
        return NextResponse.json({ error: "File too large. Max 1MB allowed." }, { status: 400 });
    }

    // Image/check type if needed, but client side can also restrict. 
    // Just ensuring basic upload first.

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `thumbnails/${Date.now()}-${file.name.replace(/\s/g, "-")}`;
    
    console.log(`Uploading to S3 as: ${fileName}`);

    const command = new PutObjectCommand({
      Bucket: "wekraft-demo-rox-1",
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // ACL: "public-read", // Uncomment if bucket policies require ACL. usually bucket policy handles this.
    });

    await client.send(command);

    const url = `https://wekraft-demo-rox-1.s3.ap-south-1.amazonaws.com/${fileName}`;
    console.log("Upload successful, URL:", url);

    // DELETE OLD FILE IF EXISTS
    if (oldUrl) {
        try {
            console.log("Attempting to delete old thumbnail:", oldUrl);
            const oldKey = oldUrl.split(".amazonaws.com/")[1];
            if (oldKey) {
                 const deleteCommand = new DeleteObjectCommand({
                    Bucket: "wekraft-demo-rox-1",
                    Key: oldKey,
                });
                await client.send(deleteCommand);
                console.log("Old thumbnail deleted successfully");
            } else {
                console.warn("Could not extract key from oldUrl");
            }
        } catch (deleteError) {
            console.error("Error deleting old thumbnail:", deleteError);
            // Don't fail the request just because delete failed, user still got new one uploaded
        }
    }

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
