import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/atoms/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/forms/form";

export const metadata: Metadata = {
  title: "Create New Facility | Campus Admin",
  description: "Create a new facility for your campus",
};

const facilityFormSchema = z.object({
  name: z.string().min(3, {
    message: "Facility name must be at least 3 characters.",
  }),
  code: z.string().min(2, {
    message: "Facility code must be at least 2 characters.",
  }),
  type: z.enum(["CLASSROOM", "LABORATORY", "AUDITORIUM", "LIBRARY", "OFFICE", "CAFETERIA", "OTHER"], {
    required_error: "Please select a facility type.",
  }),
  capacity: z.number().min(1).default(30),
  building: z.string().optional(),
  floor: z.number().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export default async function CreateFacilityPage() {
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      userType: true,
      primaryCampusId: true,
    },
  });

  if (!user || user.userType !== 'CAMPUS_ADMIN' || !user.primaryCampusId) {
    redirect("/login");
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id: user.primaryCampusId },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
  });

  if (!campus) {
    redirect("/login");
  }

  // Get existing buildings for this campus
  const buildings = await prisma.$queryRaw<{ building: string }[]>`
    SELECT DISTINCT building
    FROM "Facility"
    WHERE "campusId" = ${user.primaryCampusId}
    AND building IS NOT NULL
    ORDER BY building
  `;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/facilities">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Facility</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facility Details</CardTitle>
          <CardDescription>Enter the details for the new facility at {campus.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name</Label>
                  <Input id="name" placeholder="e.g., Computer Lab A" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Facility Code</Label>
                  <Input id="code" placeholder="e.g., CL-A" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Facility Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASSROOM">Classroom</SelectItem>
                      <SelectItem value="LABORATORY">Laboratory</SelectItem>
                      <SelectItem value="AUDITORIUM">Auditorium</SelectItem>
                      <SelectItem value="LIBRARY">Library</SelectItem>
                      <SelectItem value="OFFICE">Office</SelectItem>
                      <SelectItem value="CAFETERIA">Cafeteria</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" min="1" defaultValue="30" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a building or enter new" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Enter New Building</SelectItem>
                      {buildings.map((b, index) => (
                        <SelectItem key={index} value={b.building}>
                          {b.building}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newBuilding">New Building Name (if applicable)</Label>
                  <Input id="newBuilding" placeholder="Enter new building name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input id="floor" type="number" min="0" defaultValue="1" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" placeholder="Enter a description for this facility" className="min-h-[120px]" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Features (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-projector" className="rounded border-gray-300" />
                  <label htmlFor="feature-projector">Projector</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-whiteboard" className="rounded border-gray-300" />
                  <label htmlFor="feature-whiteboard">Whiteboard</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-computers" className="rounded border-gray-300" />
                  <label htmlFor="feature-computers">Computers</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-wifi" className="rounded border-gray-300" />
                  <label htmlFor="feature-wifi">Wi-Fi</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-ac" className="rounded border-gray-300" />
                  <label htmlFor="feature-ac">Air Conditioning</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-accessible" className="rounded border-gray-300" />
                  <label htmlFor="feature-accessible">Wheelchair Accessible</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-audio" className="rounded border-gray-300" />
                  <label htmlFor="feature-audio">Audio System</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feature-video" className="rounded border-gray-300" />
                  <label htmlFor="feature-video">Video Conferencing</label>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/admin/campus/facilities">Cancel</Link>
          </Button>
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" /> Create Facility
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 