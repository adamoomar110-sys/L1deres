'use client';
import { Wrench } from 'lucide-react';
import ServicePortal from '@/components/ServicePortal';
import type { ServicePortalConfig } from '@/lib/types';

const tallerConfig: ServicePortalConfig = {
  moduleName: 'TALLER',
  title: 'PANEL TALLERISTA',
  subtitle: 'Spinaz Garage Services',
  providerType: 'taller',
  vehicleFilter: 'maintenance',
  chatModule: 'TALLER',
  chatAccent: 'yellow',
  sectionTitle: 'Unidades Asignadas',
  emptyMessage: 'Sin trabajos pendientes',
  actionButtonText: 'GESTIONAR TURNO',
  finishButtonText: 'FINALIZAR TRABAJO Y LIBERAR UNIDAD',
  editSectionTitle: 'Actualizar Servicio Actual',
  updateButtonText: 'Actualizar Presupuesto / Turno',
  announcementPrefix: 'TRABAJO FINALIZADO',
  announcementContent: (plate) => `El taller ha finalizado el trabajo en la unidad ${plate}. Ya se encuentra disponible para circular.`,
  icon: Wrench,
  drawerIcon: Wrench,
  colors: {
    accent: 'yellow',
    gradient: 'from-yellow-400 to-yellow-600',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    text: 'text-yellow-500',
    shadow: 'shadow-yellow-500/20',
    orb: 'bg-yellow-500/5',
    borderTop: 'border-t-yellow-500',
    hoverBg: 'bg-yellow-500/10',
    hoverText: 'text-yellow-500',
    focusBorder: 'focus:border-yellow-500',
    spinnerBorder: 'border-yellow-500/20',
    spinnerTop: 'border-t-yellow-500',
    badge: 'bg-yellow-500 text-black',
    actionBtn: 'bg-white text-black hover:bg-yellow-500',
    updateBtn: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/30',
  },
};

export default function TallerPortal() {
  return <ServicePortal config={tallerConfig} />;
}
