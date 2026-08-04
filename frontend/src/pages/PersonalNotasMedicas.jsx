import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Stethoscope,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { notaMedicaService } from '../services/notaMedica.service';
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

const APTITUDES = [
  { value: 'APTO', label: 'Apto' },
  { value: 'NO_APTO', label: 'No Apto' },
  { value: 'APTO_CON_RESTRICCIONES', label: 'Apto con Restricciones' },
];

const ESTADOS = [
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'VENCIDA', label: 'Vencida' },
  { value: 'ANULADA', label: 'Anulada' },
];

const PersonalNotasMedicas = () => {
  const { id: personalId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [personal, setPersonal] = useState(null);

  const [notasMedicas, setNotasMedicas] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fechaInicio: null,
    fechaFin: null,
    dias: '',
    extendida: false,
    diasExtension: '',
    aptitud: '',
    diagnostico: '',
    medico: '',
    observaciones: '',
    estado: 'VIGENTE',
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

      const notasRes = await notaMedicaService.listar(personalId, {
        limit: 50,
      });

      setNotasMedicas(notasRes.data.data);
      setPersonal(notasRes.data.personal);
      setPagination(notasRes.data.pagination);
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

  // Calcular días entre fechas (inclusive)
  const calcularDias = useCallback((fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 0;
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffTime = fin.getTime() - inicio.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  }, []);

  // Manejar cambio de fechas con auto-cálculo de días
  const handleFechaChange = (campo, value) => {
    const newFormData = { ...formData, [campo]: value };

    if (newFormData.fechaInicio && newFormData.fechaFin) {
      const dias = calcularDias(newFormData.fechaInicio, newFormData.fechaFin);
      newFormData.dias = dias.toString();
    }

    setFormData(newFormData);
    setFormErrors(prev => ({ ...prev, [campo]: null, dias: null }));
  };

  // Preview de fecha de fin con extensión
  const fechaFinExtendidaPreview = () => {
    if (!formData.extendida || !formData.fechaFin || !formData.diasExtension)
      return null;
    const diasExtension = parseInt(formData.diasExtension);
    if (isNaN(diasExtension) || diasExtension <= 0) return null;
    return new Date(
      formData.fechaFin.getTime() + diasExtension * 24 * 60 * 60 * 1000
    );
  };

  const validarFormulario = () => {
    const errors = {};
    if (!formData.fechaInicio)
      errors.fechaInicio = 'La fecha de inicio es requerida';
    if (!formData.fechaFin) errors.fechaFin = 'La fecha de fin es requerida';
    if (
      formData.fechaInicio &&
      formData.fechaFin &&
      formData.fechaFin < formData.fechaInicio
    ) {
      errors.fechaFin = 'La fecha de fin debe ser posterior o igual a la de inicio';
    }
    if (!formData.dias || parseInt(formData.dias) < 1)
      errors.dias = 'Los días deben ser al menos 1';
    if (formData.extendida && (!formData.diasExtension || parseInt(formData.diasExtension) < 1)) {
      errors.diasExtension = 'Indique cuántos días se extendió';
    }
    if (!formData.aptitud) errors.aptitud = 'Seleccione la aptitud';
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
        fechaInicio: formData.fechaInicio.toISOString(),
        fechaFin: formData.fechaFin.toISOString(),
        dias: parseInt(formData.dias),
        diasExtension: formData.extendida
          ? parseInt(formData.diasExtension) || 0
          : 0,
        aptitud: formData.aptitud,
        diagnostico: formData.diagnostico || undefined,
        medico: formData.medico || undefined,
        observaciones: formData.observaciones || undefined,
        estado: formData.estado,
      };

      if (editingId) {
        await notaMedicaService.actualizar(personalId, editingId, datos);
        setSuccess('Nota médica actualizada correctamente');
      } else {
        await notaMedicaService.crear(personalId, datos);
        setSuccess('Nota médica registrada correctamente');
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detalles?.map(d => d.mensaje).join(', ') ||
          'Error al guardar la nota médica'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = notaMedica => {
    setEditingId(notaMedica.id);
    setFormData({
      fechaInicio: new Date(notaMedica.fechaInicio),
      fechaFin: new Date(notaMedica.fechaFin),
      dias: notaMedica.dias.toString(),
      extendida: !!notaMedica.diasExtension,
      diasExtension: notaMedica.diasExtension
        ? notaMedica.diasExtension.toString()
        : '',
      aptitud: notaMedica.aptitud,
      diagnostico: notaMedica.diagnostico || '',
      medico: notaMedica.medico || '',
      observaciones: notaMedica.observaciones || '',
      estado: notaMedica.estado,
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleEliminar = async () => {
    try {
      setDeleting(true);
      await notaMedicaService.eliminar(personalId, deletingId);
      setSuccess('Nota médica eliminada correctamente');
      setShowDeleteDialog(false);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error || 'Error al eliminar la nota médica'
      );
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fechaInicio: null,
      fechaFin: null,
      dias: '',
      extendida: false,
      diasExtension: '',
      aptitud: '',
      diagnostico: '',
      medico: '',
      observaciones: '',
      estado: 'VIGENTE',
    });
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = date => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-AR');
  };

  const getAptitudLabel = aptitud => {
    return APTITUDES.find(a => a.value === aptitud)?.label || aptitud;
  };

  const getAptitudBadgeClass = aptitud => {
    switch (aptitud) {
      case 'APTO':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'NO_APTO':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'APTO_CON_RESTRICCIONES':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
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
                  <Stethoscope className="inline w-8 h-8 mr-2 text-blue-600" />
                  Nota Médica Policial
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
                Registrar Nota Médica
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
                    ? 'Editar Nota Médica'
                    : 'Registrar Nueva Nota Médica'}
                </CardTitle>
                <CardDescription>
                  Complete los datos de la nota médica policial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha de Inicio */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">
                        Desde (Inicio de Nota Médica) *
                      </Label>
                      <DatePicker
                        date={formData.fechaInicio}
                        onSelect={date =>
                          handleFechaChange('fechaInicio', date)
                        }
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
                        Fin de Nota Médica *
                      </Label>
                      <DatePicker
                        date={formData.fechaFin}
                        onSelect={date => handleFechaChange('fechaFin', date)}
                        placeholder="Seleccionar fecha de fin"
                      />
                      {formErrors.fechaFin && (
                        <p className="text-sm text-red-500">
                          {formErrors.fechaFin}
                        </p>
                      )}
                    </div>

                    {/* Días */}
                    <div className="space-y-2">
                      <Label htmlFor="dias" className="dark:text-slate-300">
                        Días de Nota Médica *
                      </Label>
                      <Input
                        id="dias"
                        type="number"
                        min="1"
                        value={formData.dias}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            dias: e.target.value,
                          }));
                          setFormErrors(prev => ({ ...prev, dias: null }));
                        }}
                        placeholder="Se calcula automáticamente"
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.dias ? 'border-red-500' : ''}`}
                      />
                      {formErrors.dias && (
                        <p className="text-sm text-red-500">
                          {formErrors.dias}
                        </p>
                      )}
                    </div>

                    {/* Extensión */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.extendida}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              extendida: e.target.checked,
                              diasExtension: e.target.checked
                                ? prev.diasExtension
                                : '',
                            }))
                          }
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                        />
                        ¿Se extiende? ¿Cuántos días?
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        disabled={!formData.extendida}
                        value={formData.diasExtension}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            diasExtension: e.target.value,
                          }));
                          setFormErrors(prev => ({
                            ...prev,
                            diasExtension: null,
                          }));
                        }}
                        placeholder="Días de extensión"
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50 ${formErrors.diasExtension ? 'border-red-500' : ''}`}
                      />
                      {formErrors.diasExtension && (
                        <p className="text-sm text-red-500">
                          {formErrors.diasExtension}
                        </p>
                      )}
                      {(() => {
                        const preview = fechaFinExtendidaPreview();
                        return preview ? (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Nueva fecha de fin: {preview.toLocaleDateString('es-AR')}
                          </p>
                        ) : null;
                      })()}
                    </div>

                    {/* Aptitud */}
                    <div className="space-y-2">
                      <Label htmlFor="aptitud" className="dark:text-slate-300">
                        Aptitud *
                      </Label>
                      <Select
                        id="aptitud"
                        value={formData.aptitud}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            aptitud: e.target.value,
                          }));
                          setFormErrors(prev => ({ ...prev, aptitud: null }));
                        }}
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.aptitud ? 'border-red-500' : ''}`}
                      >
                        <SelectItem value="">Seleccionar aptitud...</SelectItem>
                        {APTITUDES.map(a => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </Select>
                      {formErrors.aptitud && (
                        <p className="text-sm text-red-500">
                          {formErrors.aptitud}
                        </p>
                      )}
                    </div>

                    {/* Médico */}
                    <div className="space-y-2">
                      <Label htmlFor="medico" className="dark:text-slate-300">
                        Médico
                      </Label>
                      <Input
                        id="medico"
                        value={formData.medico}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            medico: e.target.value,
                          }))
                        }
                        placeholder="Nombre del médico (opcional)"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      />
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
                  </div>

                  {/* Diagnóstico */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="diagnostico"
                      className="dark:text-slate-300"
                    >
                      Diagnóstico
                    </Label>
                    <Input
                      id="diagnostico"
                      value={formData.diagnostico}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          diagnostico: e.target.value,
                        }))
                      }
                      placeholder="Diagnóstico o motivo de la nota (opcional)"
                      className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                    />
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

        {/* Historial de Notas Médicas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Historial de Notas Médicas
              </CardTitle>
              <CardDescription>
                {pagination.total} nota(s) médica(s) registrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notasMedicas.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <p className="text-gray-500 dark:text-slate-400 text-lg">
                    No hay notas médicas registradas
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
                      Registrar primera nota médica
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="font-semibold">Desde</TableHead>
                        <TableHead className="font-semibold text-center">
                          Días
                        </TableHead>
                        <TableHead className="font-semibold">
                          Fin de Nota Médica
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Extensión
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Aptitud
                        </TableHead>
                        <TableHead className="font-semibold">
                          Diagnóstico
                        </TableHead>
                        <TableHead className="font-semibold">
                          Médico
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
                      {notasMedicas.map(notaMedica => (
                        <TableRow
                          key={notaMedica.id}
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                        >
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {formatDate(notaMedica.fechaInicio)}
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-900 dark:text-slate-100">
                            {notaMedica.dias}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {notaMedica.diasExtension > 0 ? (
                              <div>
                                <span className="line-through text-slate-400 dark:text-slate-500 mr-1">
                                  {formatDate(notaMedica.fechaFin)}
                                </span>
                                <span className="font-semibold">
                                  {formatDate(notaMedica.fechaFinExtendida)}
                                </span>
                              </div>
                            ) : (
                              formatDate(notaMedica.fechaFin)
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {notaMedica.diasExtension > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
                                +{notaMedica.diasExtension} día(s)
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getAptitudBadgeClass(notaMedica.aptitud)}`}
                            >
                              {getAptitudLabel(notaMedica.aptitud)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                            {notaMedica.diagnostico || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {notaMedica.medico || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                notaMedica.estado === 'VIGENTE'
                                  ? 'success'
                                  : notaMedica.estado === 'VENCIDA'
                                    ? 'warning'
                                    : 'danger'
                              }
                            >
                              {notaMedica.estado}
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
                                    onClick={() => handleEditar(notaMedica)}
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
                                      setDeletingId(notaMedica.id);
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
                ¿Está seguro de que desea eliminar esta nota médica? Esta
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

export default PersonalNotasMedicas;
