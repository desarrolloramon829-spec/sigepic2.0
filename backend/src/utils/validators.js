const Joi = require('joi');

// Schema para crear personal
const schemaPersonal = Joi.object({
  // Datos Personales
  apellidos: Joi.string().max(100).required().messages({
    'string.empty': 'Los apellidos son requeridos',
    'any.required': 'Los apellidos son requeridos',
  }),
  nombres: Joi.string().max(100).required().messages({
    'string.empty': 'Los nombres son requeridos',
    'any.required': 'Los nombres son requeridos',
  }),
  numeroAsignacion: Joi.string().max(50).required().messages({
    'string.empty': 'El número de asignación es requerido',
    'any.required': 'El número de asignación es requerido',
  }),
  dni: Joi.string().max(20).required().messages({
    'string.empty': 'El DNI es requerido',
    'any.required': 'El DNI es requerido',
  }),
  cuil: Joi.string().max(20).allow(null, ''),
  fechaNacimiento: Joi.date().required().messages({
    'date.base': 'Fecha de nacimiento inválida',
    'any.required': 'La fecha de nacimiento es requerida',
  }),
  estadoCivil: Joi.string().max(20).allow(null, ''),
  sexo: Joi.string().valid('MASCULINO', 'FEMENINO', 'OTRO').allow(null, ''),
  email: Joi.string().email().max(100).allow(null, ''),
  celular: Joi.string().max(50).allow(null, ''),
  domicilio: Joi.string().allow(null, ''),

  // Datos Jerárquicos
  tipoPersonal: Joi.string()
    .valid('SUPERIOR', 'SUBALTERNO')
    .required()
    .messages({
      'any.required': 'El tipo de personal es requerido',
      'any.only': 'El tipo de personal debe ser SUPERIOR o SUBALTERNO',
    }),
  jerarquiaId: Joi.number().integer().required().messages({
    'number.base': 'La jerarquía debe ser un número',
    'any.required': 'La jerarquía es requerida',
  }),
  numeroCargo: Joi.string().max(50).allow(null, ''),
  seccionId: Joi.number().integer().required().messages({
    'number.base': 'La sección debe ser un número',
    'any.required': 'La sección es requerida',
  }),
  cargo: Joi.string().max(100).allow(null, ''),
  funcionDepto: Joi.string().allow(null, ''),

  // Datos Laborales
  altaDependencia: Joi.date().allow(null),
  bajaDependencia: Joi.date().allow(null),
  motivoBaja: Joi.string().allow(null, ''),
  fechaRetiro: Joi.string().max(50).allow(null, ''),
  estadoServicio: Joi.string()
    .valid('ACTIVO', 'INACTIVO', 'RETIRADO', 'BAJA', 'LICENCIA', 'ART')
    .default('ACTIVO'),
  horarioLaboral: Joi.string().max(100).allow(null, ''),
  profesion: Joi.string().max(100).allow(null, ''),

  // Datos Administrativos
  subsidioSalud: Joi.string().max(50).allow(null, ''),
  prontuario: Joi.string().max(50).allow(null, ''),
  jurisdiccion: Joi.string().max(100).allow(null, ''),
  regional: Joi.string()
    .valid('CAPITAL', 'NORTE', 'SUR', 'ESTE', 'OESTE')
    .allow(null, ''),

  // Equipamiento
  armaTipo: Joi.string().max(100).allow(null, ''),
  nroArma: Joi.string().max(50).allow(null, ''),
  chaleco: Joi.string().max(100).allow(null, ''),
  numeroChaleco: Joi.string().max(50).allow(null, ''),

  // Observaciones
  observaciones: Joi.string().allow(null, ''),

  // Licencias
  diasLicenciaAnuales: Joi.number().integer().min(0).allow(null),
});

