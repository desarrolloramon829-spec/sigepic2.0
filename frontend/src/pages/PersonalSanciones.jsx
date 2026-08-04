import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { sancionService } from '../services/sancion.service';
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

const TIPOS_SANCION = [
  { value: 'AMONESTACION', label: 'Amonestación' },
  { value: 'APERCIBIMIENTO', label: 'Apercibimiento' },
  { value: 'SUSPENSION', label: 'Suspensión' },
  { value: 'ARRESTO', label: 'Arresto' },
  { value: 'CESANTIA', label: 'Cesantía' },
  { value: 'EXONERACION', label: 'Exoneración' },
];

const ESTADOS = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'CUMPLIDA', label: 'Cumplida' },
  { value: 'APELADA', label: 'Apelada' },
  { value: 'REVOCADA', label: 'Revocada' },
];

const TIPOS_CON_DIAS = ['SUSPENSION', 'ARRESTO'];

const PersonalSanciones = () => {
  const { id: personalId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [personal, setPersonal] = useState(null);

  const [sanciones, setSanciones] = useState([]);
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
    fecha: null,
    motivo: '',
    resolucion: '',
    diasSuspension: '',
    observaciones: '',
    estado: 'ACTIVA',
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

      const sancionesRes = await sancionService.listar(personalId, {
        limit: 50,
      });

      setSanciones(sancionesRes.data.data);
      setPersonal(sancionesRes.data.personal);
      setPagination(sancionesRes.data.pagination);
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
    if (!formData.tipo) errors.tipo = 'Seleccione un tipo de sanción';
    if (!formData.fecha) errors.fecha = 'La fecha es requerida';
    if (!formData.motivo) errors.motivo = 'El motivo es requerido';
    if (
      TIPOS_CON_DIAS.includes(formData.tipo) &&
      (!formData.diasSuspension || parseInt(formData.diasSuspension) < 1)
    ) {
      errors.diasSuspension = 'Indique la cantidad de días';
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
        fecha: formData.fecha.toISOString(),
        motivo: formData.motivo,
        resolucion: formData.resolucion || undefined,
        diasSuspension: formData.diasSuspension || undefined,
        observaciones: formData.observaciones || undefined,
        estado: formData.estado,
      };

      if (editingId) {
        await sancionService.actualizar(personalId, editingId, datos);
        setSuccess('Sanción actualizada correctamente');
      } else {
        await sancionService.crear(personalId, datos);
        setSuccess('Sanción registrada correctamente');
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detalles?.map(d => d.mensaje).join(', ') ||
          'Error al guardar la sanción'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = sancion => {
    setEditingId(sancion.id);
    setFormData({
      tipo: sancion.tipo,
      fecha: new Date(sancion.fecha),
      motivo: sancion.motivo,
      resolucion: sancion.resolucion || '',
      diasSuspension: sancion.diasSuspension
        ? sancion.diasSuspension.toString()
        : '',
      observaciones: sancion.observaciones || '',
      estado: sancion.estado,
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleEliminar = async () => {
    try {
      setDeleting(true);
      await sancionService.eliminar(personalId, deletingId);
      setSuccess('Sanción eliminada correctamente');
      setShowDeleteDialog(false);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la sanción');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: '',
      fecha: null,
      motivo: '',
      resolucion: '',
      diasSuspension: '',
      observaciones: '',
      estado: 'ACTIVA',
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
    return TIPOS_SANCION.find(t => t.value === tipo)?.label || tipo;
  };

  const getTipoBadgeClass = tipo => {
    switch (tipo) {
      case 'AMONESTACION':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'APERCIBIMIENTO':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'SUSPENSION':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
      case 'ARRESTO':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'CESANTIA':
      case 'EXONERACION':
        return 'bg-slate-800 text-white border-slate-900 dark:bg-red-950 dark:text-red-300 dark:border-red-900';
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
                  <ShieldAlert className="inline w-8 h-8 mr-2 text-blue-600" />
                  Sanciones Policiales
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
                Registrar Sanción
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
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg border-l-4 border-l-red-600">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingId ? 'Editar Sanción' : 'Registrar Nueva Sanción'}
                </CardTitle>
                <CardDescription>
                  Complete los datos de la sanción disciplinaria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="tipo" className="dark:text-slate-300">
                        Tipo de Sanción *
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
                        {TIPOS_SANCION.map(t => (
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

                    {/* Fecha */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">Fecha *</Label>
                      <DatePicker
                        date={formData.fecha}
                        onSelect={date => {
                          setFormData(prev => ({ ...prev, fecha: date }));
                          setFormErrors(prev => ({ ...prev, fecha: null }));
                        }}
                        placeholder="Seleccionar fecha"
                      />
                      {formErrors.fecha && (
                        <p className="text-sm text-red-500">
                          {formErrors.fecha}
                        </p>
                      )}
                    </div>

                    {/* Días de suspensión/arresto */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="diasSuspension"
                        className="dark:text-slate-300"
                      >
                        Días de Suspensión/Arresto
                        {TIPOS_CON_DIAS.includes(formData.tipo) ? ' *' : ''}
                      </Label>
                      <Input
                        id="diasSuspension"
                        type="number"
                        min="1"
                        value={formData.diasSuspension}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            diasSuspension: e.target.value,
                          }));
                          setFormErrors(prev => ({
                            ...prev,
                            diasSuspension: null,
                          }));
                        }}
                        placeholder="Solo aplica a Suspensión/Arresto"
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.diasSuspension ? 'border-red-500' : ''}`}
                      />
                      {formErrors.diasSuspension && (
                        <p className="text-sm text-red-500">
                          {formErrors.diasSuspension}
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

                    {/* Resolución */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="resolucion"
                        className="dark:text-slate-300"
                      >
                        N° de Resolución
                      </Label>
                      <Input
                        id="resolucion"
                        value={formData.resolucion}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            resolucion: e.target.value,
                          }))
                        }
                        placeholder="Opcional"
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="space-y-2">
                    <Label htmlFor="motivo" className="dark:text-slate-300">
                      Motivo *
                    </Label>
                    <Input
                      id="motivo"
                      value={formData.motivo}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          motivo: e.target.value,
                        }));
                        setFormErrors(prev => ({ ...prev, motivo: null }));
                      }}
                      placeholder="Motivo de la sanción"
                      className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.motivo ? 'border-red-500' : ''}`}
                    />
                    {formErrors.motivo && (
                      <p className="text-sm text-red-500">
                        {formErrors.motivo}
                      </p>
                    )}
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
                      className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white min-w-[140px]"
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

        {/* Historial de Sanciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                Historial de Sanciones
              </CardTitle>
              <CardDescription>
                {pagination.total} sanción(es) registrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sanciones.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldAlert className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <p className="text-gray-500 dark:text-slate-400 text-lg">
                    No hay sanciones registradas
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
                      Registrar primera sanción
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
                          Fecha
                        </TableHead>
                        <TableHead className="font-semibold">
                          Motivo
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Días
                        </TableHead>
                        <TableHead className="font-semibold">
                          Resolución
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
                      {sanciones.map(sancion => (
                        <TableRow
                          key={sancion.id}
                          className="hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTipoBadgeClass(sancion.tipo)}`}
                            >
                              {getTipoLabel(sancion.tipo)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {formatDate(sancion.fecha)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                            {sancion.motivo}
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-900 dark:text-slate-100">
                            {sancion.diasSuspension || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {sancion.resolucion || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                sancion.estado === 'CUMPLIDA'
                                  ? 'success'
                                  : sancion.estado === 'ACTIVA'
                                    ? 'danger'
                                    : sancion.estado === 'APELADA'
                                      ? 'warning'
                                      : 'default'
                              }
                            >
                              {sancion.estado}
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
                                    onClick={() => handleEditar(sancion)}
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
                                      setDeletingId(sancion.id);
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
                ¿Está seguro de que desea eliminar esta sanción? Esta acción
                no se puede deshacer.
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

export default PersonalSanciones;
