import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ContentProvider } from "@/context/ContentProvider";
import { NavigationProvider } from "@/context/NavigationContext";
import HUD from "@/components/HUD";
import WarpEffect from "@/components/WarpEffect";
import UniverseShell from "@/components/UniverseShell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aditi Mallick | Software Engineer",
  description: "Software Engineer portfolio of Aditi Mallick. Specializing in Enterprise Desktop Automation, WPF, .NET/ASP.NET Core, and React.",
  keywords: ["Software Engineer", "Enterprise Desktop Automation", "WPF Developer", "ASP.NET Core", "React Developer", "Automation Engineer", "Aditi Mallick"],
  authors: [{ name: "Aditi Mallick" }],
  openGraph: {
    title: "Aditi Mallick | Software Engineer",
    description: "Software Engineer portfolio of Aditi Mallick, specializing in Enterprise Desktop Automation, WPF, .NET/ASP.NET Core, and React.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditi Mallick | Software Engineer",
    description: "Software Engineer portfolio of Aditi Mallick.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full select-none">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full overflow-hidden bg-space-black text-slate-100 antialiased`}>
        {/* SEO Structured Person Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Aditi Mallick",
              "jobTitle": "Software Engineer",
              "description": "Software Engineer specializing in Enterprise Desktop Automation, WPF, ASP.NET Core, and React.",
              "knowsAbout": [
                "Software Engineering",
                "WPF Developer",
                "ASP.NET Core",
                "Automation Engineering",
                "React Developer",
                "Next.js"
              ]
            })
          }}
        />
        <ContentProvider>
          <NavigationProvider>
            <ErrorBoundary fallbackTitle="Core Navigation Terminal">
              {/* Global space transition elements */}
              <WarpEffect />
              <HUD />
              
              {/* Interactive views */}
              <main className="relative w-screen h-screen z-10 overflow-hidden">
                <UniverseShell>
                  {children}
                </UniverseShell>
              </main>
            </ErrorBoundary>
          </NavigationProvider>
        </ContentProvider>
        
        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
