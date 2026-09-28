// app/admin/layout.tsx
import AdminProviders from "./provider";
import AdminShell from "./admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}