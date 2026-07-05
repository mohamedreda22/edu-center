import apiClient from '../../../shared/services/apiClient';

export const salaryApi = {
  createSalary: async (salaryData) => {
    const response = await apiClient.post('/v1/salaries', salaryData);
    return response.data;
  },

  getAllSalaries: async (params) => {
    const response = await apiClient.get('/v1/salaries', { params });
    return response.data;
  },

  getSalaryById: async (id) => {
    const response = await apiClient.get(`/v1/salaries/${id}`);
    return response.data;
  },

  updateSalary: async (id, salaryData) => {
    const response = await apiClient.patch(`/v1/salaries/${id}`, salaryData);
    return response.data;
  },

  deleteSalary: async (id) => {
    const response = await apiClient.delete(`/v1/salaries/${id}`);
    return response.data;
  },
};
