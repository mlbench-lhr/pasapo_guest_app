import type { Metadata } from "next";
import "./globals.css";
import MobileOnlyWrapper from "@/components/MobileOnlyWrapper";

export const metadata: Metadata = {
  title: "Pasapo Guest App",
  description: "Scan Passport and check in your room",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>

      <body
      >
        <MobileOnlyWrapper>{children}</MobileOnlyWrapper>
      </body>
    </html>
  );
}
