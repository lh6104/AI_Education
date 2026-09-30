import axios from "axios";
import { API_URL } from "./config";

const API = axios.create({
  baseURL: `${API_URL}/api/v1/flashcards`,
  timeout: 10000,
  withCredentials: true,
});

// 🧩 Lấy tất cả nhóm theo user
export const getFlashcardGroupsByUser = async (userId) => {
  const { data } = await API.get(`/groups/${userId}`);
  return data;
};

// 🧩 Lấy tất cả flashcard trong 1 nhóm
export const getFlashcardsByGroup = async (groupId) => {
  const { data } = await API.get(`/${groupId}`); // ✅ endpoint đúng
  return data;
};

// 🧩 Xóa 1 flashcard
export const deleteFlashcard = async (id) => {
  await API.delete(`/${id}`);
};

// 🧩 Xóa cả nhóm flashcard
export const deleteFlashcardGroup = async (groupId) => {
  await API.delete(`/groups/${groupId}`);
};

// 🧩 Tạo nhóm flashcard mới
export const createFlashcardGroup = async (payload) => {
  const { data } = await API.post("/groups", payload);
  return data;
};

// 🧩 Cập nhật nhóm flashcard (⚙️ thêm mới hàm này)
export const updateFlashcardGroup = async (groupId, payload) => {
  const { data } = await API.put(`/groups/${groupId}`, payload);
  return data;
};

// 🧩 Tạo flashcard mới trong nhóm
export const createFlashcard = async (groupId, payload) => {
  const { data } = await API.post("/", { ...payload, group_id: groupId });
  return data;
};

// 🧩 Cập nhật 1 flashcard
export const updateFlashcard = async (id, payload) => {
  const { data } = await API.put(`/${id}`, payload);
  return data;
};