// Schema para actualizar personal
const schemaPersonalActualizar = Joi.object({
  apellidos: Joi.string().max(100),
  nombres: Joi.string().max(100),
  numeroAsignacion: Joi.string().max(50),
  dni: Joi.string().max(20),
  cuil: Joi.string().max(20).allow(null, ''),
  fechaNacimiento: Joi.date(),
  estadoCivil: Joi.string().max(20).allow(null, ''),
  sexo: Joi.string().valid('M', 'F').allow(null, ''),
  grupoSanguineo: Joi.string().max(10).allow(null, ''),
  nacionalidad: Joi.string().max(50).allow(null, ''),
  email: Joi.string().email().max(100).allow(null, ''),
  celular: Joi.string().max(50).allow(null, ''),
  domicilio: Joi.string().allow(null, ''),
  localidad: Joi.string().max(100).allow(null, ''),
  tipoPersonal: Joi.string().valid('SUPERIOR', 'SUBALTERNO'),
  jerarquiaId: Joi.string().max(50).allow(null, ''),
  numeroCargo: Joi.string().max(50).allow(null, ''),
  seccionId: Joi.string().max(100).allow(null, ''),
  cargo: Joi.string().max(100).allow(null, ''),
  funcionDepto: Joi.string().allow(null, ''),
  altaDependencia: Joi.date().allow(null),
  altaReparticion: Joi.string().max(50).allow(null, ''),
  altaDepartamental: Joi.string().max(50).allow(null, ''),
  bajaDependencia: Joi.date().allow(null),
  motivoBaja: Joi.string().allow(null, ''),
  fechaRetiro: Joi.string().max(50).allow(null, ''),
  estadoServicio: Joi.string().valid('ACTIVO', 'INACTIVO', 'RETIRADO', 'BAJA', 'LICENCIA', 'ART'),
  horarioLaboral: Joi.string().max(100).allow(null, ''),
  profesion: Joi.string().max(100).allow(null, ''),
  subsidioSalud: Joi.string().max(50).allow(null, ''),
  prontuario: Joi.string().max(50).allow(null, ''),
  jurisdiccion: Joi.string().max(100).allow(null, ''),
  regional: Joi.string()
    .valid('CAPITAL', 'NORTE', 'SUR', 'ESTE', 'OESTE')
    .allow(null, ''),
  armaTipo: Joi.string().max(100).allow(null, ''),
  nroArma: Joi.string().max(50).allow(null, ''),
  poseeChalecoAsignado: Joi.boolean().allow(null, ''),
  nroSerieChalecoAsignado: Joi.string().max(50).allow(null, ''),
  poseeCarnetManejo: Joi.boolean().allow(null, ''),
  conduceAutos: Joi.boolean().allow(null, ''),
  conduceMotos: Joi.boolean().allow(null, ''),
  conduceOtros: Joi.boolean().allow(null, ''),
  poseeCredencialPolicial: Joi.boolean().allow(null, ''),
  observaciones: Joi.string().allow(null, ''),
  diasLicenciaAnuales: Joi.number().integer().min(0).allow(null, ''),
}).min(1);

// Schema para login
const schemaLogin = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'El usuario es requerido',
    'any.required': 'El usuario es requerido',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'La contraseña es requerida',
    'any.required': 'La contraseña es requerida',
  }),
});

// Schema para crear usuario
const schemaUsuario = Joi.object({
  username: Joi.string().max(50).required(),
  password: Joi.string().min(8).required(),
  nombreCompleto: Joi.string().max(150).allow(null, ''),
  email: Joi.string().email().max(100).allow(null, ''),
  rol: Joi.string()
    .valid('admin', 'supervisor', 'usuario', 'auditor')
    .default('usuario'),
});

// Schema para crear licencia
const schemaLicencia = Joi.object({
  tipo: Joi.string()
    .valid(
      'LICENCIA_ORDINARIA',
      'LICENCIA_EXTRAORDINARIA',
      'LICENCIA_POR_ENFERMEDAD'
    )
    .required()
    .messages({
      'any.required': 'El tipo de licencia es requerido',
      'any.only':
        'El tipo de licencia debe ser LICENCIA_ORDINARIA, LICENCIA_EXTRAORDINARIA o LICENCIA_POR_ENFERMEDAD',
    }),
  fechaInicio: Joi.date().required().messages({
    'date.base': 'Fecha de salida inválida',
    'any.required': 'La fecha de salida es requerida',
  }),
  fechaFin: Joi.date().greater(Joi.ref('fechaInicio')).required().messages({
    'date.base': 'Fecha de regreso inválida',
    'any.required': 'La fecha de regreso es requerida',
    'date.greater':
      'La fecha de regreso debe ser posterior a la fecha de salida',
  }),
  dias: Joi.number().integer().min(1).required().messages({
    'number.base': 'Los días deben ser un número',
    'number.min': 'Los días deben ser al menos 1',
    'any.required': 'Los días son requeridos',
  }),
  anioLicencia: Joi.number().integer().min(2000).max(2100).required().messages({
    'number.base': 'El año de licencia debe ser un número',
    'number.min': 'El año de licencia debe ser al menos 2000',
    'any.required': 'El año de licencia es requerido',
  }),
  motivo: Joi.string().allow(null, ''),
  observaciones: Joi.string().allow(null, ''),
  estado: Joi.string()
    .valid('APROBADA', 'PENDIENTE', 'RECHAZADA')
    .default('APROBADA'),
});

