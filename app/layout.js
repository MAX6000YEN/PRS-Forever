import "./globals.css";

export const metadata = {
  title: "PRs Forever - Workout Tracker",
  description: "Track your workout sessions and progression in strength training",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
