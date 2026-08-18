'use client';
import { Droplets } from 'lucide-react';
import ServicePortal from '@/components/ServicePortal';
import type { ServicePortalConfig } from '@/lib/types';

const lubricentroConfig: ServicePortalConfig = {
  moduleName: 'LUBRICENTRO',
  title: 'PORTAL LUBRICENTRO',
  subtitle: 'Mantenimiento Preventivo Spinaz',
  providerType: 'lubricentro',
  vehicleFilter: 'lubricentro',
  chatModule: 'LUBRICENTRO',
  chatAccent: 'blue',
  sectionTitle: 'Vehículos en Fila',
  emptyMessage: 'Todo al día',
  actionButtonText: 'AGENDAR SERVICE',
  finishButtonText: 'FINALIZAR SERVICE Y LIBERAR UNIDAD',
  editSectionTitle: 'Programar Aceite y Filtros',
  updateButtonText: 'Actualizar Costo / Turno',
  announcementPrefix: 'SERVICE FINALIZADO',
  announcementContent: (plate) => `El lubricentro ha finalizado el service en la unidad ${plate}. Ya se encuentra disponible para circular.`,
  icon: Droplets,
  drawerIcon: Droplets,
  colors: {
    accent: 'blue',
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    shadow: 'shadow-blue-500/20',
    orb: 'bg-blue-500/5',
    borderTop: 'border-t-blue-500',
    hoverBg: 'bg-blue-500/10',
    hoverText: 'text-blue-500',
    focusBorder: 'focus:border-blue-500',
    spinnerBorder: 'border-blue-500/20',
    spinnerTop: 'border-t-blue-500',
    badge: 'bg-blue-500 text-white',
    actionBtn: 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20',
    updateBtn: 'bg-blue-500/20 text-blue-400 border-blue-500/20 hover:bg-blue-500/30',
  },
};

export default function LubricentroPortal() {
  return <ServicePortal config={lubricentroConfig} />;
}
