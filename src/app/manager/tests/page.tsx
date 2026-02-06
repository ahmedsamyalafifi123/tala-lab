"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestsManagement } from "@/components/manager/tests-management";
import { TestGroupsManagement } from "@/components/manager/test-groups-management";
import { FlaskConical, Layers } from "lucide-react";

export default function TestsManagementPage() {
  const [activeTab, setActiveTab] = useState("tests");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">إدارة التحاليل والفحوصات</h1>
        <p className="text-muted-foreground mt-2">
          إدارة جميع التحاليل والمجموعات المتاحة لجميع المعامل
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tests" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            التحاليل الفردية
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Layers className="h-4 w-4" />
            مجموعات التحاليل
          </TabsTrigger>
        </TabsList>

        {/* Individual Tests Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>التحاليل الفردية</CardTitle>
              <CardDescription>
                إضافة وتعديل وحذف التحاليل المتاحة لجميع المعامل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestsManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مجموعات التحاليل</CardTitle>
              <CardDescription>
                إنشاء مجموعات تحاليل (مثل: صورة دم كاملة، فحص السكري) لتسهيل الاختيار
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TestGroupsManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
