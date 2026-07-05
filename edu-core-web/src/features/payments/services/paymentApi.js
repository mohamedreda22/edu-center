import apiClient from '../../../shared/services/apiClient';

export const paymentApi = {
  createPayment: async (paymentData) => {
    const response = await apiClient.post('/v1/payments', paymentData);
    return response.data;
  },

  getAllPayments: async (params) => {
    const response = await apiClient.get('/v1/payments', { params });
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await apiClient.get(`/v1/payments/${id}`);
    return response.data;
  },

  updatePayment: async (id, paymentData) => {
    const response = await apiClient.patch(`/v1/payments/${id}`, paymentData);
    return response.data;
  },

  deletePayment: async (id) => {
    const response = await apiClient.delete(`/v1/payments/${id}`);
    return response.data;
  },
};
