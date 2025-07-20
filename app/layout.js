import "./globals.css";
import { UserProvider } from './components/UserProvider'
import ClientLayout from './components/ClientLayout'

export const metadata = {
  title: "PRs Forever - Workout Tracker",
  description: "Track your workout sessions and progression in strength training",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased h-full flex flex-col">
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
      </body>
    </html>
  );
}
