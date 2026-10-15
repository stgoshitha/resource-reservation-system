import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "ReserveHub",
  description: "Streamline your resource scheduling.",
  icons: {
    icon: "/ReserveHub-Logo.jpg",
    shortcut: "/ReserveHub-Logo.png",
    apple: "/ReserveHub-Logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}