import React from "react";
import { Institution, Campus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingIcon, MapPinIcon, GlobeIcon, PhoneIcon, MailIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { formatDate } from "@/utils/format";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SimplifiedCampus {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt: Date;
}

interface InstitutionWithCampuses extends Institution {
  campuses?: SimplifiedCampus[];
  _count?: {
    campuses: number;
  };
  description?: string | null;
  address?: string | null;
  website?: string | null;
  contact?: string | null;
  email?: string | null;
}

interface InstitutionDetailProps {
  institution: InstitutionWithCampuses;
}

export function InstitutionDetail({ institution }: InstitutionDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Institution Details</CardTitle>
            <Badge variant={institution.status === "ACTIVE" ? "success" : "secondary"}>
              {institution.status}
            </Badge>
          </div>
          <CardDescription>Basic information about the institution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Institution Code</h3>
                <p className="text-base">{institution.code}</p>
              </div>
              
              {institution.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="text-base">{institution.description}</p>
                </div>
              )}
              
              {institution.address && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                  <div className="flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <p className="text-base">{institution.address}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {institution.website && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
                  <div className="flex items-center">
                    <GlobeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={institution.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {institution.website}
                    </a>
                  </div>
                </div>
              )}
              
              {institution.contact && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <p className="text-base">{institution.contact}</p>
                  </div>
                </div>
              )}
              
              {institution.email && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <div className="flex items-center">
                    <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={`mailto:${institution.email}`}
                      className="text-primary hover:underline"
                    >
                      {institution.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <div className="flex items-center mt-1">
                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-base">{formatDate(institution.createdAt)}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <div className="flex items-center mt-1">
                <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-base">{formatDate(institution.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="campuses">
        <TabsList>
          <TabsTrigger value="campuses">Campuses ({institution._count?.campuses || 0})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campuses" className="mt-6">
          {institution.campuses && institution.campuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {institution.campuses.map((campus) => (
                <Card key={campus.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{campus.name}</CardTitle>
                      <Badge variant={campus.status === "ACTIVE" ? "success" : "secondary"}>
                        {campus.status}
                      </Badge>
                    </div>
                    <CardDescription>Code: {campus.code}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="text-sm text-muted-foreground">
                      Created {formatDate(campus.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <BuildingIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No campuses found</h3>
              <p className="text-sm text-gray-500 mt-1">Get started by creating a new campus for this institution.</p>
              <Link href={`/admin/system/campuses/new?institutionId=${institution.id}`} className="mt-4">
                <Button>Create Campus</Button>
              </Link>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Institution Settings</CardTitle>
              <CardDescription>Configure institution-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings configuration will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="branding" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Institution Branding</CardTitle>
              <CardDescription>Manage institution branding assets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Branding management will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
