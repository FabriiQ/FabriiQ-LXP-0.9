import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/atoms/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/forms/form";
import { DatePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/utils/api";
import { StudentFormClient } from "./student-form";

const studentFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], {
    required_error: "Please select a gender.",
  }).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  programId: z.string().optional(),
  enrollmentDate: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  notes: z.string().optional(),
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
});

export default async function AddStudentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
      institutionId: true,
    },
  });

  if (!campus) {
    redirect("/login");
  }

  // Get programs for this campus
  const programs = await prisma.program.findMany({
    where: {
      campusOfferings: {
        some: {
          campusId: user.primaryCampusId,
          status: 'ACTIVE'
        }
      }
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Get active terms
  const terms = await prisma.term.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      startDate: 'desc',
    },
    take: 10,
  });

  // Get active classes for this campus
  const classes = await prisma.class.findMany({
    where: {
      campusId: user.primaryCampusId,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      courseCampus: {
        include: {
          course: {
            select: {
              name: true,
            }
          }
        }
      },
      term: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/students">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Add New Student</h1>
        </div>
      </div>

      <StudentFormClient 
        campusId={campus.id}
        campusName={campus.name}
        institutionId={campus.institutionId}
        programs={programs}
        terms={terms}
        classes={classes}
        userId={user.id}
      />
    </div>
  );
} 

type Program = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
};




