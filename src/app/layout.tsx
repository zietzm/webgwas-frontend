import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./ui/Header";
import Footer from "./ui/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebGWAS",
  description: "Web-based approximate GWAS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/flowbite@2.4.1/dist/flowbite.min.css"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen min-w-fit">
          <Header />
          <main className="container mx-auto px-4 py-8 flex-1">{children}</main>
          <Footer />
        </div>
        <script
          async
          src="https://cdn.jsdelivr.net/npm/flowbite@2.4.1/dist/flowbite.min.js"
        ></script>
      </body>
    </html>
  );
}
