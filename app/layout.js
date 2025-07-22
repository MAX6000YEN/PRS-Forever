import "./globals.css";
import { UserProvider } from './components/UserProvider'
import ClientLayout from './components/ClientLayout'
import { Funnel_Display } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"

const funnelDisplay = Funnel_Display({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-funnel-display'
})

export const metadata = {
  title: "PRs Forever - Workout Tracker",
  description: "Track your workout sessions and progression in strength training",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full ${funnelDisplay.variable}`}>
      <body className={`antialiased h-full flex flex-col ${funnelDisplay.className}`}>
        <UserProvider>
          <ClientLayout>
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <footer className="mt-auto text-center py-2">
              <p className="text-xs text-gray-500">
                By MAX6000¥EN with love
              </p>
            </footer>
          </ClientLayout>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}
