import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { APP_NAME, APP_URL } from "@/lib/constants";
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
