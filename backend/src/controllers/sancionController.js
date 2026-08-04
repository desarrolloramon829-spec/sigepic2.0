const prisma = require('../config/database');
const logger = require('../utils/logger');

// Listar sanciones de un personal
const listar = async (req, res, next) => {
  try {
    const { personalId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = 'fecha',
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

    const [sanciones, total] = await Promise.all([
      prisma.sancion.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.sancion.count({ where }),
    ]);

    res.json({
      data: sanciones,
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

// Obtener sanción por ID
const obtenerPorId = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;

    const sancion = await prisma.sancion.findFirst({
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

    if (!sancion) {
      return res.status(404).json({ error: 'Sanción no encontrada' });
    }

    res.json(sancion);
  } catch (error) {
    next(error);
  }
};

// Crear sanción
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

    const sancion = await prisma.sancion.create({
      data: {
        personalId: parseInt(personalId),
        tipo: datos.tipo,
        fecha: new Date(datos.fecha),
        motivo: datos.motivo,
        resolucion: datos.resolucion || null,
        diasSuspension: datos.diasSuspension
          ? parseInt(datos.diasSuspension)
          : null,
        documentoUrl: datos.documentoUrl || null,
        estado: datos.estado || 'ACTIVA',
        observaciones: datos.observaciones || null,
      },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'sanciones',
        registroId: sancion.id,
        accion: 'CREATE',
        cambios: datos,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(
      `Sanción creada: ID ${sancion.id} para personal ${personalId}`
    );

    res.status(201).json(sancion);
  } catch (error) {
    next(error);
  }
};

// Actualizar sanción
const actualizar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const datos = req.body;
    const usuarioId = req.user.id;

    const sancionExistente = await prisma.sancion.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!sancionExistente) {
      return res.status(404).json({ error: 'Sanción no encontrada' });
    }

    const updateData = {};
    if (datos.tipo) updateData.tipo = datos.tipo;
    if (datos.fecha) updateData.fecha = new Date(datos.fecha);
    if (datos.motivo) updateData.motivo = datos.motivo;
    if (datos.resolucion !== undefined)
      updateData.resolucion = datos.resolucion;
    if (datos.diasSuspension !== undefined)
      updateData.diasSuspension = datos.diasSuspension
        ? parseInt(datos.diasSuspension)
        : null;
    if (datos.documentoUrl !== undefined)
      updateData.documentoUrl = datos.documentoUrl;
    if (datos.estado) updateData.estado = datos.estado;
    if (datos.observaciones !== undefined)
      updateData.observaciones = datos.observaciones;

    const sancion = await prisma.sancion.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'sanciones',
        registroId: sancion.id,
        accion: 'UPDATE',
        cambios: { anterior: sancionExistente, nuevo: datos },
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Sanción actualizada: ID ${sancion.id}`);

    res.json(sancion);
  } catch (error) {
    next(error);
  }
};

// Eliminar sanción
const eliminar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const usuarioId = req.user.id;

    const sancion = await prisma.sancion.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!sancion) {
      return res.status(404).json({ error: 'Sanción no encontrada' });
    }

    await prisma.sancion.delete({
      where: { id: parseInt(id) },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'sanciones',
        registroId: parseInt(id),
        accion: 'DELETE',
        cambios: sancion,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Sanción eliminada: ID ${id}`);

    res.json({ message: 'Sanción eliminada correctamente' });
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
