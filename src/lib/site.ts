import type { Metadata } from "next";
import { profile } from "@/data/trace";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const title = `${profile.name} · AI/ML Engineer`;
const description = `${profile.tagline} ${profile.role}. 3rd of 245 final-round submissions in the Arize track of the Google Cloud Rapid Agent Hackathon.`;

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: { title, description, type: "website", url: "/" },
  twitter: { card: "summary_large_image", title, description },
};
