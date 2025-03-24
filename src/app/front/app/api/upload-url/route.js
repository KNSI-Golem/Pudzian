import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const originalFilename = searchParams.get('filename');
  const contentType = searchParams.get('contentType');

  if (!originalFilename || !contentType) {
    return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
  }

  const extension = originalFilename.split('.').pop();
  const uuid = crypto.randomUUID();
  const generatedFilename = `${uuid}.${extension}`;
  const s3Key = `uploads/${generatedFilename}`;

  // Create PUT command for uploading
  const putCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
  });

  const signedPutUrl = await getSignedUrl(s3, putCommand, { expiresIn: 60 }); // 1 min to upload

  // Create GET command for accessing the file after upload
  const getCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
  });

  const signedGetUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 }); // 1 hour access

  return new Response(
    JSON.stringify({
      putUrl: signedPutUrl,
      getUrl: signedGetUrl,
      filename: generatedFilename,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