// Schema para actualizar licencia
const schemaLicenciaActualizar = Joi.object({
  tipo: Joi.string().valid(
    'LICENCIA_ORDINARIA',
    'LICENCIA_EXTRAORDINARIA',
    'LICENCIA_POR_ENFERMEDAD'
  ),
  fechaInicio: Joi.date(),
  fechaFin: Joi.date(),
  dias: Joi.number().integer().min(1),
  anioLicencia: Joi.number().integer().min(2000).max(2100),
  motivo: Joi.string().allow(null, ''),
  observaciones: Joi.string().allow(null, ''),
  estado: Joi.string().valid('APROBADA', 'PENDIENTE', 'RECHAZADA'),
}).min(1);

// Schema para crear nota médica policial
const schemaNotaMedica = Joi.object({
  fechaInicio: Joi.date().required().messages({
    'date.base': 'Fecha de inicio inválida',
    'any.required': 'La fecha de inicio es requerida',
  }),
  fechaFin: Joi.date().min(Joi.ref('fechaInicio')).required().messages({
    'date.base': 'Fecha de fin inválida',
    'any.required': 'La fecha de fin es requerida',
    'date.min': 'La fecha de fin debe ser posterior o igual a la de inicio',
  }),
  dias: Joi.number().integer().min(1).required().messages({
    'number.base': 'Los días deben ser un número',
    'number.min': 'Los días deben ser al menos 1',
    'any.required': 'Los días son requeridos',
  }),
  diasExtension: Joi.number().integer().min(0).default(0),
  aptitud: Joi.string()
    .valid('APTO', 'NO_APTO', 'APTO_CON_RESTRICCIONES')
    .required()
    .messages({
      'any.required': 'La aptitud es requerida',
      'any.only':
        'La aptitud debe ser APTO, NO_APTO o APTO_CON_RESTRICCIONES',
    }),
  diagnostico: Joi.string().allow(null, ''),
  medico: Joi.string().max(150).allow(null, ''),
  documentoUrl: Joi.string().max(255).allow(null, ''),
  observaciones: Joi.string().allow(null, ''),
  estado: Joi.string()
    .valid('VIGENTE', 'VENCIDA', 'ANULADA')
    .default('VIGENTE'),
});

// Schema para actualizar nota médica policial
const schemaNotaMedicaActualizar = Joi.object({
  fechaInicio: Joi.date(),
  fechaFin: Joi.date(),
  dias: Joi.number().integer().min(1),
  diasExtension: Joi.number().integer().min(0),
  aptitud: Joi.string().valid('APTO', 'NO_APTO', 'APTO_CON_RESTRICCIONES'),
  diagnostico: Joi.string().allow(null, ''),
  medico: Joi.string().max(150).allow(null, ''),
  documentoUrl: Joi.string().max(255).allow(null, ''),
  observaciones: Joi.string().allow(null, ''),
  estado: Joi.string().valid('VIGENTE', 'VENCIDA', 'ANULADA'),
}).min(1);

// Schema para crear capacitación policial
const schemaCapacitacion = Joi.object({
  tipo: Joi.string()
    .valid(
      'CURSO_DE_ASCENSO',
      'ESPECIALIZACION',
      'CAPACITACION_CONTINUA',
      'TIRO_POLICIAL',
      'DERECHOS_HUMANOS',
      'OTRO'
    )
    .required()
    .messages({
      'any.required': 'El tipo de capacitación es requerido',
      'any.only': 'Tipo de capacitación inválido',
    }),
  nombre: Joi.string().max(200).required().messages({
    'string.empty': 'El nombre de la capacitación es requerido',
    'any.required': 'El nombre de la capacitación es requerido',
  }),
  institucion: Joi.string().max(200).required().messages({
    'string.empty': 'La institución es requerida',
    'any.required': 'La institución es requerida',
  }),
  fechaInicio: Joi.date().required().messages({
    'date.base': 'Fecha de inicio inválida',
    'any.required': 'La fecha de inicio es requerida',
  }),
  fechaFin: Joi.date().min(Joi.ref('fechaInicio')).allow(null).messages({
    'date.min': 'La fecha de fin debe ser posterior o igual a la de inicio',
  }),
  duracionHoras: Joi.number().integer().min(0).allow(null),
  certificadoUrl: Joi.string().max(255).allow(null, ''),
  estado: Joi.string()
    .valid('COMPLETADO', 'EN_CURSO', 'PENDIENTE', 'CANCELADO')
    .default('COMPLETADO'),
  calificacion: Joi.number().min(0).max(10).allow(null),
  observaciones: Joi.string().allow(null, ''),
});

