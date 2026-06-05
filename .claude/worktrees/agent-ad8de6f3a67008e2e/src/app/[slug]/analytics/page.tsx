"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLabTests } from "@/hooks/use-lab-tests";
import { Loader2, TrendingUp, Users, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types";

export default function AnalyticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [labId, setLabId] = useState<string | null>(null);
  const { tests } = useLabTests();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Get lab ID
      const { data: lab } = await supabase
        .from("labs")
        .select("uuid")
        .eq("slug", slug)
        .single();

      if (!lab) return;
      setLabId(lab.uuid);

      // Get all clients with results
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .eq("lab_id", lab.uuid)
        .not("results", "is", null);

      setClients(clientsData || []);
      setLoading(false);
    };

    fetchData();
  }, [slug]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const clientsWithTests = clients.filter((c) => c.selected_tests && c.selected_tests.length > 0).length;
    const clientsWithResults = clients.filter(
      (c) => c.results?.entries && c.results.entries.length > 0
    ).length;

    let totalTestsOrdered = 0;
    let totalResultsEntered = 0;
    let abnormalResults = 0;
    let totalResults = 0;

    clients.forEach((client) => {
      if (client.selected_tests) {
        totalTestsOrdered += client.selected_tests.length;
      }

      if (client.results?.entries) {
        client.results.entries.forEach((entry: any) => {
          const testCount = Object.keys(entry.tests).length;
          totalResultsEntered += testCount;
          totalResults += testCount;

          Object.values(entry.tests).forEach((result: any) => {
            if (result.flag && result.flag !== "normal") {
              abnormalResults++;
            }
          });
        });
      }
    });

    const completionRate = totalTestsOrdered > 0 ? (totalResultsEntered / totalTestsOrdered) * 100 : 0;
    const abnormalRate = totalResults > 0 ? (abnormalResults / totalResults) * 100 : 0;

    return {
      totalClients,
      clientsWithTests,
      clientsWithResults,
      totalTestsOrdered,
      totalResultsEntered,
      completionRate: completionRate.toFixed(1),
      abnormalResults,
      abnormalRate: abnormalRate.toFixed(1),
    };
  }, [clients]);

  // Most common tests
  const mostCommonTests = useMemo(() => {
    const testCounts: Record<string, number> = {};

    clients.forEach((client) => {
      if (client.selected_tests) {
        client.selected_tests.forEach((testCode) => {
          testCounts[testCode] = (testCounts[testCode] || 0) + 1;
        });
      }
    });

    return Object.entries(testCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([testCode, count]) => ({
        testCode,
        testName: tests.find((t) => t.test_code === testCode)?.test_name_ar || testCode,
        count,
      }));
  }, [clients, tests]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const categoryCounts: Record<string, number> = {};

    clients.forEach((client) => {
      if (client.categories) {
        client.categories.forEach((category) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      }
    });

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }));
  }, [clients]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تحليلات المعمل</h1>
          <p className="text-muted-foreground mt-2">
            إحصائيات شاملة حول التحاليل والنتائج
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحالات</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.clientsWithTests} حالة لديها تحاليل محددة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التحاليل المطلوبة</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTestsOrdered}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalResultsEntered} تم إدخال نتائجها
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة الإنجاز</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              من التحاليل المطلوبة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نتائج غير طبيعية</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abnormalRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.abnormalResults} من {stats.totalResultsEntered} نتيجة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">أكثر التحاليل طلباً</TabsTrigger>
          <TabsTrigger value="categories">التصنيفات</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التحاليل الأكثر طلباً</CardTitle>
              <CardDescription>أكثر 10 تحاليل تم طلبها في المعمل</CardDescription>
            </CardHeader>
            <CardContent>
              {mostCommonTests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد بيانات متاحة
                </p>
              ) : (
                <div className="space-y-3">
                  {mostCommonTests.map((test, index) => (
                    <div
                      key={test.testCode}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{test.testName}</p>
                          <p className="text-sm text-muted-foreground">{test.testCode}</p>
                        </div>
                      </div>
                      <Badge>{test.count} مرة</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توزيع التصنيفات</CardTitle>
              <CardDescription>عدد الحالات في كل تصنيف</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد بيانات متاحة
                </p>
              ) : (
                <div className="space-y-3">
                  {categoryStats.map((stat) => (
                    <div
                      key={stat.category}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <p className="font-medium">{stat.category}</p>
                      <Badge>{stat.count} حالة</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
