'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BloomsTaxonomyLevel, BloomsDistribution } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA, ORDERED_BLOOMS_LEVELS } from '../../constants/bloom-levels';
import { api } from '@/trpc/react';
import { Download, FileText, Printer, Share2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BloomsDistributionChart } from '../../components/taxonomy/BloomsDistributionChart';
import dynamic from 'next/dynamic';

// Dynamically import chart components
const ResponsiveRadar = dynamic(
  () => import('@nivo/radar').then(mod => mod.ResponsiveRadar),
  { ssr: false }
);

interface CognitiveBalanceReportProps {
  classId: string;
  teacherId: string;
  subjectId?: string;
  className?: string;
}

// Ideal distribution based on educational research
const IDEAL_DISTRIBUTION: BloomsDistribution = {
  [BloomsTaxonomyLevel.REMEMBER]: 15,
  [BloomsTaxonomyLevel.UNDERSTAND]: 20,
  [BloomsTaxonomyLevel.APPLY]: 25,
  [BloomsTaxonomyLevel.ANALYZE]: 20,
  [BloomsTaxonomyLevel.EVALUATE]: 10,
  [BloomsTaxonomyLevel.CREATE]: 10
};

export function CognitiveBalanceReport({
  classId,
  teacherId,
  subjectId,
  className = ""
}: CognitiveBalanceReportProps) {
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'adjustments'>('overview');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Get class performance data
  const { data: classPerformance, isLoading } = api.bloomsAnalytics.getClassPerformance.useQuery({
    classId
  });

  // Generate PDF report
  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    // TODO: Implement PDF generation
    setTimeout(() => {
      setIsGeneratingPdf(false);
    }, 2000);
  };

  // Calculate balance score (0-100)
  const calculateBalanceScore = (distribution: BloomsDistribution): number => {
    if (!distribution) return 0;
    
    // Calculate the difference between actual and ideal distribution
    let totalDifference = 0;
    Object.values(BloomsTaxonomyLevel).forEach(level => {
      totalDifference += Math.abs(distribution[level] - IDEAL_DISTRIBUTION[level]);
    });
    
    // Convert to a 0-100 score (0 = completely unbalanced, 100 = perfectly balanced)
    // Maximum possible difference would be 200 (if all 100% is in one level and ideal is spread)
    return Math.max(0, 100 - (totalDifference / 2));
  };

  // Get balance status
  const getBalanceStatus = (score: number): 'balanced' | 'somewhat-balanced' | 'unbalanced' => {
    if (score >= 80) return 'balanced';
    if (score >= 50) return 'somewhat-balanced';
    return 'unbalanced';
  };

  // Generate recommendations based on distribution
  const generateRecommendations = (distribution: BloomsDistribution): string[] => {
    if (!distribution) return [];
    
    const recommendations: string[] = [];
    
    // Check for lower-order thinking dominance
    const lowerOrderPercentage = 
      distribution[BloomsTaxonomyLevel.REMEMBER] + 
      distribution[BloomsTaxonomyLevel.UNDERSTAND];
      
    if (lowerOrderPercentage > 50) {
      recommendations.push(
        "There's a heavy emphasis on lower-order thinking skills (Remember, Understand). " +
        "Consider incorporating more activities that require students to apply, analyze, evaluate, and create."
      );
    }
    
    // Check for higher-order thinking dominance
    const higherOrderPercentage = 
      distribution[BloomsTaxonomyLevel.ANALYZE] + 
      distribution[BloomsTaxonomyLevel.EVALUATE] + 
      distribution[BloomsTaxonomyLevel.CREATE];
      
    if (higherOrderPercentage > 50) {
      recommendations.push(
        "There's a strong focus on higher-order thinking skills, which is excellent. " +
        "Ensure students have sufficient foundational knowledge by balancing with appropriate remember and understand activities."
      );
    }
    
    // Check for specific level imbalances
    Object.values(BloomsTaxonomyLevel).forEach(level => {
      const difference = distribution[level] - IDEAL_DISTRIBUTION[level];
      const metadata = BLOOMS_LEVEL_METADATA[level];
      
      if (difference > 15) {
        recommendations.push(
          `The ${metadata.name} level (${distribution[level]}%) is significantly higher than the recommended balance (${IDEAL_DISTRIBUTION[level]}%). ` +
          `Consider reducing activities in this category and redistributing to other cognitive levels.`
        );
      } else if (difference < -15) {
        recommendations.push(
          `The ${metadata.name} level (${distribution[level]}%) is significantly lower than the recommended balance (${IDEAL_DISTRIBUTION[level]}%). ` +
          `Consider increasing activities that focus on ${metadata.description.toLowerCase()}.`
        );
      }
    });
    
    // If no specific recommendations, add a general one
    if (recommendations.length === 0) {
      recommendations.push(
        "Your cognitive balance is within reasonable parameters. Continue monitoring and making minor adjustments as needed."
      );
    }
    
    return recommendations;
  };

  // Format data for radar chart
  const getRadarChartData = () => {
    if (!classPerformance) return [];
    
    return Object.values(BloomsTaxonomyLevel).map(level => {
      const metadata = BLOOMS_LEVEL_METADATA[level];
      return {
        level: metadata.name,
        actual: classPerformance.distribution[level],
        ideal: IDEAL_DISTRIBUTION[level]
      };
    });
  };

  // Calculate balance score
  const balanceScore = classPerformance 
    ? calculateBalanceScore(classPerformance.distribution) 
    : 0;
  
  // Get balance status
  const balanceStatus = getBalanceStatus(balanceScore);
  
  // Generate recommendations
  const recommendations = classPerformance 
    ? generateRecommendations(classPerformance.distribution) 
    : [];

  return (
    <div className={`cognitive-balance-report ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Cognitive Balance Report</h2>
          <p className="text-muted-foreground">
            Analysis of cognitive level distribution and balance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || isLoading}
          >
            {isGeneratingPdf ? (
              <>Generating...</>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>

          <Button variant="outline" disabled={isGeneratingPdf}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          <Button variant="outline" disabled={isGeneratingPdf}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Balance Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="adjustments">Suggested Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Cognitive Balance Analysis</CardTitle>
              <CardDescription>
                Comparison of current distribution with ideal balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : classPerformance ? (
                <div className="space-y-6">
                  <Alert variant={
                    balanceStatus === 'balanced' ? 'default' : 
                    balanceStatus === 'somewhat-balanced' ? 'warning' : 'destructive'
                  }>
                    {balanceStatus === 'balanced' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : balanceStatus === 'somewhat-balanced' ? (
                      <Info className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {balanceStatus === 'balanced' 
                        ? 'Well-Balanced Cognitive Distribution' 
                        : balanceStatus === 'somewhat-balanced'
                        ? 'Somewhat Balanced Cognitive Distribution'
                        : 'Unbalanced Cognitive Distribution'
                      }
                    </AlertTitle>
                    <AlertDescription>
                      {balanceStatus === 'balanced' 
                        ? 'Your class has a well-balanced distribution of cognitive levels, promoting comprehensive learning.'
                        : balanceStatus === 'somewhat-balanced'
                        ? 'Your class has a somewhat balanced distribution of cognitive levels, but there is room for improvement.'
                        : 'Your class has an unbalanced distribution of cognitive levels, which may impact learning outcomes.'
                      }
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-4">Current vs. Ideal Distribution</h3>
                      <div className="h-[300px]">
                        <ResponsiveRadar
                          data={getRadarChartData()}
                          keys={['actual', 'ideal']}
                          indexBy="level"
                          maxValue={100}
                          margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
                          borderWidth={2}
                          gridLabelOffset={36}
                          dotSize={10}
                          dotColor={{ theme: 'background' }}
                          dotBorderWidth={2}
                          colors={['#2563eb', '#64748b']}
                          blendMode="multiply"
                          motionConfig="gentle"
                          legends={[
                            {
                              anchor: 'top-left',
                              direction: 'column',
                              translateX: -50,
                              translateY: -40,
                              itemWidth: 80,
                              itemHeight: 20,
                              itemTextColor: '#999',
                              symbolSize: 12,
                              symbolShape: 'circle',
                              effects: [
                                {
                                  on: 'hover',
                                  style: {
                                    itemTextColor: '#000'
                                  }
                                }
                              ]
                            }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No cognitive balance data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Balance Recommendations</CardTitle>
              <CardDescription>
                Suggestions to improve cognitive balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <p>{recommendation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recommendations available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle>Suggested Adjustments</CardTitle>
              <CardDescription>
                Specific adjustments to improve cognitive balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : classPerformance ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Current Distribution</h3>
                      <BloomsDistributionChart
                        distribution={classPerformance.distribution}
                        height={250}
                        showLabels={true}
                        showPercentages={true}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Ideal Distribution</h3>
                      <BloomsDistributionChart
                        distribution={IDEAL_DISTRIBUTION}
                        height={250}
                        showLabels={true}
                        showPercentages={true}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Adjustment Recommendations</h3>
                    <div className="space-y-4">
                      {Object.values(BloomsTaxonomyLevel).map(level => {
                        const metadata = BLOOMS_LEVEL_METADATA[level];
                        const current = classPerformance.distribution[level];
                        const ideal = IDEAL_DISTRIBUTION[level];
                        const difference = current - ideal;
                        const adjustment = Math.abs(difference);
                        
                        return (
                          <div key={level} className="flex items-center justify-between p-4 border rounded-md">
                            <div>
                              <h4 className="font-medium">{metadata.name}</h4>
                              <p className="text-sm text-muted-foreground">Current: {current}% / Ideal: {ideal}%</p>
                            </div>
                            <div className={`text-sm font-medium ${difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                              {difference > 0 ? (
                                <>Reduce by {adjustment}%</>
                              ) : difference < 0 ? (
                                <>Increase by {adjustment}%</>
                              ) : (
                                <>No change needed</>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No adjustment data available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
