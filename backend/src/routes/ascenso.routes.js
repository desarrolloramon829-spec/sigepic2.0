const express = require('express');
const router = express.Router({ mergeParams: true });
const ascensoController = require('../controllers/ascensoController');
const {
  verificarToken,
  verificarPermiso,
} = require('../middlewares/authMiddleware');
const { validarDatos } = require('../middlewares/validator');
const {
  schemaAscenso,
  schemaAscensoActualizar,
} = require('../utils/validators');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/personal/:personalId/ascensos - Listar ascensos de un personal
router.get(
  '/',
  verificarPermiso('ascenso', 'read'),
  ascensoController.listar
);

// GET /api/personal/:personalId/ascensos/:id - Obtener por ID
router.get(
  '/:id',
  verificarPermiso('ascenso', 'read'),
  ascensoController.obtenerPorId
);

// POST /api/personal/:personalId/ascensos - Crear ascenso
router.post(
  '/',
  verificarPermiso('ascenso', 'create'),
  validarDatos(schemaAscenso),
  ascensoController.crear
);

// PUT /api/personal/:personalId/ascensos/:id - Actualizar ascenso
router.put(
  '/:id',
  verificarPermiso('ascenso', 'update'),
  validarDatos(schemaAscensoActualizar),
  ascensoController.actualizar
);

// DELETE /api/personal/:personalId/ascensos/:id - Eliminar ascenso
router.delete(
  '/:id',
  verificarPermiso('ascenso', 'delete'),
  ascensoController.eliminar
);

module.exports = router;
