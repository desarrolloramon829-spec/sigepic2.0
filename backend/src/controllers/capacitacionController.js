const prisma = require('../config/database');
const logger = require('../utils/logger');

// Listar capacitaciones de un personal
const listar = async (req, res, next) => {
  try {
    const { personalId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'fechaInicio',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(personalId) },
      select: { id: true, apellidos: true, nombres: true },
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    const where = { personalId: parseInt(personalId) };

    const [capacitaciones, total] = await Promise.all([
      prisma.capacitacion.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.capacitacion.count({ where }),
    ]);

    res.json({
      data: capacitaciones,
      personal,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener capacitación por ID
const obtenerPorId = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;

    const capacitacion = await prisma.capacitacion.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
      include: {
        personal: {
          select: { id: true, apellidos: true, nombres: true },
        },
      },
    });

    if (!capacitacion) {
      return res.status(404).json({ error: 'Capacitación no encontrada' });
    }

    res.json(capacitacion);
  } catch (error) {
    next(error);
  }
};

// Crear capacitación
const crear = async (req, res, next) => {
  try {
    const { personalId } = req.params;
    const datos = req.body;
    const usuarioId = req.user.id;

    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(personalId) },
      select: { id: true },
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    const capacitacion = await prisma.capacitacion.create({
      data: {
        personalId: parseInt(personalId),
        tipo: datos.tipo,
        nombre: datos.nombre,
        institucion: datos.institucion,
        fechaInicio: new Date(datos.fechaInicio),
        fechaFin: datos.fechaFin ? new Date(datos.fechaFin) : null,
        duracionHoras: datos.duracionHoras
          ? parseInt(datos.duracionHoras)
          : null,
        certificadoUrl: datos.certificadoUrl || null,
        estado: datos.estado || 'COMPLETADO',
        calificacion: datos.calificacion ? parseFloat(datos.calificacion) : null,
        observaciones: datos.observaciones || null,
      },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'capacitaciones',
        registroId: capacitacion.id,
        accion: 'CREATE',
        cambios: datos,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(
      `Capacitación creada: ID ${capacitacion.id} para personal ${personalId}`
    );

    res.status(201).json(capacitacion);
  } catch (error) {
    next(error);
  }
};

// Actualizar capacitación
const actualizar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const datos = req.body;
    const usuarioId = req.user.id;

    const capacitacionExistente = await prisma.capacitacion.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!capacitacionExistente) {
      return res.status(404).json({ error: 'Capacitación no encontrada' });
    }

    const updateData = {};
    if (datos.tipo) updateData.tipo = datos.tipo;
    if (datos.nombre) updateData.nombre = datos.nombre;
    if (datos.institucion) updateData.institucion = datos.institucion;
    if (datos.fechaInicio)
      updateData.fechaInicio = new Date(datos.fechaInicio);
    if (datos.fechaFin !== undefined)
      updateData.fechaFin = datos.fechaFin ? new Date(datos.fechaFin) : null;
    if (datos.duracionHoras !== undefined)
      updateData.duracionHoras = datos.duracionHoras
        ? parseInt(datos.duracionHoras)
        : null;
    if (datos.certificadoUrl !== undefined)
      updateData.certificadoUrl = datos.certificadoUrl;
    if (datos.estado) updateData.estado = datos.estado;
    if (datos.calificacion !== undefined)
      updateData.calificacion = datos.calificacion
        ? parseFloat(datos.calificacion)
        : null;
    if (datos.observaciones !== undefined)
      updateData.observaciones = datos.observaciones;

    const capacitacion = await prisma.capacitacion.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'capacitaciones',
        registroId: capacitacion.id,
        accion: 'UPDATE',
        cambios: { anterior: capacitacionExistente, nuevo: datos },
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Capacitación actualizada: ID ${capacitacion.id}`);

    res.json(capacitacion);
  } catch (error) {
    next(error);
  }
};

// Eliminar capacitación
const eliminar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const usuarioId = req.user.id;

    const capacitacion = await prisma.capacitacion.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!capacitacion) {
      return res.status(404).json({ error: 'Capacitación no encontrada' });
    }

    await prisma.capacitacion.delete({
      where: { id: parseInt(id) },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'capacitaciones',
        registroId: parseInt(id),
        accion: 'DELETE',
        cambios: capacitacion,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Capacitación eliminada: ID ${id}`);

    res.json({ message: 'Capacitación eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
