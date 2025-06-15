import React from "react";
import Link from "next/link";
import { Campus, Institution } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/button";
import { BuildingIcon, MapPinIcon, GlobeIcon, PhoneIcon, MailIcon, SchoolIcon } from "lucide-react";
import { formatDate } from "@/utils/format";

// Extended Campus type to match what we expect from the database
interface ExtendedCampus extends Omit<Campus, 'address' | 'contact'> {
  address: {
    street?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  institution: Institution;
  _count?: {
    userAccess: number;
    facilities: number;
    programs: number;
  };
}

interface CampusListProps {
  campuses: (Campus & {
    institution: Institution;
    _count?: {
      userAccess: number;
      facilities: number;
      programs: number;
    };
  })[];
}

export function CampusList({ campuses }: CampusListProps) {
  if (!campuses.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <SchoolIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No campuses found</h3>
        <p className="text-sm text-gray-500 mt-1">Get started by creating a new campus.</p>
        <Link href="/admin/system/campuses/new" className="mt-4">
          <Button>Create Campus</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campuses.map((campus) => {
        // Parse JSON data
        const address = typeof campus.address === 'object' && campus.address !== null 
          ? campus.address as unknown as { street?: string; city: string; state: string; postalCode: string; country: string; }
          : { city: 'Unknown', state: 'Unknown', country: 'Unknown', postalCode: 'Unknown' };
        
        const contact = typeof campus.contact === 'object' && campus.contact !== null 
          ? campus.contact as unknown as { phone: string; email: string; website?: string; }
          : { phone: 'Unknown', email: 'Unknown' };

        return (
          <Card key={campus.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{campus.name}</CardTitle>
                <Badge variant={campus.status === "ACTIVE" ? "success" : "secondary"}>
                  {campus.status}
                </Badge>
              </div>
              <CardDescription>
                <span className="block">
                  <span className="inline-flex items-center">
                    <BuildingIcon className="h-3.5 w-3.5 mr-1" />
                    {campus.institution.name}
                  </span>
                </span>
                <span className="block mt-1">
                  <span className="inline-flex items-center">
                    <MapPinIcon className="h-3.5 w-3.5 mr-1" />
                    {address.city}, {address.state}, {address.country}
                  </span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <PhoneIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center">
                  <MailIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>{contact.email}</span>
                </div>
                {contact.website && (
                  <div className="flex items-center">
                    <GlobeIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <a 
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
              <div className="mt-4 flex space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold">{campus._count?.programs || 0}</span>
                  <span className="text-xs text-muted-foreground">Programs</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold">{campus._count?.facilities || 0}</span>
                  <span className="text-xs text-muted-foreground">Facilities</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-semibold">{campus._count?.userAccess || 0}</span>
                  <span className="text-xs text-muted-foreground">Staff</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="flex justify-between items-center w-full">
                <div className="text-xs text-muted-foreground">
                  Created {formatDate(campus.createdAt)}
                </div>
                <Link href={`/admin/system/campuses/${campus.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
} 
