import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcoVoyage AI — Sustainable Travel Companion',
  description: 'AI-powered eco-conscious travel planner. Discover sustainable destinations, compare carbon footprints, and plan green itineraries with intelligent conversation.',
  openGraph: {
    title: 'EcoVoyage AI — Sustainable Travel Companion',
    description: 'Plan eco-conscious trips with AI. Compare carbon footprints, discover green destinations, and offset your travel impact.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
