import { CheckCircle2, Clock, FileText, PieChart, ShieldAlert, Timer, TrendingUp, Upload, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { ClaimsStatusChart } from "@/components/dashboard/ClaimsStatusChart";
import { ProcessingTrendChart } from "@/components/dashboard/ProcessingTrendChart";
import { RecentClaimsTable } from "@/components/dashboard/RecentClaimsTable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/useAsync";
import { claimsService } from "@/services/claimsService";
import { formatNumber, formatSeconds } from "@/utils/format";

export default function Dashboard() {
  const metrics = useAsync(() => claimsService.getDashboardMetrics());
  const claims = useAsync(() => claimsService.getClaims());
  const analytics = useAsync(() => claimsService.getAnalytics());

  return (
    <>
      <PageHeader
        title="Healthcare Claims Dashboard"
        description="AI-powered healthcare claims processing and decision intelligence."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/claims">
                <FileText aria-hidden="true" /> View All Claims
              </Link>
            </Button>
            <Button asChild>
              <Link to="/upload">
                <Upload aria-hidden="true" /> Upload Claim
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Key metrics" className="mb-5">
        {metrics.error ? (
          <Card>
            <ErrorState title="Unable to load metrics." error={metrics.error} onRetry={metrics.reload} />
          </Card>
        ) : !metrics.data ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" role="status" aria-label="Loading metrics">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[92px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Total Claims" value={formatNumber(metrics.data.totalClaims)} icon={FileText} accent="blue" to="/claims" />
            <MetricCard label="Pending" value={formatNumber(metrics.data.pending)} icon={Clock} accent="slate" to="/claims?status=PENDING" />
            <MetricCard label="Approved" value={formatNumber(metrics.data.approved)} icon={CheckCircle2} accent="green" to="/claims?status=APPROVED" />
            <MetricCard label="Denied" value={formatNumber(metrics.data.denied)} icon={XCircle} accent="red" to="/claims?status=DENIED" />
            <MetricCard
              label="Fraud Review"
              value={formatNumber(metrics.data.fraudReview)}
              icon={ShieldAlert}
              accent="orange"
              to="/claims?status=FRAUD_REVIEW"
            />
            <MetricCard
              label="Avg Processing Time"
              value={formatSeconds(metrics.data.averageProcessingTimeSeconds)}
              icon={Timer}
              accent="blue"
              helper="End-to-end, last 7 days"
            />
          </div>
        )}
      </section>

      <SectionCard
        title="Recent Claims"
        description="Latest submissions across all payers. Select a claim to see AI processing details."
        icon={FileText}
        className="mb-5"
        contentClassName="p-0"
        actions={
          <Button variant="link" size="sm" asChild className="h-auto p-0">
            <Link to="/claims">View all</Link>
          </Button>
        }
      >
        {claims.error ? (
          <ErrorState title="Unable to load claims." error={claims.error} onRetry={claims.reload} />
        ) : !claims.data ? (
          <LoadingState message="Loading claims..." rows={5} />
        ) : (
          <RecentClaimsTable claims={claims.data.slice(0, 8)} />
        )}
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-5">
        <SectionCard title="Claims by Status" description="All claims, current status" icon={PieChart} className="lg:col-span-2">
          {analytics.error ? (
            <ErrorState title="Unable to load chart." error={analytics.error} onRetry={analytics.reload} />
          ) : !analytics.data ? (
            <LoadingState message="Loading chart..." />
          ) : (
            <ClaimsStatusChart data={analytics.data.claimsByStatus} />
          )}
        </SectionCard>
        <SectionCard title="Claims Processing Trend" description="Last 7 days" icon={TrendingUp} className="lg:col-span-3">
          {analytics.error ? (
            <ErrorState title="Unable to load chart." error={analytics.error} onRetry={analytics.reload} />
          ) : !analytics.data ? (
            <LoadingState message="Loading chart..." />
          ) : (
            <ProcessingTrendChart data={analytics.data.processingTrend} height={220} />
          )}
        </SectionCard>
      </div>
    </>
  );
}
