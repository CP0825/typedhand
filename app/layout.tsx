import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Your handwriting. Typed.`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Turn your own handwriting into a font, then type anything and export it as a print-ready PDF — for personal cards and letters, journals, language practice, classroom worksheets, and accessible writing.",
  openGraph: {
    title: `${APP_NAME} — Your handwriting. Typed.`,
    description:
      "Turn your own handwriting into a font, then type anything and export it as a print-ready PDF.",
    type: "website",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Your handwriting. Typed.`,
    description:
      "Turn your own handwriting into a font, then type anything and export it as a print-ready PDF.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-th-canvas font-sans text-th-ink antialiased">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
