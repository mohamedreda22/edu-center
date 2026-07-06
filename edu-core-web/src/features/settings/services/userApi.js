import apiClient from '@/shared/services/apiClient';

export const userApi = {
  updateUser: async (id, data) => {
    const response = await apiClient.patch(`/v1/users/${id}`, data);
    return response.data;
  },
  changePassword: async (id, data) => {
    const response = await apiClient.post(
      `/v1/users/${id}/change-password`,
      data
    );
    return response.data;
  },
  getUsers: async () => {
    const response = await apiClient.get('/v1/users');
    return response.data;
  },
};
