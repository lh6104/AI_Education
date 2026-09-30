import { useQuery } from "@tanstack/react-query";
import {
  getDashboardLessons,
  getWeeklyRanking,
  getCompletedLessonsCount,
  getDailyStreak,
  getTotalScore,
} from "../api/dashboardApi";

// ISO week number helper
const getISOWeek = (date = new Date()) => {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
};

export const useDashboardLessons = () => {
  return useQuery({
    queryKey: ["dashboardLessons"],
    queryFn: getDashboardLessons,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useWeeklyRanking = () => {
  const week = getISOWeek();
  return useQuery({
    queryKey: ["weeklyRanking", week],
    queryFn: () => getWeeklyRanking(week),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCompletedLessonsCount = () => {
  return useQuery({
    queryKey: ["completedLessonsCount"],
    queryFn: getCompletedLessonsCount,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDailyStreak = () => {
  return useQuery({
    queryKey: ["dailyStreak"],
    queryFn: getDailyStreak,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTotalScore = () => {
  return useQuery({
    queryKey: ["totalScore"],
    queryFn: getTotalScore,
    staleTime: 5 * 60 * 1000,
  });
};
