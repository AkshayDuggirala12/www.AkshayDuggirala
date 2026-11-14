This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## API configuration

The site uses `https://akshaywebsitebackend.onrender.com` by default. To point it at another API,
set `NEXT_PUBLIC_API_BASE_URL` to the API's base URL before building the frontend, then rebuild and
restart the app. For example:

```text
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

The API must allow the website's origin in its CORS configuration. See the [backend deployment
notes](../backend/README.md) for the required Python and PostgreSQL environment variables.

## Careers and hiring dashboard

- Candidates apply at `/careers/apply` and check status at `/careers/portal`.
- Applicants can securely update their submitted profile and PDF resume from the portal.
- The private hiring dashboard is at `/admin`; it requires the backend `ADMIN_API_KEY`.
- Applicant email links and hiring notifications require SMTP to be configured on the backend.
- Application details and PDF resumes are stored by the backend in PostgreSQL.
- Daily page counts are aggregate counts by route; the site does not store visitor IP addresses or
  identity.

## Hosting on BigRock

The site is configured for static export. Run `npm run build` and upload the **contents** of the
generated `out/` folder to the domain's `public_html` directory in BigRock cPanel. The trailing
slash routes export as folders with `index.html`, so paths such as `/careers/apply/` work with
standard static hosting.

The website's forms, applicant portal, hiring dashboard, and visit counters still require the
FastAPI API and PostgreSQL database. Keep those on a Python-capable API host with persistent
PostgreSQL; the frontend can point to it via `NEXT_PUBLIC_API_BASE_URL` before the build. Do not
upload the backend `.env` or put admin/SMTP/database secrets in the frontend.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
