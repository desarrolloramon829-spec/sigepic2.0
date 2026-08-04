const express = require('express');
const router = express.Router({ mergeParams: true });
const notaMedicaController = require('../controllers/notaMedicaController');
const {
  verificarToken,
  verificarPermiso,
} = require('../middlewares/authMiddleware');
const { validarDatos } = require('../middlewares/validator');
const {
  schemaNotaMedica,
  schemaNotaMedicaActualizar,
} = require('../utils/validators');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/personal/:personalId/notas-medicas - Listar notas médicas de un personal
router.get(
  '/',
  verificarPermiso('notaMedica', 'read'),
  notaMedicaController.listar
);

// GET /api/personal/:personalId/notas-medicas/:id - Obtener por ID
router.get(
  '/:id',
  verificarPermiso('notaMedica', 'read'),
  notaMedicaController.obtenerPorId
);

// POST /api/personal/:personalId/notas-medicas - Crear nota médica
router.post(
  '/',
  verificarPermiso('notaMedica', 'create'),
  validarDatos(schemaNotaMedica),
  notaMedicaController.crear
);

// PUT /api/personal/:personalId/notas-medicas/:id - Actualizar nota médica
router.put(
  '/:id',
  verificarPermiso('notaMedica', 'update'),
  validarDatos(schemaNotaMedicaActualizar),
  notaMedicaController.actualizar
);

// DELETE /api/personal/:personalId/notas-medicas/:id - Eliminar nota médica
router.delete(
  '/:id',
  verificarPermiso('notaMedica', 'delete'),
  notaMedicaController.eliminar
);

module.exports = router;
