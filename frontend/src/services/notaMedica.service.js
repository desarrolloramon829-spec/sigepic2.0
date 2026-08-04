import api from './api';

export const notaMedicaService = {
  listar: async (personalId, params) => {
    return await api.get(`/personal/${personalId}/notas-medicas`, {
      params,
    });
  },

  obtenerPorId: async (personalId, id) => {
    return await api.get(`/personal/${personalId}/notas-medicas/${id}`);
  },

  crear: async (personalId, datos) => {
    return await api.post(`/personal/${personalId}/notas-medicas`, datos);
  },

  actualizar: async (personalId, id, datos) => {
    return await api.put(
      `/personal/${personalId}/notas-medicas/${id}`,
      datos
    );
  },

  eliminar: async (personalId, id) => {
    return await api.delete(`/personal/${personalId}/notas-medicas/${id}`);
  },
};
