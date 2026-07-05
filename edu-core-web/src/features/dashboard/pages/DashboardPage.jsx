import { useQuery } from '@tanstack/react-query';
import { Users, DollarSign, Calendar, GraduationCap } from 'lucide-react';
import React from 'react';

import { dashboardApi } from '../services/dashboardApi';

import { useAuth } from '@/features/auth/AuthContext';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import PageHeader from '@/shared/components/PageHeader/PageHeader';
import StatCard from '@/shared/components/StatCard/StatCard';
import { Skeleton } from '@/shared/components/ui/skeleton';

const DashboardPage = () => {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: dashboardApi.getOverview,
  });

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  const stats = data?.data || {};

  return (
    <div className="space-y-8">
      <PageHeader
        title="لوحة التحكم"
        description={`أهلاً بك مجدداً، ${user?.firstName} ${user?.lastName}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : (
          <>
            {stats.totalStudents !== undefined && (
              <StatCard
                label="إجمالي الطلاب"
                value={stats.totalStudents}
                icon={Users}
              />
            )}
            {stats.totalTeachers !== undefined && (
              <StatCard
                label="إجمالي المعلمين"
                value={stats.totalTeachers}
                icon={GraduationCap}
              />
            )}
            {stats.activeLessons !== undefined && (
              <StatCard
                label="الحصص النشطة"
                value={stats.activeLessons}
                icon={Calendar}
              />
            )}
            {stats.monthlyRevenue !== undefined && (
              <StatCard
                label="الإيرادات الشهرية"
                value={`KD ${stats.monthlyRevenue}`}
                icon={DollarSign}
                trend={stats.revenueTrend}
                trendValue={stats.revenueTrendValue}
              />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2">
          <Calendar className="h-8 w-8 text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">
            الجدول الزمني القادم
          </h3>
          <p className="text-sm text-muted-foreground/60 italic">
            سيتم تفعيل عرض المواعيد القادمة فور اكتمال وحدة الجدولة (Milestone
            7)
          </p>
        </div>
        <div className="p-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-2">
          <Users className="h-8 w-8 text-muted-foreground/50" />
          <h3 className="font-medium text-muted-foreground">أحدث النشاطات</h3>
          <p className="text-sm text-muted-foreground/60 italic">
            سيتم عرض سجل النشاطات هنا فور اكتمال وحدة سجل النظام (Milestone 13)
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
