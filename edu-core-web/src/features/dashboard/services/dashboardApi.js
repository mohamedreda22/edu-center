import apiClient from '../../../shared/services/apiClient';

export const dashboardApi = {
  getOverview: async () => {
    const response = await apiClient.get('/v1/reports/overview');
    return response.data;
  },
};
