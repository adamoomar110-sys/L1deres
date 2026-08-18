'use client';
import { Waves } from 'lucide-react';
import ServicePortal from '@/components/ServicePortal';
import type { ServicePortalConfig } from '@/lib/types';

const lavaderoConfig: ServicePortalConfig = {
  moduleName: 'LAVADERO',
  title: 'PANEL LAVADERO',
  subtitle: 'Spinaz Garage Services',
  providerType: 'lavadero',
  vehicleFilter: 'lavadero',
  chatModule: 'LAVADERO',
  chatAccent: 'cyan',
  sectionTitle: 'Unidades para Lavado',
  emptyMessage: 'Sin lavados pendientes',
  actionButtonText: 'INICIAR LAVADO',
  finishButtonText: 'FINALIZAR LAVADO Y LIBERAR UNIDAD',
  editSectionTitle: 'Detalles del Lavado',
  updateButtonText: 'Actualizar Turno / Costo Lavado',
  announcementPrefix: 'LAVADO FINALIZADO',
  announcementContent: (plate) => `El lavadero ha finalizado la limpieza de la unidad ${plate}. Ya se encuentra disponible para circular.`,
  icon: Waves,
  drawerIcon: Waves,
  colors: {
    accent: 'cyan',
    gradient: 'from-cyan-400 to-cyan-600',
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/20',
    text: 'text-cyan-500',
    shadow: 'shadow-cyan-500/20',
    orb: 'bg-cyan-500/5',
    borderTop: 'border-t-cyan-500',
    hoverBg: 'bg-cyan-500/10',
    hoverText: 'text-cyan-500',
    focusBorder: 'focus:border-cyan-500',
    spinnerBorder: 'border-cyan-500/20',
    spinnerTop: 'border-t-cyan-500',
    badge: 'bg-cyan-500 text-black',
    actionBtn: 'bg-white text-black hover:bg-cyan-500',
    updateBtn: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/30',
  },
};

export default function LavaderoPortal() {
  return <ServicePortal config={lavaderoConfig} />;
}
