import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/** Unwraps the backend { data, meta } envelope. */
function unwrap<T = any>(res: { data: any }): T {
  return (res.data?.data ?? res.data) as T;
}
export interface Page<T> { data: T[]; meta: { total: number; page: number; limit: number; pageCount: number } }
function page<T>(res: { data: any }): Page<T> {
  const d = res.data?.data ?? res.data;
  return { data: d?.data ?? [], meta: d?.meta ?? { total: 0, page: 1, limit: 20, pageCount: 1 } };
}
export function apiError(err: any): string {
  const m = err?.response?.data?.message;
  return Array.isArray(m) ? m.join(", ") : m || err?.message || "Something went wrong";
}

export const authService = {
  login: async (data: { email: string; password: string }) => unwrap(await api.post("/auth/login", data)),
  register: async (data: any) => unwrap(await api.post("/auth/register", data)),
        getProfile: async () => unwrap(await api.get("/auth/me")),
};

export const analyticsApi = {
  dashboard: async () => unwrap<any>(await api.get("/analytics")),
};

export const orgApi = {
  me: async () => unwrap<any>(await api.get("/organizations/me")),
  update: async (data: { name: string }) => unwrap(await api.patch("/organizations/me", data)),
};

export const facilitiesApi = {
  buildings: async () => unwrap<any[]>(await api.get("/facilities/buildings?limit=100")),
  building: async (id: string) => unwrap<any>(await api.get(`/facilities/buildings/${id}`)),
  createBuilding: async (data: any) => unwrap(await api.post("/facilities/buildings", data)),
  updateBuilding: async (id: string, data: any) => unwrap(await api.patch(`/facilities/buildings/${id}`, data)),
  archiveBuilding: async (id: string) => unwrap(await api.post(`/facilities/buildings/${id}/archive`)),
  floors: async (buildingId: string) => unwrap<any[]>(await api.get(`/facilities/buildings/${buildingId}/floors`)),
  createFloor: async (buildingId: string, name: string) => unwrap(await api.post(`/facilities/buildings/${buildingId}/floors`, { name })),
  areas: async (floorId: string) => unwrap<any[]>(await api.get(`/facilities/floors/${floorId}/areas`)),
  createArea: async (floorId: string, data: { name: string; category?: string }) => unwrap(await api.post(`/facilities/floors/${floorId}/areas`, data)),
  areaCategories: async () => unwrap<string[]>(await api.get("/facilities/area-categories")),
};

export const providersApi = {
  list: async (params: { page?: number; limit?: number; categoryId?: string; city?: string } = {}) =>
    page<any>(await api.get("/providers", { params: { limit: params.limit ?? 24, ...params } })),
  public: async (id: string) => unwrap<any>(await api.get(`/provider-public/${id}`)),
};

export const serviceRequestsApi = {
  list: async (params: { page?: number; limit?: number } = {}) => page<any>(await api.get("/service-requests", { params: { limit: 50, ...params } })),
  get: async (id: string) => unwrap<any>(await api.get(`/service-requests/${id}`)),
  create: async (data: any) => unwrap<any>(await api.post("/service-requests", data)),
  update: async (id: string, data: any) => unwrap(await api.patch(`/service-requests/${id}`, data)),
  submit: async (id: string) => unwrap(await api.post(`/service-requests/${id}/submit`)),
  archive: async (id: string) => unwrap(await api.post(`/service-requests/${id}/archive`)),
  matches: async (id: string) => unwrap<any>(await api.get(`/service-requests/${id}/matches`)),
};

export const quotationsApi = {
  list: async (params: { page?: number; limit?: number } = {}) => page<any>(await api.get("/quotations", { params: { limit: 50, ...params } })),
  forRequest: async (requestId: string) => unwrap<any[]>(await api.get(`/quotations/request/${requestId}`)),
  get: async (id: string) => unwrap<any>(await api.get(`/quotations/${id}`)),
  create: async (data: any) => unwrap<any>(await api.post("/quotations", data)),
  submit: async (id: string) => unwrap(await api.post(`/quotations/${id}/submit`)),
  withdraw: async (id: string) => unwrap(await api.post(`/quotations/${id}/withdraw`)),
  accept: async (id: string) => unwrap<any>(await api.post(`/quotations/${id}/accept`)),
};

export const jobsApi = {
  list: async (params: { page?: number; limit?: number } = {}) => page<any>(await api.get("/jobs", { params: { limit: 50, ...params } })),
  get: async (id: string) => unwrap<any>(await api.get(`/jobs/${id}`)),
  create: async (data: any) => unwrap<any>(await api.post("/jobs", data)),
  update: async (id: string, data: any) => unwrap(await api.patch(`/jobs/${id}`, data)),
  start: async (id: string) => unwrap(await api.post(`/jobs/${id}/start`)),
  complete: async (id: string) => unwrap(await api.post(`/jobs/${id}/complete`)),
  assignWorker: async (id: string, workerId: string) => unwrap(await api.post(`/jobs/${id}/assign-worker`, { workerId })),
  workers: async (id: string) => unwrap<any[]>(await api.get(`/jobs/${id}/workers`)),
};

export const proofApi = {
  add: async (jobId: string, data: any, beforePhotoIds: string[] = [], afterPhotoIds: string[] = []) =>
    unwrap<any>(await api.post(`/jobs/${jobId}/proof`, { ...data, beforePhotoIds, afterPhotoIds })),
  get: async (jobId: string) => unwrap<any>(await api.get(`/jobs/${jobId}/proof`)),
};

export const approvalsApi = {
  listForJob: async (jobId: string) => unwrap<any[]>(await api.get(`/jobs/${jobId}/approvals`)),
  approve: async (jobId: string, notes?: string) => unwrap(await api.post(`/jobs/${jobId}/approve`, { type: "approve", notes: notes ?? "" })),
  rework: async (jobId: string, reason?: string) => unwrap(await api.post(`/jobs/${jobId}/rework`, { type: "rework", notes: reason ?? "" })),
};

export const invoicesApi = {
  list: async (params: { page?: number; limit?: number } = {}) => page<any>(await api.get("/invoices", { params: { limit: 50, ...params } })),
  get: async (id: string) => unwrap<any>(await api.get(`/invoices/${id}`)),
  addPayment: async (id: string, data: { amount: number; paymentReference: string; paymentMethod: string }) =>
    unwrap(await api.post(`/invoices/${id}/payments`, data)),
};

export const reviewsApi = {
  byProvider: async (providerId: string) => unwrap<any[]>(await api.get(`/reviews/provider/${providerId}`)),
  create: async (data: { jobId: string; providerId: string; [k: string]: any }) => unwrap(await api.post("/reviews", data)),
};

export const notificationsApi = {
  list: async () => unwrap<any>(await api.get("/notifications")),
  markRead: async (id: string) => unwrap(await api.post(`/notifications/${id}/read`)),
  markAllRead: async () => unwrap(await api.post("/notifications/read-all")),
};

export const filesApi = {
  upload: async (file: File, kind: string) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/files/upload/${kind}`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return unwrap<{ id: string; originalName: string }>(res);
  },
  url: (id: string) => `${API_URL}/files/${id}/download`,
};

export const contractsApi = {
  list: async (params: { page?: number; limit?: number } = {}) => page<any>(await api.get("/contracts", { params: { limit: 50, ...params } })),
  get: async (id: string) => unwrap<any>(await api.get(`/contracts/${id}`)),
  create: async (data: any) => unwrap<any>(await api.post("/contracts", data)),
  update: async (id: string, data: any) => unwrap(await api.patch(`/contracts/${id}`, data)),
};