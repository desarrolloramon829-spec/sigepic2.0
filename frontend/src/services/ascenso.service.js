import api from './api';

export const ascensoService = {
  listar: async (personalId, params) => {
    return await api.get(`/personal/${personalId}/ascensos`, { params });
  },

  obtenerPorId: async (personalId, id) => {
    return await api.get(`/personal/${personalId}/ascensos/${id}`);
  },

  crear: async (personalId, datos) => {
    return await api.post(`/personal/${personalId}/ascensos`, datos);
  },

  actualizar: async (personalId, id, datos) => {
    return await api.put(`/personal/${personalId}/ascensos/${id}`, datos);
  },

  eliminar: async (personalId, id) => {
    return await api.delete(`/personal/${personalId}/ascensos/${id}`);
  },
};
