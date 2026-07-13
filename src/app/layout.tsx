import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ContentProvider } from "@/context/ContentProvider";
import { NavigationProvider } from "@/context/NavigationContext";
import HUD from "@/components/HUD";
import WarpEffect from "@/components/WarpEffect";
import ResumeCapsule from "@/components/ResumeCapsule";
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
  title: "Aditi Mallick // Software Engineer Portfolio",
  description: "An immersive, 3D space-themed developer portfolio and CV universe built with Next.js, Framer Motion, Three.js, and Firebase.",
  keywords: ["Software Engineer", "Enterprise Desktop Automation", "WPF Developer", "ASP.NET Core", "React Developer", "Automation Engineer", "Careerverse"],
  authors: [{ name: "Aditi Mallick" }],
  openGraph: {
    title: "Aditi Mallick // Software Engineer Portfolio",
    description: "An immersive, 3D space-themed developer portfolio and CV universe.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditi Mallick // Software Engineer Portfolio",
    description: "An immersive, 3D space-themed developer portfolio.",
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
        <ContentProvider>
          <NavigationProvider>
            <ErrorBoundary fallbackTitle="Core Navigation Terminal">
              {/* Global space transition elements */}
              <WarpEffect />
              <HUD />
              <ResumeCapsule />
              
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
