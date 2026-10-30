import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Callum White and Cooper",
  description: "A private learning library for your files and resources."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}