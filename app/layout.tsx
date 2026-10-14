import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "ReserveHub — Resource Reservation Management System",
  description: "Streamline your resource scheduling.",
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