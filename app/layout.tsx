import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Teacher - Creative Writing Teacher | Young Voices Program",
  description: "Join The Teacher's Creative Writing Program for Grades 4-7. Nurturing young writers through poetry, stories, and creative expression. Online group classes with personal attention.",
  keywords: "creative writing, English teacher, children writing, poetry, storytelling, grades 4-7, online classes, The Teacher",
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    shortcut: { url: '/favicon.svg' }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onCaptchaVerify = function(token) {
                window.captchaToken = token;
                // Dispatch custom event to notify React components
                window.dispatchEvent(new CustomEvent('captchaVerified', { detail: token }));
              };
              window.onCaptchaExpired = function() {
                window.captchaToken = null;
                window.dispatchEvent(new CustomEvent('captchaExpired'));
              };
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
