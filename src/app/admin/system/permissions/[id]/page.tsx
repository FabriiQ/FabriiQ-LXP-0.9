"use client";

import { useParams } from "next/navigation";
import { PermissionInheritance } from "~/components/admin/permissions/PermissionInheritance";
import { AuditDetail } from "~/components/admin/permissions/AuditDetail";
import { PageHeader } from "~/components/ui/atoms/page-header";
import { api } from "~/utils/api";

export default function PermissionDetailPage() {
  const params = useParams();
  const permissionId = params.id as string;
  const { data: permission } = api.permission.getById.useQuery({ id: permissionId });

  if (!permission) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={permission.name}
        description="View permission details and inheritance"
      />

      <div className="grid grid-cols-2 gap-6">
        <PermissionInheritance roleId={permission.roleId} />
        <AuditDetail auditId={permissionId} />
      </div>
    </div>
  );
} 