const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { es } = require('date-fns/locale');

class PDFService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../uploads/reportes');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Generar reporte de personal individual
  async generarReportePersonal(personal) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `personal_${personal.ci}_${Date.now()}.pdf`;
        const filePath = path.join(this.reportsDir, fileName);
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Encabezado
        this.addHeader(doc, 'REPORTE DE PERSONAL');

        // Información Personal
        doc.fontSize(14).text('INFORMACIÓN PERSONAL', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        this.addField(doc, 'Nombres:', personal.nombres);
        this.addField(doc, 'Apellidos:', personal.apellidos);
        this.addField(doc, 'CI:', `${personal.ci} ${personal.expedicion}`);
        this.addField(
          doc,
          'Fecha Nacimiento:',
          this.formatDate(personal.fecha_nacimiento)
        );
        this.addField(
          doc,
          'Género:',
          personal.genero === 'M' ? 'Masculino' : 'Femenino'
        );
        this.addField(doc, 'Estado Civil:', personal.estado_civil);
        this.addField(doc, 'Teléfono:', personal.telefono || 'N/A');
        this.addField(doc, 'Correo:', personal.correo || 'N/A');
        this.addField(doc, 'Dirección:', personal.direccion || 'N/A');

        doc.moveDown();

        // Información Policial
        doc.fontSize(14).text('INFORMACIÓN POLICIAL', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        this.addField(doc, 'Jerarquía:', personal.jerarquia || 'N/A');
        this.addField(doc, 'Especialidad:', personal.especialidad || 'N/A');
        this.addField(doc, 'Sección:', personal.seccion || 'N/A');
        this.addField(
          doc,
          'Fecha Ingreso:',
          this.formatDate(personal.fecha_ingreso)
        );
        this.addField(doc, 'Estado:', personal.estado);
        this.addField(
          doc,
          'Grupo Sanguíneo:',
          personal.grupo_sanguineo || 'N/A'
        );

        doc.moveDown();

        // Contacto de Emergencia
        doc.fontSize(14).text('CONTACTO DE EMERGENCIA', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        this.addField(doc, 'Nombre:', personal.contacto_emergencia || 'N/A');
        this.addField(doc, 'Teléfono:', personal.telefono_emergencia || 'N/A');

        // Pie de página
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generar reporte de lista de personal
  async generarReporteListaPersonal(personalList, filtros = {}) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `lista_personal_${Date.now()}.pdf`;
        const filePath = path.join(this.reportsDir, fileName);
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          layout: 'landscape',
        });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Encabezado
        this.addHeader(doc, 'LISTA DE PERSONAL');

        // Filtros aplicados
        if (Object.keys(filtros).length > 0) {
          doc.fontSize(10).text('Filtros aplicados:', { underline: true });
          if (filtros.estado) this.addField(doc, 'Estado:', filtros.estado);
          if (filtros.jerarquia)
            this.addField(doc, 'Jerarquía:', filtros.jerarquia);
          if (filtros.seccion) this.addField(doc, 'Sección:', filtros.seccion);
          doc.moveDown();
        }

        // Tabla de personal
        const tableTop = doc.y;
        const itemHeight = 20;
        const colWidths = [40, 150, 100, 100, 100, 80];

        // Encabezados de tabla
        doc.fontSize(9).font('Helvetica-Bold');
        let x = 50;

        doc.text('N°', x, tableTop, { width: colWidths[0] });
        x += colWidths[0];
        doc.text('Nombre Completo', x, tableTop, { width: colWidths[1] });
        x += colWidths[1];
        doc.text('CI', x, tableTop, { width: colWidths[2] });
        x += colWidths[2];
        doc.text('Jerarquía', x, tableTop, { width: colWidths[3] });
        x += colWidths[3];
        doc.text('Sección', x, tableTop, { width: colWidths[4] });
        x += colWidths[4];
        doc.text('Estado', x, tableTop, { width: colWidths[5] });

        // Línea separadora
        doc
          .moveTo(50, tableTop + 15)
          .lineTo(750, tableTop + 15)
          .stroke();

        // Datos
        doc.font('Helvetica').fontSize(8);
        let y = tableTop + itemHeight;

        personalList.forEach((personal, index) => {
          if (y > 500) {
            doc.addPage();
            y = 50;
          }

          x = 50;
          doc.text(index + 1, x, y, { width: colWidths[0] });
          x += colWidths[0];
          doc.text(`${personal.nombres} ${personal.apellidos}`, x, y, {
            width: colWidths[1],
          });
          x += colWidths[1];
          doc.text(personal.ci, x, y, { width: colWidths[2] });
          x += colWidths[2];
          doc.text(personal.jerarquia?.nombre || 'N/A', x, y, {
            width: colWidths[3],
          });
          x += colWidths[3];
          doc.text(personal.seccion?.nombre || 'N/A', x, y, {
            width: colWidths[4],
          });
          x += colWidths[4];
          doc.text(personal.estado, x, y, { width: colWidths[5] });

          y += itemHeight;
        });

        // Total
        doc.moveDown();
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Total de registros: ${personalList.length}`, 50);

        // Pie de página
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generar reporte de estadísticas
  async generarReporteEstadisticas(estadisticas) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `estadisticas_${Date.now()}.pdf`;
        const filePath = path.join(this.reportsDir, fileName);
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Encabezado
        this.addHeader(doc, 'ESTADÍSTICAS DE PERSONAL');

        // Resumen General
        doc.fontSize(14).text('RESUMEN GENERAL', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);

        this.addField(doc, 'Total Activo:', estadisticas.totalActivo || 0);
        this.addField(doc, 'Total Inactivo:', estadisticas.totalInactivo || 0);
        this.addField(
          doc,
          'Total Superiores:',
          estadisticas.totalSuperiores || 0
        );
        this.addField(
          doc,
          'Total Subalternos:',
          estadisticas.totalSubalternos || 0
        );

        doc.moveDown();

        // Por Jerarquía
        if (estadisticas.porJerarquia && estadisticas.porJerarquia.length > 0) {
          doc
            .fontSize(14)
            .text('DISTRIBUCIÓN POR JERARQUÍA', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);

          estadisticas.porJerarquia.forEach(item => {
            this.addField(doc, item.nombre + ':', item.cantidad);
          });

          doc.moveDown();
        }

        // Por Sección
        if (estadisticas.porSeccion && estadisticas.porSeccion.length > 0) {
          doc
            .fontSize(14)
            .text('DISTRIBUCIÓN POR SECCIÓN', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);

          estadisticas.porSeccion.forEach(item => {
            this.addField(doc, item.nombre + ':', item.cantidad);
          });
        }

        // Pie de página
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Métodos auxiliares
  addHeader(doc, title) {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('POLICÍA BOLIVIANA', { align: 'center' })
      .fontSize(16)
      .text('Departamento de Inteligencia Criminal D-2', { align: 'center' })
      .moveDown()
      .fontSize(14)
      .text(title, { align: 'center' })
      .moveDown(1.5);
  }

  addFooter(doc) {
    const bottom = doc.page.height - 50;
    doc.fontSize(8).text(
      `Generado el: ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", {
        locale: es,
      })}`,
      50,
      bottom,
      { align: 'center' }
    );
  }

  addField(doc, label, value) {
    doc
      .font('Helvetica-Bold')
      .text(label, { continued: true })
      .font('Helvetica')
      .text(` ${value}`);
  }

  formatDate(date) {
    if (!date) return 'N/A';
    // Si ya parece una fecha formateada (DD/MM/YYYY), devolverla tal cual
    if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      return date || 'N/A';
    }
  }

  // Campos disponibles para la Ficha de Datos del Empleado Policial,
  // agrupados por sección, en el orden en que se dibujan en el PDF
  camposPlanillaDisponibles() {
    return {
      foto: true,
      // Datos Personales
      apellidoNombre: true,
      dni: true,
      cuil: true,
      sexo: true,
      fechaNacimiento: true,
      estadoCivil: true,
      nacionalidad: true,
      grupoSanguineo: true,
      email: true,
      domicilio: true,
      localidad: true,
      domicilioAlternativo: true,
      telefonoPersonal: true,
      telefonoAlternativo: true,
      contactosAdicionales: true,
      // Datos Laborales
      tipoPersonal: true,
      estadoServicio: true,
      jerarquia: true,
      legajo: true,
      cargo: true,
      numeroCargo: true,
      seccion: true,
      funcionDepto: true,
      horarioLaboral: true,
      profesion: true,
      prontuario: true,
      jurisdiccion: true,
      regional: true,
      subsidioSalud: true,
      diasLicenciaAnuales: true,
      altaReparticion: true,
      altaDepartamental: true,
      fechaRetiro: true,
      motivoBaja: true,
      // Equipamiento y Otros
      carnetManejo: true,
      conduce: true,
      poseeCredencialPolicial: true,
      chaleco: true,
      arma: true,
      observaciones: true,
      // Historial
      licencias: true,
      notasMedicas: true,
      capacitaciones: true,
      sanciones: true,
      ascensos: true,
    };
  }

  // Etiquetas legibles para valores de tipo/estado/aptitud del historial
  etiquetaLicenciaTipo(tipo) {
    return (
      {
        LICENCIA_ORDINARIA: 'Ordinaria',
        LICENCIA_EXTRAORDINARIA: 'Extraordinaria',
        LICENCIA_POR_ENFERMEDAD: 'Por Enfermedad',
      }[tipo] || tipo
    );
  }

  etiquetaAptitud(aptitud) {
    return (
      {
        APTO: 'Apto',
        NO_APTO: 'No Apto',
        APTO_CON_RESTRICCIONES: 'Apto c/ Restricciones',
      }[aptitud] || aptitud
    );
  }

  etiquetaCapacitacionTipo(tipo) {
    return (
      {
        CURSO_DE_ASCENSO: 'Curso de Ascenso',
        ESPECIALIZACION: 'Especialización',
        CAPACITACION_CONTINUA: 'Capacitación Continua',
        TIRO_POLICIAL: 'Tiro Policial',
        DERECHOS_HUMANOS: 'Derechos Humanos',
        OTRO: 'Otro',
      }[tipo] || tipo
    );
  }

  etiquetaSancionTipo(tipo) {
    return (
      {
        AMONESTACION: 'Amonestación',
        APERCIBIMIENTO: 'Apercibimiento',
        SUSPENSION: 'Suspensión',
        ARRESTO: 'Arresto',
        CESANTIA: 'Cesantía',
        EXONERACION: 'Exoneración',
      }[tipo] || tipo
    );
  }

  // Generar planillas de personal (Ficha de Datos del Empleado Policial)
  // camposSeleccionados: objeto { clave: boolean } indicando qué campos incluir.
  // Si no se provee, se incluyen todos (comportamiento por defecto).
  async generarPlanillasPersonal(personalList, camposSeleccionados = null) {
    return new Promise((resolve, reject) => {
      try {
        const campos = {
          ...this.camposPlanillaDisponibles(),
          ...(camposSeleccionados || {}),
        };

        const datosPersonalesKeys = [
          'apellidoNombre',
          'dni',
          'cuil',
          'sexo',
          'fechaNacimiento',
          'estadoCivil',
          'nacionalidad',
          'grupoSanguineo',
          'email',
          'domicilio',
          'localidad',
          'domicilioAlternativo',
          'telefonoPersonal',
          'telefonoAlternativo',
          'contactosAdicionales',
        ];
        const datosLaboralesKeys = [
          'tipoPersonal',
          'estadoServicio',
          'jerarquia',
          'legajo',
          'cargo',
          'numeroCargo',
          'seccion',
          'funcionDepto',
          'horarioLaboral',
          'profesion',
          'prontuario',
          'jurisdiccion',
          'regional',
          'subsidioSalud',
          'diasLicenciaAnuales',
          'altaReparticion',
          'altaDepartamental',
          'fechaRetiro',
          'motivoBaja',
        ];
        const otrosKeys = [
          'carnetManejo',
          'conduce',
          'poseeCredencialPolicial',
          'chaleco',
          'arma',
          'observaciones',
        ];
        const mostrarDatosPersonales = datosPersonalesKeys.some(
          k => campos[k]
        );
        const mostrarDatosLaborales = datosLaboralesKeys.some(k => campos[k]);
        const mostrarOtros = otrosKeys.some(k => campos[k]);

        const fileName = `planillas_personal_${Date.now()}.pdf`;
        const filePath = path.join(this.reportsDir, fileName);
        const doc = new PDFDocument({ margin: 40, size: 'A4' }); // Margen ajustado
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        const leftMargin = 50;
        const contentWidth = doc.page.width - 100;
        const pageBottom = doc.page.height - 55;

        // Helper para líneas punteadas
        const drawDottedLine = (x, yPos, width) => {
          doc
            .save()
            .dash(1, { space: 2 })
            .moveTo(x, yPos)
            .lineTo(x + width, yPos)
            .stroke()
            .restore();
        };

        // Asegura que quede suficiente espacio en la página actual;
        // si no, agrega una nueva página y devuelve el y reiniciado
        const ensureSpace = (yPos, necesario) => {
          if (yPos + necesario > pageBottom) {
            doc.addPage();
            return 50;
          }
          return yPos;
        };

        // Dibuja una fila con uno o dos campos lado a lado. Cada campo:
        // { enabled, label, value, x, valueX, dottedWidth }
        const drawRow = (yPos, fieldsInRow) => {
          const habilitados = fieldsInRow.filter(f => f.enabled);
          if (habilitados.length === 0) return yPos;
          yPos = ensureSpace(yPos, 20);
          habilitados.forEach(f => {
            doc.font('Helvetica-Bold').text(f.label, f.x, yPos);
            doc.font('Helvetica').text(f.value || '', f.valueX, yPos);
            if (f.dottedWidth) {
              drawDottedLine(f.valueX, yPos + 10, f.dottedWidth);
            }
          });
          return yPos + 20;
        };

        // Dibuja un bloque de texto libre que puede ocupar varias líneas
        const drawTextoLibre = (yPos, label, valor) => {
          if (!valor) return yPos;
          yPos = ensureSpace(yPos, 20);
          doc.font('Helvetica-Bold').text(label, leftMargin, yPos);
          yPos += 14;
          yPos = ensureSpace(yPos, 20);
          doc.font('Helvetica').text(valor, leftMargin, yPos, {
            width: contentWidth,
          });
          return doc.y + 10;
        };

        // Dibuja el título de una sección en un recuadro
        const drawTituloSeccion = (yPos, titulo) => {
          yPos = ensureSpace(yPos, 30);
          doc.rect(leftMargin, yPos, contentWidth, 20).stroke();
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(titulo, leftMargin + 5, yPos + 5);
          doc.fontSize(10);
          return yPos + 30;
        };

        // Dibuja una tabla simple de historial (licencias, sanciones, etc.)
        const drawTablaHistorial = (yPos, titulo, columnas, filas) => {
          yPos = drawTituloSeccion(yPos, titulo);

          if (filas.length === 0) {
            doc
              .font('Helvetica-Oblique')
              .fontSize(9)
              .text('Sin registros.', leftMargin, yPos);
            doc.fontSize(10);
            return yPos + 18;
          }

          const dibujarEncabezados = y2 => {
            let x = leftMargin;
            doc.font('Helvetica-Bold').fontSize(8);
            columnas.forEach(col => {
              doc.text(col.header, x, y2, { width: col.width });
              x += col.width;
            });
            doc
              .moveTo(leftMargin, y2 + 12)
              .lineTo(leftMargin + contentWidth, y2 + 12)
              .stroke();
            return y2 + 16;
          };

          yPos = ensureSpace(yPos, 20);
          yPos = dibujarEncabezados(yPos);

          doc.font('Helvetica').fontSize(8);
          filas.forEach(fila => {
            if (yPos + 14 > pageBottom) {
              doc.addPage();
              yPos = 50;
              yPos = dibujarEncabezados(yPos);
              doc.font('Helvetica').fontSize(8);
            }
            let x = leftMargin;
            columnas.forEach(col => {
              doc.text(String(col.valor(fila) ?? ''), x, yPos, {
                width: col.width,
              });
              x += col.width;
            });
            yPos += 14;
          });

          doc.fontSize(10);
          return yPos + 16;
        };

        personalList.forEach((personal, index) => {
          if (index > 0) doc.addPage();

          // --- ENCABEZADO ---
          // Nota: Como no tengo los escudos exactos, usaré espacios o texto.
          // Si tuvieras los logos en assets, se cargarían aquí.

          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('POLICÍA DE TUCUMÁN', { align: 'center' })
            .fontSize(12)
            .text('DEPARTAMENTO INTELIGENCIA CRIMINAL', { align: 'center' })
            .text('SECCION CENTRAL', { align: 'center' })
            .moveDown(1.5);

          doc
            .fontSize(12)
            .text('FICHA DE DATOS DEL EMPLEADO POLICIAL', {
              align: 'center',
              underline: true,
            });

          doc.moveDown(1);

          let y;

          // --- RECUADRO FOTO ---
          if (campos.foto) {
            const photoX = (doc.page.width - 120) / 2; // Centrado
            const photoY = doc.y;
            const photoWidth = 120;
            const photoHeight = 140;

            doc.rect(photoX, photoY, photoWidth, photoHeight).stroke();

            if (personal.fotoUrl) {
              try {
                const photoPath = path.join(
                  __dirname,
                  '../../uploads',
                  personal.fotoUrl.replace('/uploads/', '')
                );
                if (fs.existsSync(photoPath)) {
                  doc.image(photoPath, photoX + 1, photoY + 1, {
                    width: photoWidth - 2,
                    height: photoHeight - 2,
                    fit: [photoWidth - 2, photoHeight - 2],
                  });
                }
              } catch (err) {
                console.error('Error al cargar foto:', err);
              }
            }

            y = photoY + photoHeight + 30;
          } else {
            y = doc.y + 10;
          }

          doc.fontSize(10);

          // --- DATOS PERSONALES ---
          if (mostrarDatosPersonales) {
            y = drawTituloSeccion(y, 'DATOS PERSONALES');

            const nameValue = `${personal.apellidos}, ${personal.nombres}`.toUpperCase();
            y = drawRow(y, [
              {
                enabled: campos.apellidoNombre,
                label: 'Apellido y Nombre:',
                value: nameValue,
                x: leftMargin,
                valueX: leftMargin + 110,
                dottedWidth: contentWidth - 110,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.dni,
                label: 'DNI:',
                value: personal.dni,
                x: leftMargin,
                valueX: leftMargin + 30,
                dottedWidth: 150,
              },
              {
                enabled: campos.cuil,
                label: 'CUIT / CUIL:',
                value: personal.cuil,
                x: leftMargin + 200,
                valueX: leftMargin + 280,
                dottedWidth: 150,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.sexo,
                label: 'Sexo:',
                value:
                  personal.sexo === 'M'
                    ? 'Masculino'
                    : personal.sexo === 'F'
                      ? 'Femenino'
                      : personal.sexo,
                x: leftMargin,
                valueX: leftMargin + 45,
                dottedWidth: 150,
              },
              {
                enabled: campos.estadoCivil,
                label: 'Estado Civil:',
                value: personal.estadoCivil,
                x: leftMargin + 220,
                valueX: leftMargin + 300,
                dottedWidth: 130,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.fechaNacimiento,
                label: 'Fecha de Nacimiento:',
                value: this.formatDate(personal.fechaNacimiento),
                x: leftMargin,
                valueX: leftMargin + 120,
                dottedWidth: 120,
              },
              {
                enabled: campos.nacionalidad,
                label: 'Nacionalidad:',
                value: personal.nacionalidad || 'ARGENTINA',
                x: leftMargin + 260,
                valueX: leftMargin + 340,
                dottedWidth: 150,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.grupoSanguineo,
                label: 'Grupo Sanguineo:',
                value: personal.grupoSanguineo,
                x: leftMargin,
                valueX: leftMargin + 100,
                dottedWidth: 150,
              },
              {
                enabled: campos.email,
                label: 'Email:',
                value: personal.email,
                x: leftMargin + 260,
                valueX: leftMargin + 310,
                dottedWidth: 180,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.domicilio,
                label: 'Domicilio:',
                value: personal.domicilio,
                x: leftMargin,
                valueX: leftMargin + 60,
                dottedWidth: 250,
              },
              {
                enabled: campos.localidad,
                label: 'Localidad:',
                value: personal.localidad || 'TUCUMÁN',
                x: leftMargin + 320,
                valueX: leftMargin + 380,
                dottedWidth: 120,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.domicilioAlternativo,
                label: 'Domicilio Alternativo:',
                value: '',
                x: leftMargin,
                valueX: leftMargin + 120,
                dottedWidth: contentWidth - 120,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.telefonoPersonal,
                label: 'Teléfono Personal:',
                value: personal.celular,
                x: leftMargin,
                valueX: leftMargin + 100,
                dottedWidth: 150,
              },
              {
                enabled: campos.telefonoAlternativo,
                label: 'Teléfono Alternativo:',
                value: personal.telefonoFijo,
                x: leftMargin + 260,
                valueX: leftMargin + 370,
                dottedWidth: 130,
              },
            ]);

            if (
              campos.contactosAdicionales &&
              Array.isArray(personal.contactosAdicionales) &&
              personal.contactosAdicionales.length > 0
            ) {
              y = ensureSpace(y, 20);
              doc
                .font('Helvetica-Bold')
                .text('Contactos Adicionales:', leftMargin, y);
              y += 14;
              personal.contactosAdicionales.forEach(c => {
                y = ensureSpace(y, 14);
                doc
                  .font('Helvetica')
                  .text(`- ${c.tipo}: ${c.valor}`, leftMargin + 10, y);
                y += 14;
              });
            }

            y += 15;
          }

          // --- DATOS LABORALES ---
          if (mostrarDatosLaborales) {
            y = drawTituloSeccion(y, 'DATOS LABORALES');

            y = drawRow(y, [
              {
                enabled: campos.tipoPersonal,
                label: 'Tipo de Personal:',
                value: personal.tipoPersonal,
                x: leftMargin,
                valueX: leftMargin + 110,
                dottedWidth: 150,
              },
              {
                enabled: campos.estadoServicio,
                label: 'Estado de Servicio:',
                value: personal.estadoServicio,
                x: leftMargin + 280,
                valueX: leftMargin + 400,
                dottedWidth: 90,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.jerarquia,
                label: 'Jerarquía:',
                value: personal.jerarquia,
                x: leftMargin,
                valueX: leftMargin + 60,
                dottedWidth: 180,
              },
              {
                enabled: campos.legajo,
                label: 'Legajo Personal:',
                value: personal.numeroAsignacion,
                x: leftMargin + 250,
                valueX: leftMargin + 350,
                dottedWidth: 150,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.cargo,
                label: 'Cargo:',
                value: personal.cargo,
                x: leftMargin,
                valueX: leftMargin + 50,
                dottedWidth: 190,
              },
              {
                enabled: campos.numeroCargo,
                label: 'N° de Cargo:',
                value: personal.numeroCargo,
                x: leftMargin + 250,
                valueX: leftMargin + 330,
                dottedWidth: 170,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.seccion,
                label: 'Pertenece a División/Sección:',
                value: personal.seccion,
                x: leftMargin,
                valueX: leftMargin + 170,
                dottedWidth: contentWidth - 170,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.funcionDepto,
                label: 'Función en Departamento:',
                value: personal.funcionDepto,
                x: leftMargin,
                valueX: leftMargin + 155,
                dottedWidth: contentWidth - 155,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.horarioLaboral,
                label: 'Horario Laboral:',
                value: personal.horarioLaboral,
                x: leftMargin,
                valueX: leftMargin + 95,
                dottedWidth: 165,
              },
              {
                enabled: campos.profesion,
                label: 'Profesión:',
                value: personal.profesion,
                x: leftMargin + 280,
                valueX: leftMargin + 340,
                dottedWidth: 150,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.prontuario,
                label: 'Nro. De prontuario:',
                value: personal.prontuario,
                x: leftMargin,
                valueX: leftMargin + 110,
                dottedWidth: 150,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.jurisdiccion,
                label: 'Jurisdicción:',
                value: personal.jurisdiccion,
                x: leftMargin,
                valueX: leftMargin + 75,
                dottedWidth: 165,
              },
              {
                enabled: campos.regional,
                label: 'Regional:',
                value: personal.regional,
                x: leftMargin + 280,
                valueX: leftMargin + 335,
                dottedWidth: 155,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.subsidioSalud,
                label: 'Subsidio de Salud:',
                value: personal.subsidioSalud,
                x: leftMargin,
                valueX: leftMargin + 105,
                dottedWidth: 155,
              },
              {
                enabled: campos.diasLicenciaAnuales,
                label: 'Días Licencia Anuales:',
                value:
                  personal.diasLicenciaAnuales !== null &&
                  personal.diasLicenciaAnuales !== undefined
                    ? String(personal.diasLicenciaAnuales)
                    : '',
                x: leftMargin + 280,
                valueX: leftMargin + 420,
                dottedWidth: 70,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.altaReparticion,
                label: 'Alta de Repartición:',
                value: this.formatDate(personal.altaReparticion),
                x: leftMargin,
                valueX: leftMargin + 110,
                dottedWidth: 200,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.altaDepartamental,
                label: 'Alta Departamental:',
                value: this.formatDate(personal.altaDepartamental),
                x: leftMargin,
                valueX: leftMargin + 110,
                dottedWidth: 200,
              },
            ]);

            y = drawRow(y, [
              {
                enabled: campos.fechaRetiro,
                label: 'Fecha de Retiro:',
                value: this.formatDate(personal.fechaRetiro),
                x: leftMargin,
                valueX: leftMargin + 95,
                dottedWidth: 165,
              },
            ]);

            y = drawTextoLibre(y, 'Motivo de Baja:', campos.motivoBaja ? personal.motivoBaja : null);

            y += 5;
          }

          // --- EQUIPAMIENTO Y OTROS ---
          if (mostrarOtros) {
            y = drawTituloSeccion(y, 'EQUIPAMIENTO Y OTROS');

            if (campos.carnetManejo) {
              y = ensureSpace(y, 20);
              doc
                .font('Helvetica-Bold')
                .text('Carnet de Manejo posee:', leftMargin, y);
              const poseeCarnet = personal.poseeCarnetManejo ? 'SI' : 'NO';
              doc
                .font('Helvetica')
                .text(`SI   /   NO    (${poseeCarnet})`, leftMargin + 130, y);
              y += 20;
            }

            if (campos.conduce) {
              y = ensureSpace(y, 20);
              doc.font('Helvetica-Bold').text('Conduce:', leftMargin, y);
              const checkAuto = personal.conduceAutos ? '[ X ]' : '[   ]';
              const checkMoto = personal.conduceMotos ? '[ X ]' : '[   ]';
              const checkOtros = personal.conduceOtros ? '[ X ]' : '[   ]';
              doc
                .font('Helvetica')
                .text(`Autos ${checkAuto}`, leftMargin + 60, y);
              doc.text(`Motos ${checkMoto}`, leftMargin + 140, y);
              doc.text(`Otros ${checkOtros}`, leftMargin + 220, y);
              y += 20;
            }

            if (campos.poseeCredencialPolicial) {
              y = ensureSpace(y, 20);
              doc
                .font('Helvetica-Bold')
                .text('Credencial Policial posee:', leftMargin, y);
              const poseeCredencial = personal.poseeCredencialPolicial
                ? 'SI'
                : 'NO';
              doc
                .font('Helvetica')
                .text(
                  `SI   /   NO    (${poseeCredencial})`,
                  leftMargin + 145,
                  y
                );
              y += 20;
            }

            if (campos.chaleco) {
              y = ensureSpace(y, 20);
              doc
                .font('Helvetica-Bold')
                .text('Chaleco Provisto:', leftMargin, y);
              const poseeChaleco = personal.poseeChalecoAsignado
                ? 'SI'
                : 'NO';
              doc
                .font('Helvetica')
                .text(`SI   /   NO    (${poseeChaleco})`, leftMargin + 100, y);

              doc
                .font('Helvetica-Bold')
                .text('N° de Serie:', leftMargin + 250, y);
              doc
                .font('Helvetica')
                .text(
                  personal.nroSerieChalecoAsignado || '',
                  leftMargin + 320,
                  y
                );
              drawDottedLine(leftMargin + 320, y + 10, 150);
              y += 20;
            }

            if (campos.arma) {
              y = ensureSpace(y, 20);
              doc
                .font('Helvetica-Bold')
                .text('Arma provista: Marca:', leftMargin, y);
              doc
                .font('Helvetica')
                .text(personal.armaTipo || '', leftMargin + 120, y);
              drawDottedLine(leftMargin + 120, y + 10, 150);

              doc
                .font('Helvetica-Bold')
                .text('N° de Serie:', leftMargin + 280, y);
              doc
                .font('Helvetica')
                .text(personal.nroArma || '', leftMargin + 350, y);
              drawDottedLine(leftMargin + 350, y + 10, 150);
              y += 20;
            }

            y = drawTextoLibre(
              y,
              'Observaciones:',
              campos.observaciones ? personal.observaciones : null
            );
          }

          // --- HISTORIAL: LICENCIAS ---
          if (campos.licencias) {
            y = drawTablaHistorial(
              y,
              'LICENCIAS',
              [
                { header: 'Tipo', width: 110, valor: r => this.etiquetaLicenciaTipo(r.tipo) },
                { header: 'Desde', width: 65, valor: r => this.formatDate(r.fechaInicio) },
                { header: 'Hasta', width: 65, valor: r => this.formatDate(r.fechaFin) },
                { header: 'Días', width: 40, valor: r => r.dias },
                { header: 'Motivo', width: 130, valor: r => r.motivo || '' },
                { header: 'Estado', width: 85, valor: r => r.estado },
              ],
              personal.licencias || []
            );
          }

          // --- HISTORIAL: NOTAS MÉDICAS ---
          if (campos.notasMedicas) {
            y = drawTablaHistorial(
              y,
              'NOTAS MÉDICAS POLICIALES',
              [
                { header: 'Desde', width: 65, valor: r => this.formatDate(r.fechaInicio) },
                { header: 'Días', width: 40, valor: r => r.dias },
                { header: 'Hasta', width: 65, valor: r => this.formatDate(r.fechaFin) },
                { header: 'Extensión', width: 60, valor: r => (r.diasExtension > 0 ? `+${r.diasExtension}d` : '-') },
                { header: 'Aptitud', width: 110, valor: r => this.etiquetaAptitud(r.aptitud) },
                { header: 'Estado', width: 95, valor: r => r.estado },
              ],
              personal.notasMedicas || []
            );
          }

          // --- HISTORIAL: CAPACITACIONES ---
          if (campos.capacitaciones) {
            y = drawTablaHistorial(
              y,
              'CAPACITACIONES',
              [
                { header: 'Tipo', width: 100, valor: r => this.etiquetaCapacitacionTipo(r.tipo) },
                { header: 'Nombre', width: 140, valor: r => r.nombre },
                { header: 'Institución', width: 110, valor: r => r.institucion },
                { header: 'Fecha', width: 65, valor: r => this.formatDate(r.fechaInicio) },
                { header: 'Estado', width: 80, valor: r => r.estado },
              ],
              personal.capacitaciones || []
            );
          }

          // --- HISTORIAL: SANCIONES ---
          if (campos.sanciones) {
            y = drawTablaHistorial(
              y,
              'SANCIONES',
              [
                { header: 'Tipo', width: 100, valor: r => this.etiquetaSancionTipo(r.tipo) },
                { header: 'Fecha', width: 60, valor: r => this.formatDate(r.fecha) },
                { header: 'Motivo', width: 180, valor: r => r.motivo },
                { header: 'Días', width: 40, valor: r => r.diasSuspension || '-' },
                { header: 'Estado', width: 115, valor: r => r.estado },
              ],
              personal.sanciones || []
            );
          }

          // --- HISTORIAL: ASCENSOS ---
          if (campos.ascensos) {
            y = drawTablaHistorial(
              y,
              'ASCENSOS',
              [
                { header: 'Fecha', width: 70, valor: r => this.formatDate(r.fecha) },
                { header: 'Ascendió a', width: 160, valor: r => r.jerarquia },
                { header: 'Resolución', width: 130, valor: r => r.resolucion || '' },
                { header: 'Estado', width: 135, valor: r => r.estado },
              ],
              personal.ascensos || []
            );
          }

          // Pie de página
          doc
            .fontSize(8)
            .text(
              `Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', {
                locale: es,
              })}`,
              50,
              doc.page.height - 40,
              { align: 'center' }
            );
        });

        doc.end();

        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  addFieldCompact(doc, label, value, x, y) {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(label, x, y, { continued: true, width: 100 });
    doc.font('Helvetica').text(` ${value}`, { width: 200 });
  }

  // Limpiar reportes antiguos (opcional)
  async limpiarReportesAntiguos(dias = 30) {
    const files = fs.readdirSync(this.reportsDir);
    const now = Date.now();
    const maxAge = dias * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(this.reportsDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

module.exports = new PDFService();
