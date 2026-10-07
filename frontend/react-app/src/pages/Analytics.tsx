import { Building2, Clock, PieChart, ShieldAlert, TrendingUp } from "lucide-react";

import { DonutChart } from "@/components/charts/DonutChart";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { VerticalBarChart } from "@/components/charts/VerticalBarChart";
import { chartColors } from "@/components/charts/chartTheme";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { ClaimsStatusChart } from "@/components/dashboard/ClaimsStatusChart";
import { ProcessingTrendChart } from "@/components/dashboard/ProcessingTrendChart";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAsync } from "@/hooks/useAsync";
import { claimsService } from "@/services/claimsService";
import { formatCurrency, formatNumber } from "@/utils/format";
import { riskMeta } from "@/utils/status";

export default function Analytics() {
  const analytics = useAsync(() => claimsService.getAnalytics());

  return (
    <>
      <PageHeader title="Analytics" description="Claim volumes, outcomes, agent performance and fraud risk." />

      {analytics.error ? (
        <Card>
          <ErrorState title="Unable to load analytics." error={analytics.error} onRetry={analytics.reload} />
        </Card>
      ) : !analytics.data ? (
        <Card>
          <LoadingState message="Loading analytics..." rows={6} />
        </Card>
      ) : analytics.data.claimsByStatus.every((item) => item.count === 0) ? (
        <Card>
          <EmptyState title="No analytics data yet." description="Charts appear once claims have been processed." />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Claims by Status" description="All claims, current status" icon={PieChart}>
            <ClaimsStatusChart data={analytics.data.claimsByStatus} />
          </SectionCard>

          <SectionCard title="Fraud Risk Distribution" description="Processed claims by fraud risk level" icon={ShieldAlert}>
            <DonutChart
              label="Fraud risk distribution"
              centerLabel="Claims"
              data={analytics.data.fraudRiskDistribution.map((item) => ({
                name: riskMeta[item.risk].label,
                value: item.count,
                color: riskMeta[item.risk].color,
              }))}
            />
          </SectionCard>

          <SectionCard title="Claims Processing Trend" description="Daily volume and outcomes, last 7 days" icon={TrendingUp} className="lg:col-span-2">
            <ProcessingTrendChart data={analytics.data.processingTrend} height={280} />
          </SectionCard>

          <SectionCard title="Average Agent Processing Time" description="Seconds per claim, last 7 days" icon={Clock}>
            <HorizontalBarChart
              label="Average agent processing time in seconds"
              seriesName="Avg time"
              valueFormatter={(value) => `${value.toFixed(1)} sec`}
              data={analytics.data.agentProcessingTime.map((item) => ({
                name: item.agentName,
                value: item.averageSeconds,
                color: chartColors.blue,
              }))}
            />
          </SectionCard>

          <SectionCard title="Payer Distribution" description="Claims and billed amount by payer" icon={Building2}>
            <VerticalBarChart
              label="Claims by payer"
              seriesName="Claims"
              height={180}
              valueFormatter={formatNumber}
              data={analytics.data.payerDistribution.map((item, index) => ({
                name: item.payerName,
                value: item.claims,
                color: index === 0 ? chartColors.blue : chartColors.lightBlue,
              }))}
            />
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Payer</TableHead>
                  <TableHead className="text-right">Claims</TableHead>
                  <TableHead className="text-right">Billed Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.data.payerDistribution.map((item) => (
                  <TableRow key={item.payerName}>
                    <TableCell className="font-medium">{item.payerName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(item.claims)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
      )}
    </>
  );
}
