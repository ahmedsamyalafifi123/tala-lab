"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestsManagement } from "@/components/manager/tests-management";
import { TestGroupsManagement } from "@/components/manager/test-groups-management";
import { CategoriesManagement } from "@/components/manager/categories-management";
import { FlaskConical, Layers, Tag } from "lucide-react";

export default function TestsManagementPage() {
  const [activeTab, setActiveTab] = useState("tests");

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-right">إدارة التحاليل والفحوصات</h1>
        <p className="text-muted-foreground mt-2 text-right text-sm sm:text-base">
          إدارة جميع التحاليل والمجموعات المتاحة لجميع المعامل
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir="rtl">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto" dir="rtl">
          <TabsTrigger value="tests" className="gap-1.5 sm:gap-2 justify-center sm:justify-start text-xs sm:text-sm py-2 px-1 sm:px-3 flex-col sm:flex-row">
            <FlaskConical className="h-4 w-4 shrink-0" />
            التحاليل الفردية
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5 sm:gap-2 justify-center sm:justify-start text-xs sm:text-sm py-2 px-1 sm:px-3 flex-col sm:flex-row">
            <Layers className="h-4 w-4 shrink-0" />
            مجموعات التحاليل
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5 sm:gap-2 justify-center sm:justify-start text-xs sm:text-sm py-2 px-1 sm:px-3 flex-col sm:flex-row">
            <Tag className="h-4 w-4 shrink-0" />
            الفئات
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
        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>فئات التحاليل</CardTitle>
              <CardDescription>
                إضافة وتعديل وحذف فئات التحاليل المتاحة لجميع المعامل
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriesManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
