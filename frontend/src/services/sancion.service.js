import api from './api';

export const sancionService = {
  listar: async (personalId, params) => {
    return await api.get(`/personal/${personalId}/sanciones`, { params });
  },

  obtenerPorId: async (personalId, id) => {
    return await api.get(`/personal/${personalId}/sanciones/${id}`);
  },

  crear: async (personalId, datos) => {
    return await api.post(`/personal/${personalId}/sanciones`, datos);
  },

  actualizar: async (personalId, id, datos) => {
    return await api.put(`/personal/${personalId}/sanciones/${id}`, datos);
  },

  eliminar: async (personalId, id) => {
    return await api.delete(`/personal/${personalId}/sanciones/${id}`);
  },
};
