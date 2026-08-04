const prisma = require('../config/database');
const logger = require('../utils/logger');

// Listar notas médicas de un personal
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

    // Verificar que el personal existe
    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(personalId) },
      select: { id: true, apellidos: true, nombres: true },
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    const where = { personalId: parseInt(personalId) };

    const [notasMedicas, total] = await Promise.all([
      prisma.notaMedica.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.notaMedica.count({ where }),
    ]);

    res.json({
      data: notasMedicas,
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

// Obtener nota médica por ID
const obtenerPorId = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;

    const notaMedica = await prisma.notaMedica.findFirst({
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

    if (!notaMedica) {
      return res.status(404).json({ error: 'Nota médica no encontrada' });
    }

    res.json(notaMedica);
  } catch (error) {
    next(error);
  }
};

// Crear nota médica
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

    const diasExtension = datos.diasExtension ? parseInt(datos.diasExtension) : 0;
    const fechaFin = new Date(datos.fechaFin);
    const fechaFinExtendida = diasExtension > 0
      ? new Date(fechaFin.getTime() + diasExtension * 24 * 60 * 60 * 1000)
      : null;

    const notaMedica = await prisma.notaMedica.create({
      data: {
        personalId: parseInt(personalId),
        fechaInicio: new Date(datos.fechaInicio),
        fechaFin,
        dias: parseInt(datos.dias),
        diasExtension,
        fechaFinExtendida,
        aptitud: datos.aptitud,
        diagnostico: datos.diagnostico || null,
        medico: datos.medico || null,
        documentoUrl: datos.documentoUrl || null,
        observaciones: datos.observaciones || null,
        estado: datos.estado || 'VIGENTE',
      },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'notas_medicas',
        registroId: notaMedica.id,
        accion: 'CREATE',
        cambios: datos,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(
      `Nota médica creada: ID ${notaMedica.id} para personal ${personalId}`
    );

    res.status(201).json(notaMedica);
  } catch (error) {
    next(error);
  }
};

// Actualizar nota médica
const actualizar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const datos = req.body;
    const usuarioId = req.user.id;

    const notaMedicaExistente = await prisma.notaMedica.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!notaMedicaExistente) {
      return res.status(404).json({ error: 'Nota médica no encontrada' });
    }

    const updateData = {};
    if (datos.fechaInicio) updateData.fechaInicio = new Date(datos.fechaInicio);
    if (datos.dias) updateData.dias = parseInt(datos.dias);
    if (datos.fechaFin) updateData.fechaFin = new Date(datos.fechaFin);
    if (datos.aptitud) updateData.aptitud = datos.aptitud;
    if (datos.diagnostico !== undefined)
      updateData.diagnostico = datos.diagnostico;
    if (datos.medico !== undefined) updateData.medico = datos.medico;
    if (datos.documentoUrl !== undefined)
      updateData.documentoUrl = datos.documentoUrl;
    if (datos.observaciones !== undefined)
      updateData.observaciones = datos.observaciones;
    if (datos.estado) updateData.estado = datos.estado;

    // Recalcular extensión si cambia días de extensión, fecha fin o se envía explícitamente
    if (datos.diasExtension !== undefined) {
      const diasExtension = parseInt(datos.diasExtension) || 0;
      const fechaFinBase = updateData.fechaFin || notaMedicaExistente.fechaFin;
      updateData.diasExtension = diasExtension;
      updateData.fechaFinExtendida =
        diasExtension > 0
          ? new Date(
              new Date(fechaFinBase).getTime() +
                diasExtension * 24 * 60 * 60 * 1000
            )
          : null;
    } else if (updateData.fechaFin && notaMedicaExistente.diasExtension > 0) {
      updateData.fechaFinExtendida = new Date(
        updateData.fechaFin.getTime() +
          notaMedicaExistente.diasExtension * 24 * 60 * 60 * 1000
      );
    }

    const notaMedica = await prisma.notaMedica.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'notas_medicas',
        registroId: notaMedica.id,
        accion: 'UPDATE',
        cambios: { anterior: notaMedicaExistente, nuevo: datos },
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Nota médica actualizada: ID ${notaMedica.id}`);

    res.json(notaMedica);
  } catch (error) {
    next(error);
  }
};

// Eliminar nota médica
const eliminar = async (req, res, next) => {
  try {
    const { personalId, id } = req.params;
    const usuarioId = req.user.id;

    const notaMedica = await prisma.notaMedica.findFirst({
      where: {
        id: parseInt(id),
        personalId: parseInt(personalId),
      },
    });

    if (!notaMedica) {
      return res.status(404).json({ error: 'Nota médica no encontrada' });
    }

    await prisma.notaMedica.delete({
      where: { id: parseInt(id) },
    });

    await prisma.auditoria.create({
      data: {
        tabla: 'notas_medicas',
        registroId: parseInt(id),
        accion: 'DELETE',
        cambios: notaMedica,
        usuarioId,
        personalId: parseInt(personalId),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info(`Nota médica eliminada: ID ${id}`);

    res.json({ message: 'Nota médica eliminada correctamente' });
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
