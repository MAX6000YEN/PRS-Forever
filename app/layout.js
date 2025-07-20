import "./globals.css";

export const metadata = {
  title: "PRs Forever - Workout Tracker",
  description: "Track your workout sessions and progression in strength training",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        <footer className="text-center py-2">
          <p className="text-xs text-gray-500">
            By MAX6000¥EN with love
          </p>
        </footer>
      </body>
    </html>
  );
}
