"use client";

import { useState } from "react";
import { PermissionList } from "~/components/admin/permissions/PermissionList";
import { PermissionMatrix } from "~/components/admin/permissions/PermissionMatrix";
import { AuditLog } from "~/components/admin/permissions/AuditLog";
import { PageHeader } from "~/components/ui/atoms/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui";

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Management"
        description="Manage system permissions and role assignments"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Permissions</TabsTrigger>
          <TabsTrigger value="matrix">Role Matrix</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <PermissionList />
        </TabsContent>

        <TabsContent value="matrix">
          <PermissionMatrix />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
} 