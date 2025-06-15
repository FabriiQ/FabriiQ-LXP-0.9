import { AdminLayout } from "@/components/layouts/admin-layout";

export default function CoordinatorCampusAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
