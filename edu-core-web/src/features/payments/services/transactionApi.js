import apiClient from '../../../shared/services/apiClient';

export const transactionApi = {
  getTransactions: async (params) => {
    const response = await apiClient.get('/v1/ledger/transactions', { params });
    return response.data;
  },

  createTransaction: async (txnData) => {
    const response = await apiClient.post('/v1/ledger/transactions', txnData);
    return response.data;
  },
};
