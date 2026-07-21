import apiClient from '../../../shared/services/apiClient';

export const guardianApi = {
  createGuardian: async (guardianData) => {
    const response = await apiClient.post('/v1/guardians', guardianData);
    return response.data;
  },

  getAllGuardians: async () => {
    const response = await apiClient.get('/v1/guardians');
    return response.data;
  },

  getGuardianById: async (id) => {
    const response = await apiClient.get(`/v1/guardians/${id}`);
    return response.data;
  },

  updateGuardian: async (id, guardianData) => {
    const response = await apiClient.put(`/v1/guardians/${id}`, guardianData);
    return response.data;
  },

  deleteGuardian: async (id) => {
    const response = await apiClient.delete(`/v1/guardians/${id}`);
    return response.data;
  },

  linkStudent: async (guardianId, studentId) => {
    const response = await apiClient.post(`/v1/guardians/${guardianId}/students`, { studentId });
    return response.data;
  },
};

export default guardianApi;
