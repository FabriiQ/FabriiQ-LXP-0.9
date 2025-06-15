"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Users,
  School,
  BookOpen,
  Settings,
  Database,
  RefreshCw,
  CheckCircle
} from "lucide-react";

export default function AdminUtilitiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Utilities</h1>
          <p className="text-muted-foreground">System maintenance and utility tools</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Coordinator Profiles
            </CardTitle>
            <CardDescription>
              Create missing coordinator profiles for users with the CAMPUS_COORDINATOR role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/utils/coordinator-profiles">
                <RefreshCw className="h-4 w-4 mr-2" />
                Create Missing Profiles
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <School className="h-5 w-5 mr-2" />
              Coordinator Programs
            </CardTitle>
            <CardDescription>
              Check program associations for coordinators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/utils/coordinator-programs">
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Associations
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <School className="h-5 w-5 mr-2" />
              Campus Access
            </CardTitle>
            <CardDescription>
              Check and fix campus access for coordinators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/utils/coordinator-campus-access">
                <Users className="h-4 w-4 mr-2" />
                Check Campus Access
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
