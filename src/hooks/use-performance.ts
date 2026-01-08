import { useCallback, useMemo, useState, useEffect } from 'react';

/**
 * Performance hooks for memoization and optimization
 */

/**
 * Memoized budget calculations
 */
export function useBudgetCalculations(budgets: any[], expenses: any[]) {
  return useMemo(() => {
    if (!budgets) return null;

    const totalBudget = budgets.reduce((sum, b) => sum + (b.total_budget || 0), 0);
    const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const remaining = totalBudget - totalExpenses;
    const percentageUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalExpenses,
      remaining,
      percentageUsed,
      budgetHealth: percentageUsed > 90 ? 'critical' : percentageUsed > 75 ? 'warning' : 'healthy',
    };
  }, [budgets, expenses]);
}

/**
 * Memoized labor cost calculations
 */
export function useLaborCostCalculations(
  hourlyRate: number,
  hoursWorked: number,
  overtime: number = 0
) {
  return useMemo(() => {
    const regularPay = hourlyRate * hoursWorked;
    const overtimePay = hourlyRate * 1.5 * overtime;
    const totalCost = regularPay + overtimePay;

    return {
      regularPay,
      overtimePay,
      totalCost,
      effectiveRate: hoursWorked > 0 ? totalCost / hoursWorked : hourlyRate,
    };
  }, [hourlyRate, hoursWorked, overtime]);
}

/**
 * Memoized OKR progress calculations
 */
export function useOKRProgress(keyResults: any[]) {
  return useMemo(() => {
    if (!keyResults || keyResults.length === 0) {
      return {
        overallProgress: 0,
        completedCount: 0,
        totalCount: 0,
        averageProgress: 0,
      };
    }

    const totalCount = keyResults.length;
    const completedCount = keyResults.filter((kr) => kr.current_value >= kr.target_value).length;
    const totalProgress = keyResults.reduce((sum, kr) => {
      const progress = kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    const averageProgress = totalProgress / totalCount;

    return {
      overallProgress: Math.round(averageProgress),
      completedCount,
      totalCount,
      averageProgress,
      isOnTrack: averageProgress >= 70,
      isAtRisk: averageProgress < 50,
    };
  }, [keyResults]);
}

/**
 * Memoized KPI calculations
 */
export function useKPICalculations(kpis: any[]) {
  return useMemo(() => {
    if (!kpis || kpis.length === 0) {
      return {
        totalKPIs: 0,
        onTrack: 0,
        atRisk: 0,
        behind: 0,
        averageProgress: 0,
      };
    }

    const totalKPIs = kpis.length;
    const onTrack = kpis.filter((k) => k.current_value >= k.target_value * 0.9).length;
    const atRisk = kpis.filter(
      (k) => k.current_value >= k.target_value * 0.7 && k.current_value < k.target_value * 0.9
    ).length;
    const behind = kpis.filter((k) => k.current_value < k.target_value * 0.7).length;

    const totalProgress = kpis.reduce((sum, k) => {
      const progress = k.target_value > 0 ? (k.current_value / k.target_value) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    const averageProgress = totalProgress / totalKPIs;

    return {
      totalKPIs,
      onTrack,
      atRisk,
      behind,
      averageProgress: Math.round(averageProgress),
      healthScore: (onTrack / totalKPIs) * 100,
    };
  }, [kpis]);
}

/**
 * Memoized team performance calculations
 */
export function useTeamPerformance(users: any[], tasks: any[], attendance: any[]) {
  return useMemo(() => {
    if (!users || users.length === 0) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        averageTaskCompletion: 0,
        averageAttendance: 0,
        topPerformers: [],
      };
    }

    const activeUsers = users.filter((u) => u.is_active).length;
    const totalUsers = users.length;

    const userPerformance = users.map((user) => {
      const userTasks = tasks?.filter((t) => t.assigned_to === user.id) || [];
      const completedTasks = userTasks.filter((t) => t.status === 'completed').length;
      const taskCompletion = userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0;

      const userAttendance = attendance?.filter((a) => a.user_id === user.id) || [];
      const presentDays = userAttendance.filter((a) => a.status === 'present').length;
      const attendanceRate = userAttendance.length > 0 ? (presentDays / userAttendance.length) * 100 : 0;

      return {
        user,
        taskCompletion,
        attendanceRate,
        score: (taskCompletion + attendanceRate) / 2,
      };
    });

    const averageTaskCompletion =
      userPerformance.reduce((sum, p) => sum + p.taskCompletion, 0) / userPerformance.length;
    const averageAttendance =
      userPerformance.reduce((sum, p) => sum + p.attendanceRate, 0) / userPerformance.length;

    const topPerformers = userPerformance
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((p) => ({
        name: p.user.name,
        score: Math.round(p.score),
        taskCompletion: Math.round(p.taskCompletion),
        attendance: Math.round(p.attendanceRate),
      }));

    return {
      totalUsers,
      activeUsers,
      averageTaskCompletion: Math.round(averageTaskCompletion),
      averageAttendance: Math.round(averageAttendance),
      topPerformers,
    };
  }, [users, tasks, attendance]);
}

/**
 * Debounced search hook
 */
export function useDebouncedSearch(searchTerm: string, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  return debouncedValue;
}
