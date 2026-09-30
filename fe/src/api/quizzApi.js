import axiosClient from "./axiosClient";

const BASE = "/api/v1/quizzes";

export const QuizzApi = {
  // Get all quizzes
  list: async (skip = 0, limit = 100) => {
    const res = await axiosClient.get(BASE, { params: { skip, limit } });
    return res.data;
  },

  // Get quiz detail (without attempts)
  get: async (id) => {
    const res = await axiosClient.get(`${BASE}/${id}`);
    return res.data;
  },

  // Get quiz attempts/results
  getAttempts: async (id) => {
    const res = await axiosClient.get(`${BASE}/${id}/attempts`);
    return res.data;
  },

  // Delete quiz
  remove: async (id) => {
    const res = await axiosClient.delete(`${BASE}/${id}`);
    return res.data;
  },

  // Generate quiz with AI
  generateQuizWithAI: async (payload) => {
    const body = {
      lesson: payload.lesson,
      level: payload.level,
      numMCQ: payload.numMCQ,
      numEssay: payload.numEssay,
      lesson_id: payload.lesson_id || null,
      quiz_name: payload.quiz_name || null,
    };
    const res = await axiosClient.post(`${BASE}/generate`, body);
    return res.data;
  },

  // Submit attempt (backend will resolve user from auth token)
  submitAttempt: async (quizId, payload) => {
    const body = {
      answers: payload.answers,
      duration_seconds: payload.duration_seconds || null,
    };
    const res = await axiosClient.post(`${BASE}/${quizId}/attempts`, body);
    return res.data;
  },
};

// // Named export for direct import
// export const generateQuizWithAI = QuizzApi.generateQuizWithAI;