// Schema para actualizar capacitación policial
const schemaCapacitacionActualizar = Joi.object({
  tipo: Joi.string().valid(
    'CURSO_DE_ASCENSO',
    'ESPECIALIZACION',
    'CAPACITACION_CONTINUA',
    'TIRO_POLICIAL',
    'DERECHOS_HUMANOS',
    'OTRO'
  ),
  nombre: Joi.string().max(200),
  institucion: Joi.string().max(200),
  fechaInicio: Joi.date(),
  fechaFin: Joi.date().allow(null),
  duracionHoras: Joi.number().integer().min(0).allow(null),
  certificadoUrl: Joi.string().max(255).allow(null, ''),
  estado: Joi.string().valid('COMPLETADO', 'EN_CURSO', 'PENDIENTE', 'CANCELADO'),
  calificacion: Joi.number().min(0).max(10).allow(null),
  observaciones: Joi.string().allow(null, ''),
}).min(1);

// Schema para crear sanción policial
const schemaSancion = Joi.object({
  tipo: Joi.string()
    .valid(
      'AMONESTACION',
      'APERCIBIMIENTO',
      'SUSPENSION',
      'ARRESTO',
      'CESANTIA',
      'EXONERACION'
    )
    .required()
    .messages({
      'any.required': 'El tipo de sanción es requerido',
      'any.only': 'Tipo de sanción inválido',
    }),
  fecha: Joi.date().required().messages({
    'date.base': 'Fecha inválida',
    'any.required': 'La fecha es requerida',
  }),
  motivo: Joi.string().required().messages({
    'string.empty': 'El motivo es requerido',
    'any.required': 'El motivo es requerido',
  }),
  resolucion: Joi.string().max(100).allow(null, ''),
  diasSuspension: Joi.number().integer().min(0).allow(null),
  documentoUrl: Joi.string().max(255).allow(null, ''),
  estado: Joi.string()
    .valid('ACTIVA', 'CUMPLIDA', 'APELADA', 'REVOCADA')
    .default('ACTIVA'),
  observaciones: Joi.string().allow(null, ''),
});

// Schema para actualizar sanción policial
const schemaSancionActualizar = Joi.object({
  tipo: Joi.string().valid(
    'AMONESTACION',
    'APERCIBIMIENTO',
    'SUSPENSION',
    'ARRESTO',
    'CESANTIA',
    'EXONERACION'
  ),
  fecha: Joi.date(),
  motivo: Joi.string(),
  resolucion: Joi.string().max(100).allow(null, ''),
  diasSuspension: Joi.number().integer().min(0).allow(null),
  documentoUrl: Joi.string().max(255).allow(null, ''),
  estado: Joi.string().valid('ACTIVA', 'CUMPLIDA', 'APELADA', 'REVOCADA'),
  observaciones: Joi.string().allow(null, ''),
}).min(1);

// Schema para crear ascenso policial
const schemaAscenso = Joi.object({
  fecha: Joi.date().required().messages({
    'date.base': 'Fecha inválida',
    'any.required': 'La fecha es requerida',
  }),
  jerarquia: Joi.string().max(50).required().messages({
    'string.empty': 'La jerarquía a la que ascendió es requerida',
    'any.required': 'La jerarquía a la que ascendió es requerida',
  }),
  resolucion: Joi.string().max(100).allow(null, ''),
  documentoUrl: Joi.string().max(255).allow(null, ''),
  observaciones: Joi.string().allow(null, ''),
  estado: Joi.string().valid('VIGENTE', 'ANULADO').default('VIGENTE'),
});

// Schema para actualizar ascenso policial
const schemaAscensoActualizar = Joi.object({
  fecha: Joi.date(),
  jerarquia: Joi.string().max(50),
  resolucion: Joi.string().max(100).allow(null, ''),
  documentoUrl: Joi.string().max(255).allow(null, ''),
  observaciones: Joi.string().allow(null, ''),
  estado: Joi.string().valid('VIGENTE', 'ANULADO'),
}).min(1);

module.exports = {
  schemaPersonal,
  schemaPersonalActualizar,
  schemaLogin,
  schemaUsuario,
  schemaLicencia,
  schemaLicenciaActualizar,
  schemaNotaMedica,
  schemaNotaMedicaActualizar,
  schemaCapacitacion,
  schemaCapacitacionActualizar,
  schemaSancion,
  schemaSancionActualizar,
  schemaAscenso,
  schemaAscensoActualizar,
};
