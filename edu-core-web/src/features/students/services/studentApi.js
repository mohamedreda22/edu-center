import apiClient from '../../../shared/services/apiClient';

export const studentApi = {
  createStudent: async (studentData) => {
    const response = await apiClient.post('/v1/students', studentData);
    return response.data;
  },

  getAllStudents: async (params) => {
    const response = await apiClient.get('/v1/students', { params });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await apiClient.get(`/v1/students/${id}`);
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await apiClient.patch(`/v1/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await apiClient.delete(`/v1/students/${id}`);
    return response.data;
  },

  getRegistrations: async (studentId) => {
    const response = await apiClient.get(
      `/v1/students/${studentId}/registrations`
    );
    return response.data;
  },

  getHourLedger: async (studentId) => {
    const response = await apiClient.get(
      `/v1/students/${studentId}/hour-ledger`
    );
    return response.data;
  },

  createRegistration: async (studentId, regData) => {
    const response = await apiClient.post(
      `/v1/students/${studentId}/registrations`,
      regData
    );
    return response.data;
  },

  deleteRegistration: async (studentId, regId) => {
    const response = await apiClient.delete(
      `/v1/students/${studentId}/registrations/${regId}`
    );
    return response.data;
  },

  getTeacherStudents: async () => {
    const response = await apiClient.get('/v1/students/my-students');
    return response.data;
  },

  getStudentDashboard: async () => {
    const response = await apiClient.get(
      '/v1/students/portal/student-dashboard'
    );
    return response.data;
  },

  getParentDashboard: async () => {
    const response = await apiClient.get(
      '/v1/students/portal/parent-dashboard'
    );
    return response.data;
  },
};
