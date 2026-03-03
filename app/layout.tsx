import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Providers } from "@/components/providers";
import "./globals.css";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Skattbók",
  description: "Norse expense tracker — Record the Spoils",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skattbók",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#d4a017",
          colorBackground: "#0f0f0f",
          colorInputBackground: "#1a1a1a",
          colorInputText: "#f5e6c8",
        },
      }}
    >
      <html lang="en">
        <body className="bg-norse-bg text-norse-text antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
