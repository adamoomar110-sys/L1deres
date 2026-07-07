'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CreditCard, DollarSign, Clock, CheckCircle, Search, Calendar, 
  Filter, Trash2, RefreshCw, ChevronRight, TrendingUp, AlertCircle, FileSpreadsheet 
} from 'lucide-react';

export default function FacturacionAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [washFilter, setWashFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Consultar órdenes de servicio uniendo datos de vehículos
      const { data, error } = await supabase
        .from('service_orders')
        .select('*, vehicles(*)')
        .eq('provider_type', 'lubricentro')
        .ilike('description', '%[LAVADERO]%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'completed') => {
    if (!confirm(`¿Estás seguro de marcar esta orden como ${newStatus === 'completed' ? 'COBRADA' : 'PENDIENTE'}?`)) return;
    
    try {
      const { error } = await supabase
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar localmente
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('No se pudo actualizar el estado de la orden.');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este registro de facturación?')) return;
    
    try {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar localmente
      setOrders(orders.filter(o => o.id !== id));
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('No se pudo eliminar el registro.');
    }
  };

  // Filtrar órdenes en base a búsqueda, estado, tipo de lavado y fechas
  const filteredOrders = orders.filter(o => {
    // 1. Filtro de búsqueda (patente, descripción, apodo si existiera)
    const matchesSearch = 
      o.vehicles?.plate?.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase());

    // 2. Filtro de estado
    const matchesStatus = 
      statusFilter === 'all' || o.status === statusFilter;

    // 3. Filtro de tipo de lavado
    const matchesWash = 
      washFilter === 'all' || 
      o.description?.toLowerCase().includes(washFilter.toLowerCase());

    // 4. Filtro de rango de fechas
    let matchesDate = true;
    if (dateRange.from || dateRange.to) {
      const orderDate = new Date(o.created_at);
      orderDate.setHours(0,0,0,0);
      
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0,0,0,0);
        if (orderDate < fromDate) matchesDate = false;
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23,59,59,999);
        if (orderDate > toDate) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesWash && matchesDate;
  });

  // Métricas
  const totalRevenueCompleted = filteredOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.budget || 0), 0);

  const totalRevenuePending = filteredOrders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + Number(o.budget || 0), 0);

  const completedCount = filteredOrders.filter(o => o.status === 'completed').length;
  const totalCount = filteredOrders.length;
  const averageTicket = completedCount > 0 ? Math.round(totalRevenueCompleted / completedCount) : 0;

  // Porcentaje completado vs pendiente
  const totalFinancialValue = totalRevenueCompleted + totalRevenuePending;
  const percentCompleted = totalFinancialValue > 0 ? Math.round((totalRevenueCompleted / totalFinancialValue) * 100) : 0;

  // Tipos de lavado únicos para el filtro
  const washOptions = [
    { value: 'all', label: 'Todos los lavados' },
    { value: 'total', label: 'Combo Limpieza Total 🌀' },
    { value: 'gold', label: 'Combo VIP Gold 🏆' },
    { value: 'carroceria', label: 'Lavado Exterior Simple 🚗' },
    { value: 'aspirado', label: 'Aspirado e Interior Pro 💨' },
    { value: 'express', label: 'Lavado Express ⚡' },
    { value: 'motor', label: 'Limpieza de Motor a Vapor 🔥' },
    { value: 'encerado', label: 'Encerado Acrílico Sellador 🛡️' },
    { value: 'chasis', label: 'Limpieza de Chasis & Motor 🔩' },
    { value: 'opticas', label: 'Restauración de Ópticas 💡' },
    { value: 'ceramico', label: 'Tratamiento Cerámico 9H 💎' }
  ];

  return (
    <div className="flex flex-col h-full bg-orange-50 select-none">
      {/* HEADER DE FACTURACIÓN */}
      <header className="h-auto py-6 md:h-24 px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orange-200 bg-orange-100/50 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-black tracking-tighter flex items-center gap-3">
            <CreditCard className="text-orange-500" /> Facturación e Ingresos
          </h2>
          <p className="text-zinc-600 text-xs md:text-sm font-bold uppercase tracking-widest">
            Auditoría de Recaudaciones, Reportes y Análisis Financiero del Lavadero
          </p>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-orange-200 rounded-2xl hover:bg-orange-100/50 active:scale-95 transition-all text-xs font-black uppercase tracking-wider text-black self-start md:self-center shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${refreshing ? 'animate-spin' : ''}`} />
          Sincronizar
        </button>
      </header>

      {/* CORE CONTENIDO */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8 md:space-y-12">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-orange-400/20 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI METRICAS PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* TOTAL FACTURADO */}
              <div className="bg-white/80 backdrop-blur-xl border border-orange-200 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between h-40 group hover:border-lime-500/20 transition-all duration-300">
                <div className="absolute top-[-30%] right-[-10%] w-[120px] h-[120px] bg-lime-500/5 rounded-full blur-[30px]" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-lime-500/10 text-lime-600 rounded-xl flex items-center justify-center shadow-inner">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-[9px] text-lime-600 bg-lime-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Cobrado</span>
                </div>
                <div className="space-y-1 mt-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Total Recaudado</span>
                  <span className="text-3xl font-black text-black">${totalRevenueCompleted.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* FACTURACIÓN PENDIENTE */}
              <div className="bg-white/80 backdrop-blur-xl border border-orange-200 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between h-40 group hover:border-amber-500/20 transition-all duration-300">
                <div className="absolute top-[-30%] right-[-10%] w-[120px] h-[120px] bg-amber-500/5 rounded-full blur-[30px]" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Clock size={20} />
                  </div>
                  <span className="text-[9px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pendiente</span>
                </div>
                <div className="space-y-1 mt-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Facturación Activa</span>
                  <span className="text-3xl font-black text-orange-600">${totalRevenuePending.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* TICKET PROMEDIO */}
              <div className="bg-white/80 backdrop-blur-xl border border-orange-200 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between h-40 group hover:border-cyan-500/20 transition-all duration-300">
                <div className="absolute top-[-30%] right-[-10%] w-[120px] h-[120px] bg-cyan-500/5 rounded-full blur-[30px]" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-cyan-500/10 text-cyan-600 rounded-xl flex items-center justify-center shadow-inner">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-[9px] text-cyan-600 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Rendimiento</span>
                </div>
                <div className="space-y-1 mt-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Ticket Promedio</span>
                  <span className="text-3xl font-black text-black">${averageTicket.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* TRANSACCIONES COMPLETADAS */}
              <div className="bg-white/80 backdrop-blur-xl border border-orange-200 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex flex-col justify-between h-40 group hover:border-indigo-500/20 transition-all duration-300">
                <div className="absolute top-[-30%] right-[-10%] w-[120px] h-[120px] bg-indigo-500/5 rounded-full blur-[30px]" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                    <CheckCircle size={20} />
                  </div>
                  <span className="text-[9px] text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Volumen</span>
                </div>
                <div className="space-y-1 mt-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Servicios Cobrados / Total</span>
                  <span className="text-3xl font-black text-black">
                    {completedCount} <span className="text-sm font-semibold text-zinc-500">/ {totalCount}</span>
                  </span>
                </div>
              </div>

            </div>

            {/* GRAFICO DE PROGRESO Y CONVERSION FINANCIERA */}
            <div className="bg-white border border-orange-200 rounded-[2.5rem] p-8 shadow-md">
              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6">Eficiencia de Cobro</h3>
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-black uppercase">
                    <span>Avance Financiero Cobrado</span>
                    <span className="text-lime-600 font-black">{percentCompleted}%</span>
                  </div>
                  <div className="w-full h-4 bg-orange-100 rounded-full overflow-hidden border border-orange-200 shadow-inner flex">
                    <div 
                      className="h-full bg-gradient-to-r from-lime-500 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(132,204,22,0.5)]" 
                      style={{ width: `${percentCompleted}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2 block">
                    Total Facturado: ${totalFinancialValue.toLocaleString('es-AR')} (Cobrado + Pendiente)
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center gap-4 bg-orange-100/30 border border-orange-200 p-5 rounded-2xl">
                  <AlertCircle className="text-amber-500" size={24} />
                  <div>
                    <h4 className="text-xs font-black text-black uppercase tracking-tight">Facturación Pendiente por Cobrar</h4>
                    <p className="text-[10px] text-zinc-600 font-semibold mt-1">Hay ${totalRevenuePending.toLocaleString('es-AR')} que se acreditarán al finalizar los lavados en curso.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN MESA DE FILTROS */}
            <div className="bg-white border border-orange-200 rounded-[2.5rem] p-8 space-y-6 shadow-md">
              <h3 className="text-sm font-black text-black tracking-tight flex items-center gap-2">
                <Filter className="text-orange-500" /> Mesa de Filtros Financieros
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* BUSCADOR */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Buscar Patente / Detalle</label>
                  <div className="flex items-center bg-orange-50 border border-orange-200 px-4 py-3 rounded-2xl shadow-inner">
                    <Search className="text-zinc-500 shrink-0" size={16} />
                    <input 
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Ej: AA123BB..."
                      className="bg-transparent border-none focus:outline-none text-xs ml-3.5 w-full text-black placeholder-zinc-500"
                    />
                  </div>
                </div>

                {/* FILTRO ESTADO */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Estado Financiero</label>
                  <select 
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-orange-400 font-bold appearance-none"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="completed">Cobrado (Entregado)</option>
                    <option value="pending">Pendiente (En Fila)</option>
                  </select>
                </div>

                {/* FILTRO TIPO LAVADO */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Tipo de Lavado</label>
                  <select 
                    value={washFilter}
                    onChange={(e) => setWashFilter(e.target.value)}
                    className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-4 text-black text-xs outline-none focus:border-orange-400 font-bold appearance-none"
                  >
                    {washOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* DESDE */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Fecha Desde</label>
                  <div className="flex items-center bg-orange-50 border border-orange-200 px-4 py-3 rounded-2xl shadow-inner">
                    <Calendar className="text-zinc-500 shrink-0" size={16} />
                    <input 
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="bg-transparent border-none focus:outline-none text-xs ml-3 w-full text-black outline-none font-bold"
                    />
                  </div>
                </div>

                {/* HASTA */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Fecha Hasta</label>
                  <div className="flex items-center bg-orange-50 border border-orange-200 px-4 py-3 rounded-2xl shadow-inner">
                    <Calendar className="text-zinc-500 shrink-0" size={16} />
                    <input 
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="bg-transparent border-none focus:outline-none text-xs ml-3 w-full text-black outline-none font-bold"
                    />
                  </div>
                </div>

              </div>

              {/* Botón para resetear filtros si hay alguno configurado */}
              {(search || statusFilter !== 'all' || washFilter !== 'all' || dateRange.from || dateRange.to) && (
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('all');
                      setWashFilter('all');
                      setDateRange({ from: '', to: '' });
                    }}
                    className="text-[10px] text-orange-600 hover:text-black font-black uppercase tracking-wider flex items-center gap-1.5"
                  >
                    × Limpiar filtros de búsqueda
                  </button>
                </div>
              )}
            </div>

            {/* TABLA DE TRANSACCIONES */}
            <div className="bg-white border border-orange-200 rounded-[2.5rem] p-8 shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] px-2">Registro Operativo de Transacciones</h3>
                <span className="text-[10px] bg-orange-100 text-orange-600 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {filteredOrders.length} Resultados
                </span>
              </div>

              <div className="table-container border border-orange-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-100/30 border-b border-orange-200 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                      <th className="p-4 pl-6">Fecha / Hora</th>
                      <th className="p-4">Vehículo (Patente)</th>
                      <th className="p-4">Servicio / Descripción</th>
                      <th className="p-4">Monto Cobrado</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 pr-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-zinc-500 italic font-semibold text-sm">
                          Sin transacciones que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const dateStr = new Date(o.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        return (
                          <tr key={o.id} className="border-b border-orange-100 hover:bg-orange-50/20 text-xs font-bold text-black transition-colors">
                            <td className="p-4 pl-6 text-zinc-600 font-semibold">{dateStr}</td>
                            <td className="p-4">
                              <div>
                                <span className="plate-badge bg-orange-100/50 border-orange-200 text-black">{o.vehicles?.plate || 'SIN PATENTE'}</span>
                                <span className="ml-2 text-zinc-500 text-[10px] font-bold uppercase">
                                  {o.vehicles?.brand || ''} {o.vehicles?.model || ''}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-zinc-700 font-medium">
                              {o.description || 'Lavado de unidad'}
                            </td>
                            <td className="p-4 font-black text-black">
                              ${Number(o.budget || 0).toLocaleString('es-AR')}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                o.status === 'completed' 
                                  ? 'bg-lime-500/10 text-lime-600 border-lime-500/20 shadow-[0_0_6px_rgba(132,204,22,0.1)]' 
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}>
                                {o.status === 'completed' ? 'Cobrado' : 'Pendiente'}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right">
                              <div className="flex justify-end gap-2">
                                {o.status === 'pending' ? (
                                  <button 
                                    onClick={() => handleUpdateStatus(o.id, 'completed')}
                                    className="px-3 py-1.5 bg-lime-500 text-black rounded-lg hover:bg-lime-400 transition-colors text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                    title="Marcar como cobrado"
                                  >
                                    Cobrar
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateStatus(o.id, 'pending')}
                                    className="px-3 py-1.5 bg-white border border-orange-200 text-zinc-700 rounded-lg hover:bg-orange-100/50 transition-colors text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                    title="Volver a pendiente"
                                  >
                                    Devolver
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteOrder(o.id)}
                                  className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar registro"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
