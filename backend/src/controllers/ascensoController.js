const prisma = require('../config/database');
const logger = require('../utils/logger');

// Listar ascensos de un personal
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

    const [ascensos, total] = await Promise.all([
      prisma.ascenso.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.ascenso.count({ where }),
    ]);

    res.json({
      data: ascensos,
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

// Obtener ascenso por ID
const obtenerPorId = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;

    const ascenso = await prisma.ascenso.findFirst({
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

    if (!ascenso) {
      return res.status(404).json({ error: 'Ascenso no encontrado' });
    }

    res.json(ascenso);
  } catch (error) {
    next(error);
  }
};

// Crear ascenso
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

    const ascenso = await prisma.ascenso.create({
      data: {
        personalId: parseInt(personalId),
        fecha: new Date(datos.fecha),
        jerarquia: datos.jerarquia,
        resolucion: datos.resolucion || null,
        documentoUrl: datos.documentoUrl || null,
        observaciones: datos.observaciones || null,
        estado: datos.estado || 'VIGENTE',
      },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'ascensos',
        registroId: ascenso.id,
        accion: 'CREATE',
        cambios: datos,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(
      `Ascenso creado: ID ${ascenso.id} para personal ${personalId}`
    );

    res.status(201).json(ascenso);
  } catch (error) {
    next(error);
  }
};

// Actualizar ascenso
const actualizar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const datos = req.body;
    const usuarioId = req.user.id;

    const ascensoExistente = await prisma.ascenso.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!ascensoExistente) {
      return res.status(404).json({ error: 'Ascenso no encontrado' });
    }

    const updateData = {};
    if (datos.fecha) updateData.fecha = new Date(datos.fecha);
    if (datos.jerarquia) updateData.jerarquia = datos.jerarquia;
    if (datos.resolucion !== undefined)
      updateData.resolucion = datos.resolucion;
    if (datos.documentoUrl !== undefined)
      updateData.documentoUrl = datos.documentoUrl;
    if (datos.observaciones !== undefined)
      updateData.observaciones = datos.observaciones;
    if (datos.estado) updateData.estado = datos.estado;

    const ascenso = await prisma.ascenso.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'ascensos',
        registroId: ascenso.id,
        accion: 'UPDATE',
        cambios: { anterior: ascensoExistente, nuevo: datos },
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Ascenso actualizado: ID ${ascenso.id}`);

    res.json(ascenso);
  } catch (error) {
    next(error);
  }
};

// Eliminar ascenso
const eliminar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const usuarioId = req.user.id;

    const ascenso = await prisma.ascenso.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!ascenso) {
      return res.status(404).json({ error: 'Ascenso no encontrado' });
    }

    await prisma.ascenso.delete({
      where: { id: parseInt(id) },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'ascensos',
        registroId: parseInt(id),
        accion: 'DELETE',
        cambios: ascenso,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Ascenso eliminado: ID ${id}`);

    res.json({ message: 'Ascenso eliminado correctamente' });
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
