import apiClient from '../../../shared/services/apiClient';

export const roomApi = {
  createRoom: async (roomData) => {
    const response = await apiClient.post('/v1/rooms', roomData);
    return response.data;
  },

  getAllRooms: async () => {
    const response = await apiClient.get('/v1/rooms');
    return response.data;
  },

  getRoomById: async (id) => {
    const response = await apiClient.get(`/v1/rooms/${id}`);
    return response.data;
  },

  updateRoom: async (id, roomData) => {
    const response = await apiClient.put(`/v1/rooms/${id}`, roomData);
    return response.data;
  },

  deleteRoom: async (id) => {
    const response = await apiClient.delete(`/v1/rooms/${id}`);
    return response.data;
  },
};

export default roomApi;
