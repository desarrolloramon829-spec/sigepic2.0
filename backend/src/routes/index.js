const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const personalRoutes = require('./personal.routes');
const jerarquiaRoutes = require('./jerarquia.routes');
const seccionRoutes = require('./seccion.routes');
const auditoriaRoutes = require('./auditoria.routes');
const usuarioRoutes = require('./usuario.routes');
const licenciaRoutes = require('./licencia.routes');
const notaMedicaRoutes = require('./notaMedica.routes');
const capacitacionRoutes = require('./capacitacion.routes');
const sancionRoutes = require('./sancion.routes');
const ascensoRoutes = require('./ascenso.routes');

// Rutas públicas
router.use('/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
router.use('/personal/:personalId/licencias', licenciaRoutes);
router.use('/personal/:personalId/notas-medicas', notaMedicaRoutes);
router.use('/personal/:personalId/capacitaciones', capacitacionRoutes);
router.use('/personal/:personalId/sanciones', sancionRoutes);
router.use('/personal/:personalId/ascensos', ascensoRoutes);
router.use('/personal', personalRoutes);
router.use('/jerarquias', jerarquiaRoutes);
router.use('/secciones', seccionRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/usuarios', usuarioRoutes);

module.exports = router;
