import { Inter } from 'next/font/google'; // next/font'u içe aktarın
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Inter font'u tanımlayın ve subsets'i belirtin
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Tailwind CSS ile kolay kullanım için bir CSS değişkeni atayabilirsiniz
  display: 'swap', // Font yüklenirken metnin görünür kalmasını sağlar
});

export const metadata = {
  title: "VerdantFlow",
  description: "A comprehensive business management app for customer use.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // html etiketine font sınıfını ekleyin
    // suppressHydrationWarning'i şimdilik koruyabiliriz, farklı bir nedenden dolayı da gerekli olabilir.
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/*
          Google Fonts linklerini buradan kaldırıyoruz.
          next/font/google modülü, fontları otomatik olarak optimize eder ve ekler,
          bu da hidratasyon uyumsuzluklarını önler.
        */}
        {/* <link rel="preconnect" href="https://fonts.googleapis.com" /> */}
        {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> */}
        {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" /> */}
      </head>
      {/* Tailwind CSS'te font-body yerine --font-inter değişkenini kullanabilirsiniz */}
      <body className={`font-sans ${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}