import axiosClient from "./axiosClient";

const ROADMAP_BASE = "/api/v1/roadmaps";
const CHAPTERS_BASE = "/api/v1/chapters";
const LESSONS_BASE = "/api/v1/lessons";

export const LessonApi = {
  generateRoadmap: async (studentJson, roadmapName = null) => {
    const body = { student_json: studentJson, roadmap_name: roadmapName };
    const res = await axiosClient.post(`${ROADMAP_BASE}/generate`, body);
    return res.data;
  },

  listRoadmaps: async (skip = 0, limit = 100) => {
    const res = await axiosClient.get(`${ROADMAP_BASE}?skip=${skip}&limit=${limit}`);
    return res.data;
  },

  getRoadmap: async (id) => {
    const res = await axiosClient.get(`${ROADMAP_BASE}/${id}`);
    return res.data;
  },

  // chapters endpoints
  listChapters: async (courseId, skip = 0, limit = 100) => {
    const q = `course_id=${encodeURIComponent(courseId)}&skip=${skip}&limit=${limit}`;
    const res = await axiosClient.get(`${CHAPTERS_BASE}?${q}`);
    return res.data;
  },

  generateChapters: async (courseId) => {
    const res = await axiosClient.post(`${CHAPTERS_BASE}/generate`, { course_id: courseId });
    return res.data;
  },

  // generate or return existing lessons for a chapter
  generateLessonsForChapter: async (chapterId) => {
    const res = await axiosClient.post(`${LESSONS_BASE}/chapter/${chapterId}/generate`);
    return res.data;
  },

  // optional: list lessons by chapter
  listLessons: async (chapterId, skip = 0, limit = 100) => {
    const q = `chapter_id=${encodeURIComponent(chapterId)}&skip=${skip}&limit=${limit}`;
    const res = await axiosClient.get(`${LESSONS_BASE}?${q}`);
    return res.data;
  },

  // delete a roadmap
  deleteRoadmap: async (roadmapId) => {
    const res = await axiosClient.delete(`${ROADMAP_BASE}/${roadmapId}`);
    return res.data;
  },

  // New: generate or return existing lesson content (will update if empty)
  updateLessonContent: async (lessonId) => {
    const res = await axiosClient.post(`${LESSONS_BASE}/update_content/${lessonId}`);
    return res.data;
  },
};