import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { RentalCartProvider } from "@/contexts/rental-cart-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { EnhancedChatProvider } from "@/contexts/enhanced-chat-context"
import { WishlistProvider } from "@/contexts/WishlistContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import RoleBasedNavigation from "@/components/role-based-navigation"
import Footer from "@/components/footer"
import ErrorBoundary from "@/components/ErrorBoundary"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  preload: true
})

export const metadata: Metadata = {
  title: {
    default: 'FarmMarket - Direct Farm to Consumer Marketplace',
    template: '%s | FarmMarket'
  },
  description: "Connect directly with local farmers and buy fresh, organic produce",
  generator: 'Next.js',
  applicationName: 'FarmMarket',
  referrer: 'origin-when-cross-origin',
  keywords: ['farm', 'market', 'organic', 'fresh produce', 'local farmers', 'farm to table'],
  authors: [{ name: 'FarmMarket Team' }],
  creator: 'FarmMarket',
  publisher: 'FarmMarket',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://farmmarket.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  openGraph: {
    title: 'FarmMarket - Direct Farm to Consumer Marketplace',
    description: 'Connect directly with local farmers and buy fresh, organic produce',
    url: 'https://farmmarket.com',
    siteName: 'FarmMarket',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FarmMarket - Direct Farm to Consumer Marketplace',
    description: 'Connect directly with local farmers and buy fresh, organic produce',
    creator: '@farmmarket',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Removed favicon and webmanifest to prevent 404 errors
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="icon" href="data:;base64,=" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <CartProvider>
                <RentalCartProvider>
                  <NotificationProvider>
                    <EnhancedChatProvider>
                      <WishlistProvider>
                        <div className="min-h-screen flex flex-col">
                          <RoleBasedNavigation />
                          <main className="flex-1">{children}</main>
                          <Footer />
                          <nav className="fixed bottom-4 right-4 z-50">
                            <a 
                              href="/marketing" 
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                              Marketing Tool
                            </a>
                          </nav>
                        </div>
                        <Toaster />
                      </WishlistProvider>
                    </EnhancedChatProvider>
                  </NotificationProvider>
                </RentalCartProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
