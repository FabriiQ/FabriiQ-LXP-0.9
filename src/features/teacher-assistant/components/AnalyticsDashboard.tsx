'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/core/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/core/tabs';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { Loader2 } from 'lucide-react';
import { DateRangeSelector } from '@/components/teacher/classes/DateRangeSelector';
import { DateRange } from 'react-day-picker';
import { addDays, format, subDays } from 'date-fns';

/**
 * Analytics Dashboard for the Teacher Assistant
 *
 * Displays usage statistics and insights
 */
export function AnalyticsDashboard() {
  const { data: session } = useSession();
  const teacherId = session?.user?.id;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  // Fetch analytics data
  const { data, isLoading, error } = api.analytics.getTeacherAssistantAnalytics.useQuery({
    teacherId: teacherId || '',
    startDate: dateRange?.from?.toISOString() || subDays(new Date(), 30).toISOString(),
    endDate: dateRange?.to?.toISOString() || new Date().toISOString()
  }, {
    enabled: !!teacherId,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        <p>Error loading analytics: {error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <p>No analytics data available.</p>
      </div>
    );
  }

  // Prepare data for charts
  const dailyUsageData = data.dailyUsage.map(item => ({
    date: item.date,
    count: item.count
  }));

  const featureUsageData = [
    { id: 'Messages', value: data.featureUsage.messages },
    { id: 'Searches', value: data.featureUsage.searches },
    { id: 'Voice Input', value: data.featureUsage.voiceInput },
    { id: 'Voice Output', value: data.featureUsage.voiceOutput },
    { id: 'Feedback', value: data.featureUsage.feedback }
  ];

  const intentData = data.topIntents.map(intent => ({
    intent: intent.intent,
    count: intent.count
  }));

  // Format daily usage data for line chart
  const lineData = [
    {
      id: 'Usage',
      data: dailyUsageData.map(item => ({
        x: item.date,
        y: item.count
      }))
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Teacher Assistant Analytics</h2>
        <DateRangeSelector
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Interactions</CardTitle>
            <CardDescription>Total number of interactions with the assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Messages</CardTitle>
            <CardDescription>Total messages sent to the assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.featureUsage.messages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Voice Usage</CardTitle>
            <CardDescription>Voice input and output usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {data.featureUsage.voiceInput + data.featureUsage.voiceOutput}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Daily Usage</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="intents">Top Intents</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage</CardTitle>
              <CardDescription>Number of interactions per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {lineData[0].data.length > 0 ? (
                  <ResponsiveLine
                    data={lineData}
                    margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 0, max: 'auto' }}
                    curve="monotoneX"
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Date',
                      legendOffset: 40,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Interactions',
                      legendOffset: -40,
                      legendPosition: 'middle'
                    }}
                    colors={{ scheme: 'category10' }}
                    pointSize={10}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    enablePointLabel={true}
                    pointLabel="y"
                    pointLabelYOffset={-12}
                    useMesh={true}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">No daily usage data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
              <CardDescription>Usage breakdown by feature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {featureUsageData.some(item => item.value > 0) ? (
                  <ResponsivePie
                    data={featureUsageData}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    activeOuterRadiusOffset={8}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor={{ theme: 'text.primary' }}
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    colors={{ scheme: 'category10' }}
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle'
                      }
                    ]}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">No feature usage data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Intents</CardTitle>
              <CardDescription>Most common user intents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {intentData.length > 0 ? (
                  <ResponsiveBar
                    data={intentData}
                    keys={['count']}
                    indexBy="intent"
                    margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={{ scheme: 'category10' }}
                    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Intent',
                      legendPosition: 'middle',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Count',
                      legendPosition: 'middle',
                      legendOffset: -40
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    animate={true}
                    motionStiffness={90}
                    motionDamping={15}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">No intent data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
