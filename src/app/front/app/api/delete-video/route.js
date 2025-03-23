import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
    try {
      const { key } = await request.json();
  
      if (!key) {
        return new Response(JSON.stringify({ error: 'Missing S3 key' }), { status: 400 });
      }
  
      const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
  
      await s3.send(command);
  
      return new Response(JSON.stringify({ message: 'File deleted successfully' }), {
        status: 200,
      });
    } catch (err) {
      console.error('[S3 DELETE ERROR]', err);
      return new Response(JSON.stringify({ error: 'Failed to delete file' }), {
        status: 500,
      });
    }
  }
