import apiClient from '../../../shared/services/apiClient';

export const activityLogApi = {
  getLogs: async (params) => {
    const response = await apiClient.get('/v1/activity-log', { params });
    return response.data;
  },
};
