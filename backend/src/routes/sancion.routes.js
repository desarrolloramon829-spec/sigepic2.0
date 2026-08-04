const express = require('express');
const router = express.Router({ mergeParams: true });
const sancionController = require('../controllers/sancionController');
const {
  verificarToken,
  verificarPermiso,
} = require('../middlewares/authMiddleware');
const { validarDatos } = require('../middlewares/validator');
const {
  schemaSancion,
  schemaSancionActualizar,
} = require('../utils/validators');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/personal/:personalId/sanciones - Listar sanciones de un personal
router.get(
  '/',
  verificarPermiso('sancion', 'read'),
  sancionController.listar
);

// GET /api/personal/:personalId/sanciones/:id - Obtener por ID
router.get(
  '/:id',
  verificarPermiso('sancion', 'read'),
  sancionController.obtenerPorId
);

// POST /api/personal/:personalId/sanciones - Crear sanción
router.post(
  '/',
  verificarPermiso('sancion', 'create'),
  validarDatos(schemaSancion),
  sancionController.crear
);

// PUT /api/personal/:personalId/sanciones/:id - Actualizar sanción
router.put(
  '/:id',
  verificarPermiso('sancion', 'update'),
  validarDatos(schemaSancionActualizar),
  sancionController.actualizar
);

// DELETE /api/personal/:personalId/sanciones/:id - Eliminar sanción
router.delete(
  '/:id',
  verificarPermiso('sancion', 'delete'),
  sancionController.eliminar
);

module.exports = router;
