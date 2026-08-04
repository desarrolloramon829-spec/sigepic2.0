import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Award,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { ascensoService } from '../services/ascenso.service';
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

const JERARQUIAS_SUPERIORES = [
  'Comisario General',
  'Comisario Mayor',
  'Comisario Inspector',
  'Comisario Principal',
  'Comisario',
  'Subcomisario',
  'Oficial Principal',
  'Oficial Auxiliar',
  'Oficial Ayudante',
  'Oficial Subayudante',
];

const JERARQUIAS_SUBALTERNAS = [
  'Suboficial Mayor',
  'Suboficial Principal',
  'Sargento Ayudante',
  'Sargento 1°',
  'Sargento',
  'Cabo 1°',
  'Cabo',
  'Agente',
  'PTP',
];

const PersonalAscensos = () => {
  const { id: personalId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [personal, setPersonal] = useState(null);

  const [ascensos, setAscensos] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fecha: null,
    jerarquia: '',
    resolucion: '',
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

      const ascensosRes = await ascensoService.listar(personalId, {
        limit: 50,
      });

      setAscensos(ascensosRes.data.data);
      setPersonal(ascensosRes.data.personal);
      setPagination(ascensosRes.data.pagination);
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
    if (!formData.fecha) errors.fecha = 'La fecha es requerida';
    if (!formData.jerarquia)
      errors.jerarquia = 'Seleccione la jerarquía a la que ascendió';
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
        fecha: formData.fecha.toISOString(),
        jerarquia: formData.jerarquia,
        resolucion: formData.resolucion || undefined,
        observaciones: formData.observaciones || undefined,
        estado: formData.estado,
      };

      if (editingId) {
        await ascensoService.actualizar(personalId, editingId, datos);
        setSuccess('Ascenso actualizado correctamente');
      } else {
        await ascensoService.crear(personalId, datos);
        setSuccess('Ascenso registrado correctamente');
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detalles?.map(d => d.mensaje).join(', ') ||
          'Error al guardar el ascenso'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = ascenso => {
    setEditingId(ascenso.id);
    setFormData({
      fecha: new Date(ascenso.fecha),
      jerarquia: ascenso.jerarquia,
      resolucion: ascenso.resolucion || '',
      observaciones: ascenso.observaciones || '',
      estado: ascenso.estado,
    });
    setShowForm(true);
    setFormErrors({});
  };

  const handleEliminar = async () => {
    try {
      setDeleting(true);
      await ascensoService.eliminar(personalId, deletingId);
      setSuccess('Ascenso eliminado correctamente');
      setShowDeleteDialog(false);
      setDeletingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el ascenso');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: null,
      jerarquia: '',
      resolucion: '',
      observaciones: '',
      estado: 'VIGENTE',
    });
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = date => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR');
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
                  <Award className="inline w-8 h-8 mr-2 text-blue-600" />
                  Ascensos
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
                Registrar Ascenso
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
                  {editingId ? 'Editar Ascenso' : 'Registrar Nuevo Ascenso'}
                </CardTitle>
                <CardDescription>
                  Complete los datos del ascenso policial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fecha */}
                    <div className="space-y-2">
                      <Label className="dark:text-slate-300">Fecha *</Label>
                      <DatePicker
                        date={formData.fecha}
                        onSelect={date => {
                          setFormData(prev => ({ ...prev, fecha: date }));
                          setFormErrors(prev => ({ ...prev, fecha: null }));
                        }}
                        placeholder="Seleccionar fecha del ascenso"
                      />
                      {formErrors.fecha && (
                        <p className="text-sm text-red-500">
                          {formErrors.fecha}
                        </p>
                      )}
                    </div>

                    {/* Jerarquía a la que ascendió */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="jerarquia"
                        className="dark:text-slate-300"
                      >
                        Ascendió a *
                      </Label>
                      <Select
                        id="jerarquia"
                        value={formData.jerarquia}
                        onChange={e => {
                          setFormData(prev => ({
                            ...prev,
                            jerarquia: e.target.value,
                          }));
                          setFormErrors(prev => ({
                            ...prev,
                            jerarquia: null,
                          }));
                        }}
                        className={`dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 ${formErrors.jerarquia ? 'border-red-500' : ''}`}
                      >
                        <SelectItem value="">
                          Seleccionar jerarquía...
                        </SelectItem>
                        <optgroup label="Superiores">
                          {JERARQUIAS_SUPERIORES.map(j => (
                            <SelectItem key={j} value={j}>
                              {j}
                            </SelectItem>
                          ))}
                        </optgroup>
                        <optgroup label="Subalternos">
                          {JERARQUIAS_SUBALTERNAS.map(j => (
                            <SelectItem key={j} value={j}>
                              {j}
                            </SelectItem>
                          ))}
                        </optgroup>
                      </Select>
                      {formErrors.jerarquia && (
                        <p className="text-sm text-red-500">
                          {formErrors.jerarquia}
                        </p>
                      )}
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
                        <SelectItem value="VIGENTE">Vigente</SelectItem>
                        <SelectItem value="ANULADO">Anulado</SelectItem>
                      </Select>
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

        {/* Historial de Ascensos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Historial de Ascensos
              </CardTitle>
              <CardDescription>
                {pagination.total} ascenso(s) registrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ascensos.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <p className="text-gray-500 dark:text-slate-400 text-lg">
                    No hay ascensos registrados
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
                      Registrar primer ascenso
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">
                          Ascendió a
                        </TableHead>
                        <TableHead className="font-semibold">
                          Resolución
                        </TableHead>
                        <TableHead className="font-semibold">
                          Observaciones
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
                      {ascensos.map(ascenso => (
                        <TableRow
                          key={ascenso.id}
                          className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                        >
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {formatDate(ascenso.fecha)}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                            {ascenso.jerarquia}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                            {ascenso.resolucion || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate">
                            {ascenso.observaciones || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                ascenso.estado === 'VIGENTE'
                                  ? 'success'
                                  : 'danger'
                              }
                            >
                              {ascenso.estado}
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
                                    onClick={() => handleEditar(ascenso)}
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
                                      setDeletingId(ascenso.id);
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
                ¿Está seguro de que desea eliminar este ascenso? Esta acción
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

export default PersonalAscensos;
