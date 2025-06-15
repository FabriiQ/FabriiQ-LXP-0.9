import { AdminLayout } from "@/components/layouts/admin-layout";

export default function AdminUtilitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
