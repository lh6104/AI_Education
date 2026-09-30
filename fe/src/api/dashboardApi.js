import api from "./axiosClient";

/**
 * GET /api/v1/lessons/dashboard_lessons
 * @returns {Promise<Array<{id:number,title:string,content:string,video_url?:string,created_at:string,updated_at:string,progress?:{progress_percent:number,score:number,avg_score:number,streak_days:number,last_accessed:string}}>>}
 */
export const getDashboardLessons = async () => {
  const res = await api.get("/api/v1/lessons/dashboard_lessons");
  return res.data;
};

/**
 * GET /api/v1/ranking?week=NN
 * New API Response shape:
 *   {
 *     week: number,
 *     top: Array<{ id?: number|string, name?: string, full_name?: string, username?: string, total_score?: number }>,
 *     user: { position?: number, rank?: number, name?: string, full_name?: string, username?: string, total_score?: number }
 *   }
 * Backward compatibility: some environments may still return a number (user's position).
 * @param {number|string} week - ISO week number
 * @returns {Promise<any>} Response data as-is
 */
export const getWeeklyRanking = async (week) => {
  const res = await api.get("/api/v1/ranking", { params: { week } });
  return res.data;
};

/**
 * GET /api/v1/lessons/completed_lessons
 * Response: number
 * @returns {Promise<number>}
 */
export const getCompletedLessonsCount = async () => {
  const res = await api.get("/api/v1/lessons/completed_lessons");
  return res.data;
};

/**
 * GET /api/v1/users/me/daily_streaks
 * Response: number
 * @returns {Promise<number>}
 */
export const getDailyStreak = async () => {
  const res = await api.get("/api/v1/users/me/daily_streaks");
  return res.data;
};

/**
 * GET /api/v1/progress/user/total_score
 * Response: number
 * @returns {Promise<number>}
 */
export const getTotalScore = async () => {
  const res = await api.get("/api/v1/progress/user/total_score");
  return res.data;
};
