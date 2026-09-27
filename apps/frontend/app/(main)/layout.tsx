import { ReactNode } from "react";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/footer/Footer";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
