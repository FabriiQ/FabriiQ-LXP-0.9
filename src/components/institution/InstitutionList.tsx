import React from "react";
import Link from "next/link";
import { Institution } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, BuildingIcon, MapPinIcon, GlobeIcon, PhoneIcon, MailIcon } from "lucide-react";
import { formatDate } from "@/utils/format";

// Extended Institution type to match what we expect from the database
interface ExtendedInstitution extends Institution {
  description?: string | null;
  address?: string | null;
  contact?: string | null;
  email?: string | null;
  website?: string | null;
}

interface InstitutionWithCounts extends ExtendedInstitution {
  _count?: {
    campuses: number;
  };
}

interface InstitutionListProps {
  institutions: InstitutionWithCounts[];
}

export function InstitutionList({ institutions }: InstitutionListProps) {
  if (!institutions.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <BuildingIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No institutions found</h3>
        <p className="text-sm text-gray-500 mt-1">Get started by creating a new institution.</p>
        <Link href="/admin/system/institutions/new" className="mt-4">
          <Button>Create Institution</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {institutions.map((institution) => (
        <Card key={institution.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{institution.name}</CardTitle>
              <Badge variant={institution.status === "ACTIVE" ? "success" : "secondary"}>
                {institution.status}
              </Badge>
            </div>
            <CardDescription>Code: {institution.code}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2 text-sm">
              {institution.address && (
                <div className="flex items-start">
                  <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <span>{institution.address}</span>
                </div>
              )}
              {institution.website && (
                <div className="flex items-center">
                  <GlobeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a 
                    href={institution.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {institution.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {institution.contact && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{institution.contact}</span>
                </div>
              )}
              {institution.email && (
                <div className="flex items-center">
                  <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <a 
                    href={`mailto:${institution.email}`}
                    className="text-primary hover:underline truncate"
                  >
                    {institution.email}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2 text-xs text-muted-foreground">
            <div>
              {institution._count?.campuses || 0} {institution._count?.campuses === 1 ? 'Campus' : 'Campuses'}
            </div>
            <div>
              Created {formatDate(institution.createdAt)}
            </div>
          </CardFooter>
          <div className="bg-muted p-2 flex justify-end">
            <Link href={`/admin/system/institutions/${institution.id}`}>
              <Button variant="outline" size="sm">
                <EyeIcon className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
} 