const express = require('express');
const router = express.Router({ mergeParams: true });
const capacitacionController = require('../controllers/capacitacionController');
const {
  verificarToken,
  verificarPermiso,
} = require('../middlewares/authMiddleware');
const { validarDatos } = require('../middlewares/validator');
const {
  schemaCapacitacion,
  schemaCapacitacionActualizar,
} = require('../utils/validators');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/personal/:personalId/capacitaciones - Listar capacitaciones de un personal
router.get(
  '/',
  verificarPermiso('capacitacion', 'read'),
  capacitacionController.listar
);

// GET /api/personal/:personalId/capacitaciones/:id - Obtener por ID
router.get(
  '/:id',
  verificarPermiso('capacitacion', 'read'),
  capacitacionController.obtenerPorId
);

// POST /api/personal/:personalId/capacitaciones - Crear capacitación
router.post(
  '/',
  verificarPermiso('capacitacion', 'create'),
  validarDatos(schemaCapacitacion),
  capacitacionController.crear
);

// PUT /api/personal/:personalId/capacitaciones/:id - Actualizar capacitación
router.put(
  '/:id',
  verificarPermiso('capacitacion', 'update'),
  validarDatos(schemaCapacitacionActualizar),
  capacitacionController.actualizar
);

// DELETE /api/personal/:personalId/capacitaciones/:id - Eliminar capacitación
router.delete(
  '/:id',
  verificarPermiso('capacitacion', 'delete'),
  capacitacionController.eliminar
);

module.exports = router;
