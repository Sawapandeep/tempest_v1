// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/components/layout/ThemeProvider";
import { ToastProvider } from "@/app/components/ui/ToastProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "Tempest Maps",
        template: "%s | Tempest Maps",
    },
    description:
        "Open-source mapping platform powered by OpenStreetMap. Navigate, explore, and discover with Tempest Maps.",
    keywords: ["maps", "navigation", "openstreetmap", "routing", "geocoding", "open-source"],
    authors: [{ name: "Tempest Maps" }],
    creator: "Tempest Maps",
    manifest: "/manifest.json",
    icons: {
        icon: "/favicon.ico",
        apple: "/apple-touch-icon.png",
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        title: "Tempest Maps",
        description: "Open-source mapping platform powered by OpenStreetMap.",
        siteName: "Tempest Maps",
    },
    twitter: {
        card: "summary_large_image",
        title: "Tempest Maps",
        description: "Open-source mapping platform powered by OpenStreetMap.",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
        { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full`}
            >
                <ThemeProvider>
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}