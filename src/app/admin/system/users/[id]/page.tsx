"use client";

import { useParams } from "next/navigation";
import { use } from "react";
import { UserProfile } from "@/components/admin/users/UserProfile";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function UserDetailPage() {
  const params = useParams();
  // Unwrap params properly using React.use() for future compatibility
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const userId = unwrappedParams?.id as string;
  const { data, isLoading } = api.user.getById.useQuery(userId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <div>User not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name || "User Profile"}
        description={`Manage user profile and permissions`}
      />
      <UserProfile userId={userId} />
    </div>
  );
}