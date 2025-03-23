# Pudzian Deepfake App (Next.js)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).  
It allows users to upload videos, which are then processed into deepfakes — Pudzian style 💪.

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the root directory and add the following:

```env
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
AWS_REGION=eu-central-1
S3_BUCKET_NAME=pudzian-dev
```

> Make sure the IAM user only has scoped permissions to your S3 bucket for security.

### 3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser to see it in action.

---

## 🧠 Tech Stack

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com)
- [AWS S3](https://aws.amazon.com/s3/) for file upload & storage
- [Lucide Icons](https://lucide.dev/) for UI icons

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub Repository](https://github.com/vercel/next.js)

---

## 🧠 Font

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically load [Geist](https://vercel.com/font) — a modern font family from Vercel.

---

## 🛡️ Security Tip

Never expose AWS credentials publicly. Use environment variables and scope IAM permissions to a specific bucket and actions only.
