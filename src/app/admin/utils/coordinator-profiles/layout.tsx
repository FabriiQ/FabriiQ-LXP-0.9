import { AdminLayout } from "@/components/layouts/admin-layout";

export default function CoordinatorProfilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
