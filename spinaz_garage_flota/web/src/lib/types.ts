// Tipos centralizados del proyecto Spinaz Garage

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  status: 'active' | 'maintenance' | 'lubricentro' | 'inactive';
  driver_id?: string;
  metrics?: Record<string, unknown>;
  created_at?: string;
}

export interface ServiceOrder {
  id: string;
  vehicle_id: string;
  provider_type: 'taller' | 'lubricentro' | 'lavadero';
  status: 'pending' | 'completed' | 'cancelled';
  description?: string;
  budget?: number;
  appointment_date?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'developer' | 'driver' | 'gestor' | 'mechanic' | 'lubricentro' | 'lavadero';
  vehicle_id?: string;
  vehicles?: Vehicle;
  metrics?: Record<string, unknown>;
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  driver_id?: string;
  created_at: string;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  discount_code?: string;
  is_active: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel: string;
  sender: string;
  message: string;
  created_at: string;
}

// Configuración para el componente ServicePortal reutilizable
export interface ServicePortalConfig {
  moduleName: string;           // 'TALLER' | 'LUBRICENTRO' | 'LAVADERO'
  title: string;                // 'PANEL TALLERISTA'
  subtitle: string;             // 'Spinaz Garage Services'
  providerType: string;         // 'taller' | 'lubricentro' | 'lavadero'
  vehicleFilter: string;        // 'maintenance' | 'lubricentro'
  chatModule: string;           // Módulo para el chat
  chatAccent: string;           // Color del chat
  sectionTitle: string;         // 'Unidades Asignadas'
  emptyMessage: string;         // 'Sin trabajos pendientes'
  actionButtonText: string;     // 'GESTIONAR TURNO'
  finishButtonText: string;     // 'FINALIZAR TRABAJO Y LIBERAR UNIDAD'
  editSectionTitle: string;     // 'Actualizar Servicio Actual'
  updateButtonText: string;     // 'Actualizar Presupuesto / Turno'
  announcementPrefix: string;   // 'TRABAJO FINALIZADO'
  announcementContent: (plate: string) => string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  drawerIcon: React.ComponentType<{ size?: number; className?: string }>;
  colors: {
    accent: string;             // 'yellow' | 'cyan' | 'blue'
    gradient: string;           // 'from-yellow-400 to-yellow-600'
    bg: string;                 // 'bg-yellow-500/5'
    border: string;             // 'border-yellow-500/20'
    text: string;               // 'text-yellow-500'
    shadow: string;             // 'shadow-yellow-500/20'
    orb: string;                // 'bg-yellow-500/5'
    borderTop: string;          // 'border-t-yellow-500'
    hoverBg: string;            // 'bg-yellow-500/10'
    hoverText: string;          // 'text-yellow-500'
    focusBorder: string;        // 'focus:border-yellow-500'
    spinnerBorder: string;      // 'border-yellow-500/20'
    spinnerTop: string;         // 'border-t-yellow-500'
    badge: string;              // 'bg-yellow-500 text-black'
    actionBtn: string;          // 'bg-white text-black hover:bg-yellow-500'
    updateBtn: string;          // 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/30'
  };
}
