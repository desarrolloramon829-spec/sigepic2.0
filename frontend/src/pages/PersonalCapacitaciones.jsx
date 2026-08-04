import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  GraduationCap,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { capacitacionService } from '../services/capacitacion.service';
import { personalService } from '../services/personal.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectItem } from '../components/ui/select';
import { DatePicker } from '../components/ui/date-picker';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';

const TIPOS_CAPACITACION = [
  { value: 'CURSO_DE_ASCENSO', label: 'Curso de Ascenso' },
  { value: 'ESPECIALIZACION', label: 'Especialización' },
  { value: 'CAPACITACION_CONTINUA', label: 'Capacitación Continua' },
  { value: 'TIRO_POLICIAL', label: 'Tiro Policial' },
  { value: 'DERECHOS_HUMANOS', label: 'Derechos Humanos' },
  { value: 'OTRO', label: 'Otro' },
];

const ESTADOS = [
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'EN_CURSO', label: 'En Curso' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const PersonalCapacitaciones = () => {
  const { id: personalId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [personal, setPersonal] = useState(null);

  const [capacitaciones, setCapacitaciones] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    tipo: '',
    nombre: '',
    institucion: '',
    fechaInicio: null,
    fechaFin: null,
    duracionHoras: '',
    calificacion: '',
    observaciones: '',
    estado: 'COMPLETADO',
  });
  const [formErrors, setFormErrors] = useState({});

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [personalId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const capacitacionesRes = await capacitacionService.listar(
        personalId,
        { limit: 50 }
      );

      setCapacitaciones(capacitacionesRes.data.data);
      setPersonal(capacitacionesRes.data.personal);
      setPagination(capacitacionesRes.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los datos');
      try {
        const personalRes = await personalService.obtenerPorId(personalId);
        setPersonal({
          id: personalRes.data.id,
          apellidos: personalRes.data.apellidos,
          nombres: personalRes.data.nombres,
        });
      } catch (_) {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const errors = {};
    if (!formData.tipo) errors.tipo = 'Seleccione un tipo de capacitación';
    if (!formData.nombre) errors.nombre = 'El nombre es requerido';
    if (!formData.institucion) errors.institucion = 'La institución es requerida';
    if (!formData.fechaInicio)
      errors.fechaInicio = 'La fecha de inicio es requerida';
    if (
      formData.fechaInicio &&
      formData.fechaFin &&
      formData.fechaFin < formData.fechaInicio
    ) {
      errors.fechaFin = 'La fecha de fin debe ser posterior o igual a la de inicio';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      setSaving(true);
      setError('');

      const datos = {
        tipo: formData.tipo,
        nombre: formData.nombre,
        institucion: formData.institucion,
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin
          ? formData.fechaFin.toISOString()
          : undefined,
        duracionHoras: formData.duracionHoras || undefined,
        calificacion: formData.calificacion || undefined,
        observaciones: formData.observaciones || undefined,
        estado: formData.estado,
      };

      if (editingId) {
        await capacitacionService.actualizar(personalId, editingId, datos);
        setSuccess('Capacitación actualizada correctamente');
      } else {
        await capacitacionService.crear(personalId, datos);
        setSuccess('Capacitación registrada correctamente');
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detalles?.map(d => d.mensaje).join(', ') ||
          'Error al guardar la capacitación'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = capacitacion => {
    setEditingId(capacitacion.id);
    setFormData({
      tipo: capacitacion.tipo,
      nombre: capacitacion.nombre,
      institucion: capacitacion.institucion,
      fechaInicio: new Date(capacitacion.fechaInicio),
      fechaFin: capacitacion.fechaFin ? new Date(capacitacion.fechaFin) : null,
      duracionHoras: capacitacion.duracionHoras
        ? capacitacion.duracionHoras.toString()
        : '',
      calificacion: capacitacion.calificacion
        ? capacitacion.calificacion.toString()
        : '',
      observaciones: capacitacion.observaciones || '',
      estado: capacitacion.estado,
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleEliminar = async () => {
    try {
      setDeleting(true);
      await capacitacionService.eliminar(personalId, deletingId);
      setSuccess('Capacitación eliminada correctamente');
      setShowDeleteDialog(false);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error al eliminar la capacitación'
      );
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: '',
      nombre: '',
      institucion: '',
      fechaInicio: null,
      fechaFin: null,
      duracionHoras: '',
      calificacion: '',
      observaciones: '',
      estado: 'COMPLETADO',
    });
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = date => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR');
  };

  const getTipoLabel = tipo => {
    return TIPOS_CAPACITACION.find(t => t.value === tipo)?.label || tipo;
  };

  const getTipoBadgeClass = tipo => {
    switch (tipo) {
      case 'CURSO_DE_ASCENSO':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'ESPECIALIZACION':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
      case 'TIRO_POLICIAL':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'DERECHOS_HUMANOS':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800';
      case 'CAPACITACION_CONTINUA':
        return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  <GraduationCap className="inline w-8 h-8 mr-2 text-blue-600" />
                  Capacitaciones Policiales
                </h1>
                {personal && (
                  <p className="text-gray-600 dark:text-slate-400 mt-1">
                    {personal.nombres} {personal.apellidos}
                  </p>
                )}
              </div>
            </div>

            {hasPermission('create') && (
              <Button
                onClick={() => {
                  if (showForm && !editingId) {
                    resetForm();
                  } else {
                    resetForm();
                    setShowForm(true);
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Capacitación
              </Button>
            )}
          </div>
        </motion.div>

        {/* Mensajes */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Formulario */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg border-l-4 border-l-blue-600">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId
                    ? 'Editar Capacitación'
                    : 'Registrar Nueva Capacitación'}
                </CardTitle>
                <CardDescription>
                  Complete los datos de la capacitación policial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="dark:text-slate-300">
                        Tipo de Capacitación *
                      </Label>
                      <Select
                        id="tipo"
                        value={formData.tipo}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            tipo: e.target.value,
                          }));
                          setFormErrors(prev => ({ ...prev, tipo: null }));
                        }}
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.tipo ? 'border-red-500' : ''}`}
                      >
                        <SelectItem value="">Seleccionar tipo...</SelectItem>
                        {TIPOS_CAPACITACION.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </Select>
                      {formErrors.tipo && (
                        <p className="text-sm text-red-500">
                          {formErrors.tipo}
                        </p>
                      )}
                    </div>

                    {/* Nombre */}
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="dark:text-slate-300">
                        Nombre de la Capacitación *
                      </Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            nombre: e.target.value,
                          }));
                          setFormErrors(prev => ({ ...prev, nombre: null }));
                        }}
                        placeholder="Ej: Curso de Actualización Profesional"
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.nombre ? 'border-red-500' : ''}`}
                      />
                      {formErrors.nombre && (
                        <p className="text-sm text-red-500">
                          {formErrors.nombre}
                        </p>
                      )}
                    </div>

                    {/* Institución */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="institucion"
                        className="dark:text-slate-300"
                      >
                        Institución *
                      </Label>
                      <Input
                        id="institucion"
                        value={formData.institucion}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            institucion: e.target.value,
                          }));
                          setFormErrors(prev => ({
                            ...prev,
                            institucion: null,
                          }));
                        }}
                        placeholder="Ej: Escuela de Policía de Tucumán"
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.institucion ? 'border-red-500' : ''}`}
                      />
                      {formErrors.institucion && (
                        <p className="text-sm text-red-500">
                          {formErrors.institucion}
                        </p>
                      )}
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                      <Label htmlFor="estado" className="dark:text-slate-300">
                        Estado
                      </Label>
                      <Select
                        id="estado"
                        value={formData.estado}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            estado: e.target.value,
                          }))
                        }
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      >
                        {ESTADOS.map(e => (
                          <SelectItem key={e.value} value={e.value}>
                            {e.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Fecha de Inicio */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">
                        Fecha de Inicio *
                      </Label>
                      <DatePicker
                        date={formData.fechaInicio}
                        onSelect={date => {
                          setFormData(prev => ({ ...prev, fechaInicio: date }));
                          setFormErrors(prev => ({
                            ...prev,
                            fechaInicio: null,
                          }));
                        }}
                        placeholder="Seleccionar fecha de inicio"
                      />
                      {formErrors.fechaInicio && (
                        <p className="text-sm text-red-500">
                          {formErrors.fechaInicio}
                        </p>
                      )}
                    </div>

                    {/* Fecha de Fin */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">
                        Fecha de Fin
                      </Label>
                      <DatePicker
                        date={formData.fechaFin}
                        onSelect={date => {
                          setFormData(prev => ({ ...prev, fechaFin: date }));
                          setFormErrors(prev => ({ ...prev, fechaFin: null }));
                        }}
                        placeholder="Seleccionar fecha de fin (opcional)"
                      />
                      {formErrors.fechaFin && (
                        <p className="text-sm text-red-500">
                          {formErrors.fechaFin}
                        </p>
                      )}
                    </div>

                    {/* Duración en horas */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="duracionHoras"
                        className="dark:text-slate-300"
                      >
                        Duración (horas)
                      </Label>
                      <Input
                        id="duracionHoras"
                        type="number"
                        min="0"
                        value={formData.duracionHoras}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            duracionHoras: e.target.value,
                          }))
                        }
                        placeholder="Opcional"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      />
                    </div>

                    {/* Calificación */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="calificacion"
                        className="dark:text-slate-300"
                      >
                        Calificación (0-10)
                      </Label>
                      <Input
                        id="calificacion"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.calificacion}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            calificacion: e.target.value,
                          }))
                        }
                        placeholder="Opcional"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="observaciones"
                      className="dark:text-slate-300"
                    >
                      Observaciones
                    </Label>
                    <Input
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          observaciones: e.target.value,
                        }))
                      }
                      placeholder="Observaciones adicionales (opcional)"
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white min-w-[140px]"
                    >
                      {saving ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Guardando...
                        </>
                      ) : editingId ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Actualizar
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Registrar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Historial de Capacitaciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Historial de Capacitaciones
              </CardTitle>
              <CardDescription>
                {pagination.total} capacitación(es) registrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {capacitaciones.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <p className="text-gray-500 dark:text-slate-400 text-lg">
                    No hay capacitaciones registradas
                  </p>
                  {hasPermission('create') && (
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setShowForm(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar primera capacitación
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">
                          Nombre
                        </TableHead>
                        <TableHead className="font-semibold">
                          Institución
                        </TableHead>
                        <TableHead className="font-semibold">
                          Inicio
                        </TableHead>
                        <TableHead className="font-semibold">Fin</TableHead>
                        <TableHead className="font-semibold text-center">
                          Hs.
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Estado
                        </TableHead>
                        {(hasPermission('update') ||
                          hasPermission('delete')) && (
                          <TableHead className="font-semibold text-center">
                            Acciones
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {capacitaciones.map(capacitacion => (
                        <TableRow
                          key={capacitacion.id}
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                        >
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTipoBadgeClass(capacitacion.tipo)}`}
                            >
                              {getTipoLabel(capacitacion.tipo)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                            {capacitacion.nombre}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {capacitacion.institucion}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {formatDate(capacitacion.fechaInicio)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {formatDate(capacitacion.fechaFin)}
                          </TableCell>
                          <TableCell className="text-center text-slate-700 dark:text-slate-300">
                            {capacitacion.duracionHoras || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                capacitacion.estado === 'COMPLETADO'
                                  ? 'success'
                                  : capacitacion.estado === 'EN_CURSO'
                                    ? 'info'
                                    : capacitacion.estado === 'PENDIENTE'
                                      ? 'warning'
                                      : 'danger'
                              }
                            >
                              {capacitacion.estado}
                            </Badge>
                          </TableCell>
                          {(hasPermission('update') ||
                            hasPermission('delete')) && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {hasPermission('update') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditar(capacitacion)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600"
                                    title="Editar"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                                {hasPermission('delete') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setDeletingId(capacitacion.id);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Diálogo de confirmación de eliminación */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Está seguro de que desea eliminar esta capacitación? Esta
                acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleEliminar}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PersonalCapacitaciones;
