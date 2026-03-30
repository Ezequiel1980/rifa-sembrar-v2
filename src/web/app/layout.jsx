import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Sembrar Rifa",
  description: "Sistema de rifas online",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </body>
    </html>
  );
}
