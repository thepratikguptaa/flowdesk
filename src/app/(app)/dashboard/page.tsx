import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, PlusCircle, Building2 } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard · FlowDesk" };

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your case activity at a glance. Full dashboard widgets land in Phase 4."
        action={
          <Button render={<Link href="/cases/new" />}>
            <PlusCircle className="h-4 w-4" />
            New case
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My cases
            </CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/cases" />} variant="link" className="h-auto p-0">
              View all cases →
            </Button>
          </CardContent>
        </Card>

        {user.role === "ADMIN" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Departments
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/departments" />} variant="link" className="h-auto p-0">
                Manage departments →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
