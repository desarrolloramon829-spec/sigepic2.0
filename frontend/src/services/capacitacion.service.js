import api from './api';

export const capacitacionService = {
  listar: async (personalId, params) => {
    return await api.get(`/personal/${personalId}/capacitaciones`, {
      params,
    });
  },

  obtenerPorId: async (personalId, id) => {
    return await api.get(`/personal/${personalId}/capacitaciones/${id}`);
  },

  crear: async (personalId, datos) => {
    return await api.post(`/personal/${personalId}/capacitaciones`, datos);
  },

  actualizar: async (personalId, id, datos) => {
    return await api.put(
      `/personal/${personalId}/capacitaciones/${id}`,
      datos
    );
  },

  eliminar: async (personalId, id) => {
    return await api.delete(`/personal/${personalId}/capacitaciones/${id}`);
  },
};
