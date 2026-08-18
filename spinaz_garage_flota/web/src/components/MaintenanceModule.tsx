'use client';

import { useState } from 'react';
import { Plus, Fuel, Wrench, Clipboard, DollarSign } from 'lucide-react';

export default function MaintenanceModule() {
  const [logs, setLogs] = useState([
    { id: 1, vehicle: 'Camión #402', type: 'Carga Nafta', cost: 120.50, date: '2026-04-20', odometer: '45.200 km' },
    { id: 2, vehicle: 'Furgoneta #12', type: 'Cambio de Aceite', cost: 85.00, date: '2026-04-18', odometer: '12.100 km' },
  ]);

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Mantenimiento y Gastos</h2>
          <p className="text-sm text-zinc-500">Registros históricos de la flota</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors">
          <Plus size={18} />
          <span>Nuevo Registro</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500 text-sm">
              <th className="pb-4 font-medium">Vehículo</th>
              <th className="pb-4 font-medium">Tipo</th>
              <th className="pb-4 font-medium">Costo</th>
              <th className="pb-4 font-medium">Kilometraje</th>
              <th className="pb-4 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 font-medium text-zinc-200">{log.vehicle}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {log.type.includes('Carga') ? <Fuel size={14} className="text-blue-500" /> : <Wrench size={14} className="text-yellow-500" />}
                    <span>{log.type}</span>
                  </div>
                </td>
                <td className="py-4 text-zinc-200">${log.cost.toFixed(2)}</td>
                <td className="py-4 text-zinc-400">{log.odometer}</td>
                <td className="py-4 text-zinc-400">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
