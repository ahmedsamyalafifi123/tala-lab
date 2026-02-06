"use client";

import { useState, useMemo } from "react";
import { useLabTests } from "@/hooks/use-lab-tests";
import { useClientResults } from "@/hooks/use-client-results";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ClientTrendChartProps {
  clientUuid: string;
  clientGender?: "male" | "female";
  clientAge?: number;
}

export function ClientTrendChart({ clientUuid, clientGender, clientAge }: ClientTrendChartProps) {
  const { tests } = useLabTests();
  const { results, selectedTests, loading } = useClientResults(clientUuid);
  const [selectedTestCode, setSelectedTestCode] = useState<string>("");

  // Get available tests that have results
  const availableTests = useMemo(() => {
    const testCodes = new Set<string>();
    results.entries.forEach((entry) => {
      Object.keys(entry.tests).forEach((code) => testCodes.add(code));
    });

    return tests
      .filter((test) => testCodes.has(test.test_code))
      .sort((a, b) => a.display_order - b.display_order);
  }, [tests, results]);

  // Auto-select first test if none selected
  useMemo(() => {
    if (!selectedTestCode && availableTests.length > 0) {
      setSelectedTestCode(availableTests[0].test_code);
    }
  }, [availableTests, selectedTestCode]);

  const selectedTest = tests.find((t) => t.test_code === selectedTestCode);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedTestCode) return [];

    return results.entries
      .filter((entry) => entry.tests[selectedTestCode])
      .map((entry) => ({
        date: format(new Date(entry.recorded_at), "dd/MM", { locale: ar }),
        fullDate: format(new Date(entry.recorded_at), "PPp", { locale: ar }),
        value: parseFloat(entry.tests[selectedTestCode].value.toString()),
        flag: entry.tests[selectedTestCode].flag,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  }, [selectedTestCode, results]);

  // Get reference range for selected test
  const referenceRange = useMemo(() => {
    if (!selectedTest) return null;

    let range = selectedTest.reference_ranges.default;

    // Try age-specific
    if (clientAge !== undefined && selectedTest.reference_ranges.age_ranges) {
      const ageRange = selectedTest.reference_ranges.age_ranges.find(
        (r) => clientAge >= r.min_age && clientAge <= r.max_age
      );
      if (ageRange) {
        range = { min: ageRange.min, max: ageRange.max };
      }
    }

    // Try gender-specific
    if (!range && clientGender && selectedTest.reference_ranges[clientGender]) {
      range = selectedTest.reference_ranges[clientGender];
    }

    return range;
  }, [selectedTest, clientGender, clientAge]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (availableTests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            لا توجد نتائج لعرض الرسم البياني
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>الرسم البياني للتحاليل</CardTitle>
            <CardDescription>تتبع تطور نتائج التحاليل عبر الزمن</CardDescription>
          </div>
          <div className="w-64">
            <Label htmlFor="test-select" className="text-sm mb-2 block">
              اختر التحليل
            </Label>
            <Select value={selectedTestCode} onValueChange={setSelectedTestCode}>
              <SelectTrigger id="test-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTests.map((test) => (
                  <SelectItem key={test.test_code} value={test.test_code}>
                    {test.test_name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد نتائج لهذا التحليل
          </div>
        ) : (
          <div className="space-y-4">
            {selectedTest && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>الوحدة: {selectedTest.unit || "-"}</span>
                {referenceRange && (
                  <span>
                    القيم الطبيعية: {referenceRange.min} - {referenceRange.max}
                  </span>
                )}
              </div>
            )}

            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  style={{ fontSize: "12px" }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-1">{data.fullDate}</p>
                          <p className="text-sm">
                            القيمة: <span className="font-bold">{data.value}</span>{" "}
                            {selectedTest?.unit}
                          </p>
                          {data.flag && (
                            <p className="text-xs mt-1">
                              الحالة:{" "}
                              <span
                                className={
                                  data.flag === "normal"
                                    ? "text-green-600"
                                    : data.flag === "high" || data.flag === "low"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }
                              >
                                {data.flag === "normal"
                                  ? "طبيعي"
                                  : data.flag === "high"
                                  ? "مرتفع"
                                  : data.flag === "low"
                                  ? "منخفض"
                                  : data.flag === "critical_high"
                                  ? "مرتفع جداً"
                                  : "منخفض جداً"}
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />

                {/* Reference range lines */}
                {referenceRange && (
                  <>
                    <ReferenceLine
                      y={referenceRange.min}
                      stroke="#22c55e"
                      strokeDasharray="3 3"
                      label={{ value: "الحد الأدنى", position: "left", fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={referenceRange.max}
                      stroke="#22c55e"
                      strokeDasharray="3 3"
                      label={{ value: "الحد الأقصى", position: "left", fontSize: 10 }}
                    />
                  </>
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 5 }}
                  activeDot={{ r: 7 }}
                  name={selectedTest?.test_name_ar || "القيمة"}
                />
              </LineChart>
            </ResponsiveContainer>

            {chartData.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">آخر قراءة</p>
                  <p className="text-lg font-bold">
                    {chartData[chartData.length - 1].value} {selectedTest?.unit}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">أعلى قراءة</p>
                  <p className="text-lg font-bold">
                    {Math.max(...chartData.map((d) => d.value))} {selectedTest?.unit}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">أقل قراءة</p>
                  <p className="text-lg font-bold">
                    {Math.min(...chartData.map((d) => d.value))} {selectedTest?.unit}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
