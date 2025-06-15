'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';
import {
  Plus,
  BarChart,
  FileText,
  Settings,
  Loader2,
  LayoutGrid
} from 'lucide-react';
import { DollarSign } from '@/components/ui/icons/custom-icons';
import { format } from 'date-fns';

export default function SystemFeeManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch fee collection statistics
  const { data: feeStats, isLoading: isLoadingFeeStats } = api.enrollmentFee.getFeeCollectionStats.useQuery();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Fee Management"
          description="Manage fee structures and student fees across all campuses"
        />
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin/system/fee-management/structures/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Fee Structure
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="discount-types">Discount Types</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Fee Collected</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFeeStats ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">Rs. {feeStats?.totalCollected.toLocaleString() || '0'}</div>
                    <p className="text-xs text-muted-foreground">Across all campuses</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFeeStats ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">Rs. {feeStats?.pendingFees.toLocaleString() || '0'}</div>
                    <p className="text-xs text-muted-foreground">Yet to be collected</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fee Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFeeStats ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {feeStats?.totalStudents ?
                        Math.round((feeStats.studentsWithFees / feeStats.totalStudents) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {feeStats?.studentsWithFees || 0} of {feeStats?.totalStudents || 0} students
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Collection Overview</CardTitle>
                <CardDescription>Fee collection status across campuses</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart className="h-16 w-16 mx-auto mb-4" />
                  <p>Fee collection chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Fee Transactions</CardTitle>
                <CardDescription>Latest fee payments across all campuses</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFeeStats ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center border-b pb-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-24" />
                      </div>
                    ))}
                  </div>
                ) : feeStats?.recentTransactions && feeStats.recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {feeStats.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">{transaction.studentName}</div>
                          <div className="text-xs text-muted-foreground">{transaction.campusName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Rs. {transaction.amount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(transaction.date), 'dd MMM yyyy')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent transactions found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common fee management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/system/fee-management/structures')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Fee Structures
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/system/fee-management/discount-types')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Manage Discount Types
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/system/fee-management/challan-designer')}>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Challan Designer
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/system/fee-management/bulk-challan')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Bulk Generate Challans
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/system/fee-management/reports')}>
                    <BarChart className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/system/fee-management/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Fee Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Student Fee Status</CardTitle>
                <CardDescription>Overview of student fee payment status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFeeStats ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-medium">Students with Fees</h3>
                        <p className="text-3xl font-bold mt-2">{feeStats?.studentsWithFees || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-medium">Students without Fees</h3>
                        <p className="text-3xl font-bold mt-2">{feeStats?.studentsWithoutFees || 0}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Fee Payment Status</h3>
                      <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                        {feeStats?.totalCollected !== undefined && feeStats?.pendingFees !== undefined && (
                          <div
                            className="bg-primary h-full"
                            style={{
                              width: `${Math.round((feeStats.totalCollected / (feeStats.totalCollected + feeStats.pendingFees)) * 100)}%`
                            }}
                          />
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Received: Rs. {feeStats?.totalCollected.toLocaleString() || 0}</span>
                        <span>Pending: Rs. {feeStats?.pendingFees.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="structures" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fee Structures</CardTitle>
                <CardDescription>Manage fee structures across all campuses</CardDescription>
              </div>
              <Button onClick={() => router.push('/admin/system/fee-management/structures/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Structure
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Fee structures list will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discount-types" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Discount Types</CardTitle>
                <CardDescription>Manage discount types for fee structures</CardDescription>
              </div>
              <Button onClick={() => router.push('/admin/system/fee-management/discount-types/new')}>
                <Plus className="h-4 w-4 mr-2" />
                New Discount Type
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Discount types list will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Reports</CardTitle>
              <CardDescription>Generate and view fee collection reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Fee reports will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
