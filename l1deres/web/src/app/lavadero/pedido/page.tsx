'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Waves, Car, Wind, Flame, Shield, ShoppingCart, Check, X, 
  ArrowRight, Palette, User, Info, ChevronRight, Loader2, Droplets, Zap, Wrench 
} from 'lucide-react';

interface WashPackage {
  id: string;
  name: string;
  category: 'combos' | 'lavados' | 'estetica';
  price: number;
  description: string;
  features: string[];
  icon: any;
  color: string;
  bgGradient: string;
}

const WASH_PACKAGES: WashPackage[] = [
  {
    id: 'combo-vip-gold',
    name: 'Combo VIP Gold 🏆',
    category: 'combos',
    price: 25000,
    description: 'El tratamiento premium definitivo para tu vehículo, tanto interior como exterior.',
    features: [
      'Lavado artesanal pH neutro premium',
      'Descontaminado de pintura y cristales',
      'Encerado de Carnauba Premium brasileña',
      'Aspirado interior ultra-profundo con vapor',
      'Acondicionamiento de plásticos y cueros',
      'Perfumado premium de larga duración'
    ],
    icon: Sparkles,
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/20 via-yellow-600/10 to-transparent border-amber-500/30'
  },
  {
    id: 'combo-limpieza-total',
    name: 'Combo Limpieza Total 🌀',
    category: 'combos',
    price: 18000,
    description: 'Limpieza profunda estándar que devuelve el brillo a tu carrocería e interiores.',
    features: [
      'Lavado exterior con espuma activa',
      'Aspirado completo de alfombras y butacas',
      'Limpieza y abrillantado de llantas',
      'Limpieza interior de cristales y pantallas',
      'Perfumado clásico Lavadero De Luxe'
    ],
    icon: Waves,
    color: 'text-cyan-500',
    bgGradient: 'from-cyan-500/20 via-blue-600/10 to-transparent border-cyan-500/30'
  },
  {
    id: 'lavado-carroceria',
    name: 'Lavado Exterior Simple 🚗',
    category: 'lavados',
    price: 12000,
    description: 'Lavado rápido y seguro de carrocería para lucir el auto limpio de inmediato.',
    features: [
      'Lavado con shampoo pH balanceado',
      'Secado a mano con microfibras premium',
      'Limpieza exterior de vidrios',
      'Acondicionado de neumáticos (brillo)'
    ],
    icon: Car,
    color: 'text-slate-400',
    bgGradient: 'from-slate-400/20 via-zinc-600/10 to-transparent border-slate-400/30'
  },
  {
    id: 'aspirado-interior',
    name: 'Aspirado e Interior Pro 💨',
    category: 'lavados',
    price: 10000,
    description: 'Limpieza concentrada en el habitáculo del conductor para mayor frescura y confort.',
    features: [
      'Aspirado completo de paneles, butacas y baúl',
      'Desinfección de superficies de contacto',
      'Limpieza interna de vidrios y parabrisas',
      'Acondicionado satinado no graso para plásticos'
    ],
    icon: Wind,
    color: 'text-purple-400',
    bgGradient: 'from-purple-400/20 via-violet-600/10 to-transparent border-purple-400/30'
  },
  {
    id: 'lavado-motor',
    name: 'Limpieza de Motor a Vapor 🔥',
    category: 'estetica',
    price: 15000,
    description: 'Remoción de grasas acumuladas y protección de los circuitos eléctricos del motor.',
    features: [
      'Limpieza técnica a vapor de baja humedad',
      'Desengrasantes biodegradables importados',
      'Acondicionamiento y nutrición de mangueras',
      'Protector dieléctrico para plásticos de motor'
    ],
    icon: Flame,
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 via-red-600/10 to-transparent border-orange-500/30'
  },
  {
    id: 'encerado-acrilico',
    name: 'Encerado Acrílico Sellador 🛡️',
    category: 'estetica',
    price: 22000,
    description: 'Tratamiento de pintura manual que protege el vehículo contra rayos UV y suciedad por meses.',
    features: [
      'Lavado artesanal descontaminante',
      'Aplicación manual de cera selladora acrílica',
      'Efecto hidrofóbico extremo (repele agua)',
      'Aumento inmediato del brillo y suavidad de pintura'
    ],
    icon: Shield,
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 via-green-600/10 to-transparent border-emerald-500/30'
  },
  {
    id: 'lavado-express',
    name: 'Lavado Express ⚡',
    category: 'lavados',
    price: 8000,
    description: 'Lavado rápido de carrocería (agua a presión y shampoo rápido), ideal si estás con prisa.',
    features: [
      'Lavado exterior express a presión',
      'Secado rápido con soplador',
      'Brillo básico de cubiertas'
    ],
    icon: Zap,
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-400/20 via-amber-600/10 to-transparent border-yellow-400/30'
  },
  {
    id: 'lavado-chasis',
    name: 'Limpieza de Chasis & Motor 🔩',
    category: 'estetica',
    price: 28000,
    description: 'Lavado a fondo de la parte inferior del auto y motor a vapor para remover grasas pesadas y salitre.',
    features: [
      'Limpieza inferior de chasis a presión',
      'Desengrasado pesado con vapor a 140°C',
      'Aplicación de protector antioxidante metal'
    ],
    icon: Wrench,
    color: 'text-indigo-400',
    bgGradient: 'from-indigo-400/20 via-blue-600/10 to-transparent border-indigo-400/30'
  },
  {
    id: 'pulido-opticas',
    name: 'Restauración de Ópticas 💡',
    category: 'estetica',
    price: 16000,
    description: 'Pulido y sellado cerámico de faros delanteros opacos o amarillentos para recuperar la visibilidad original.',
    features: [
      'Lijado al agua multietapa (grano 1000 a 3000)',
      'Pulido rotativo de policarbonato con compuesto fino',
      'Aplicación de sellador protector UV de ópticas'
    ],
    icon: Sparkles,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-400/20 via-sky-600/10 to-transparent border-cyan-400/30'
  },
  {
    id: 'tratamiento-ceramico',
    name: 'Tratamiento Cerámico 9H 💎',
    category: 'estetica',
    price: 65000,
    description: 'Sellado cerámico de alta gama que brinda protección extrema de brillo espejo y repelencia al agua por hasta 2 años.',
    features: [
      'Corrección de pintura en 2 etapas (eliminación de rayas)',
      'Descontaminado físico y químico de carrocería',
      'Aplicación de sellador cerámico premium 9H',
      'Efecto hidrofóbico y protección UV extrema'
    ],
    icon: Shield,
    color: 'text-rose-400',
    bgGradient: 'from-rose-400/20 via-pink-600/10 to-transparent border-rose-400/30'
  }
];

const PREDEFINED_COLORS = [
  { name: 'Cyan Neon', hex: '#00f0ff' },
  { name: 'Verde Limón', hex: '#84cc16' },
  { name: 'Oro / Amarillo', hex: '#ffb800' },
  { name: 'Azul Eléctrico', hex: '#3b82f6' },
  { name: 'Rojo Furia', hex: '#ef4444' },
  { name: 'Violeta Retro', hex: '#a855f7' },
  { name: 'Naranja Fuego', hex: '#f97316' },
  { name: 'Rosa Pastel', hex: '#ec4899' },
  { name: 'Blanco Puro', hex: '#ffffff' },
  { name: 'Gris Oscuro', hex: '#1c1c1e' }
];

export default function PedidoClienteKiosco() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<'combos' | 'lavados' | 'estetica'>('combos');
  const [selectedPackage, setSelectedPackage] = useState<WashPackage | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulario
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [selectedColor, setSelectedColor] = useState('#00f0ff');
  const [nickname, setNickname] = useState('');

  const handleSelectPackage = (pack: WashPackage) => {
    setSelectedPackage(pack);
    // Generar apodo aleatorio por defecto si está vacío
    if (!nickname) {
      const nombres = ["Rayo", "Toro", "Halcón", "Puma", "Tigre", "Furia", "Centella", "Ciclón", "Relámpago"];
      const randName = nombres[Math.floor(Math.random() * nombres.length)];
      setNickname(randName);
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !plate.trim() || !nickname.trim()) {
      alert('Por favor completa los campos requeridos (Patente y Apodo)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/lavadero/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: plate,
          brand: brand || 'Desconocido',
          model: model || 'Desconocido',
          color: selectedColor,
          nickname: nickname,
          washType: selectedPackage.name,
          price: selectedPackage.price,
          description: selectedPackage.description
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Guardar pedido localmente
        localStorage.setItem('lavadero_last_plate', data.plate);
        localStorage.setItem('lavadero_last_queue_id', data.queue_id);
        localStorage.setItem('lavadero_last_nickname', data.nickname);
        localStorage.setItem('lavadero_last_color', data.color);

        // Redirigir a tracking
        router.push(`/lavadero/pedido/tracking?id=${data.queue_id}&plate=${data.plate}`);
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear el pedido'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al enviar el pedido');
    }
    setLoading(false);
  };

  const filteredPackages = WASH_PACKAGES.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-orange-50 text-black font-sans relative flex flex-col justify-between selection:bg-orange-400 selection:text-black">
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-orange-300/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-cyan-600/5 rounded-full blur-[110px] pointer-events-none z-0" />

      {/* HEADER TIPO MCDONALDS */}
      <header className="relative z-10 bg-white/60 backdrop-blur-md border-b border-orange-200 sticky top-0 py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Droplets className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">LAVADERO VIP</h1>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.25em] mt-1">Autoservicio Móvil Express</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-orange-400/10 px-4 py-2 rounded-full border border-orange-400/20 text-orange-600 text-xs font-black uppercase">
          <span>MENÚ DIGITAL EN LÍNEA</span>
          <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
        </div>
      </header>

      {/* CORE CONTENIDO */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
        
        {/* Banner promocional */}
        <section className="bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border border-orange-400/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px]" />
          <div className="space-y-4 max-w-xl">
            <span className="bg-orange-400 text-black font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest">PROCESO GAMIFICADO 🎮</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight italic">Elegí tu lavado y seguí tu auto en el "Arcade" 🏁</h2>
            <p className="text-zinc-400 text-sm font-medium">Al confirmar el lavado, tu coche aparecerá pintado del color que elijas y con tu apodo en las pantallas gigantes del local. ¡Seguí el lavado paso a paso!</p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
             <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center animate-bounce">
                <Car size={32} className="text-orange-400" />
             </div>
          </div>
        </section>

        {/* NAVEGACIÓN DE CATEGORÍAS (TIPO MCDONALDS) */}
        <nav className="flex justify-center border-b border-orange-200 pb-2 overflow-x-auto whitespace-nowrap scrollbar-none gap-2">
          {(['combos', 'lavados', 'estetica'] as const).map((cat) => (
            <button
              key={cat}
              id={`cat-btn-${cat}`}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-orange-400 text-black shadow-lg shadow-orange-500/20 border border-orange-400'
                  : 'bg-white border border-orange-200 text-zinc-700 hover:bg-orange-100/50'
              }`}
            >
              {cat === 'combos' ? '🏆 Combos VIP' : cat === 'lavados' ? '🧼 Lavados' : '✨ Estética & Motor'}
            </button>
          ))}
        </nav>

        {/* TARJETAS DE PAQUETES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPackages.map((pack) => {
              const PackIcon = pack.icon;
              const isSelected = selectedPackage?.id === pack.id;
              return (
                <motion.div
                  key={pack.id}
                  layoutId={pack.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white border-2 rounded-[2.5rem] p-6 hover:shadow-2xl hover:border-orange-400/40 transition-all flex flex-col justify-between relative overflow-hidden group shadow-xl ${
                    isSelected ? 'border-orange-400 ring-4 ring-orange-400/10' : 'border-orange-200'
                  }`}
                >
                  {/* Gradiente de fondo del item */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${pack.bgGradient} pointer-events-none z-0`} />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className={`p-4 bg-orange-100 rounded-2xl ${pack.color}`}>
                        <PackIcon size={24} />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Precio Final</span>
                        <p className="text-2xl font-black text-black">${pack.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-black tracking-tight">{pack.name}</h3>
                      <p className="text-zinc-600 text-xs font-semibold leading-relaxed">{pack.description}</p>
                    </div>

                    {/* Detalles */}
                    <div className="pt-4 border-t border-orange-200 space-y-2.5">
                      {pack.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-[11px] text-zinc-700 font-bold uppercase">
                          <Check size={12} className="text-lime-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 pt-6 mt-6 border-t border-orange-100">
                    <button
                      id={`select-btn-${pack.id}`}
                      onClick={() => handleSelectPackage(pack)}
                      className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-lime-500 text-black hover:bg-lime-400' 
                          : 'bg-zinc-950 text-white hover:bg-orange-400 hover:text-black shadow-lg shadow-black/10'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={16} /> SELECCIONADO
                        </>
                      ) : (
                        <>
                          AGREGAR AL PEDIDO <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* BARRA FLOTANTE DE CHECKOUT */}
      {selectedPackage && (
        <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-orange-200 p-6 z-50 shadow-2xl flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto w-full md:rounded-t-[2.5rem] gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-400 text-black rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-wider">Tu servicio seleccionado</p>
              <h4 className="text-md font-black text-black uppercase tracking-tight">{selectedPackage.name} (${selectedPackage.price.toLocaleString()})</h4>
            </div>
          </div>

          <button
            id="checkout-btn"
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full md:w-auto px-10 py-4.5 bg-lime-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-lime-400 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-lime-500/20 active:scale-95"
          >
            CONFIRMAR MIS DATOS <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* MODAL DE CHECKOUT Y CONFIGURACIÓN DEL AUTO */}
      {isCheckoutOpen && selectedPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="bg-white border-2 border-orange-200 w-full max-w-lg rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 md:p-8 border-b border-orange-200 flex justify-between items-start bg-orange-100/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-400 text-black rounded-xl flex items-center justify-center">
                  <Car size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black tracking-tight uppercase leading-none">Datos del Vehículo</h3>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">Configuración para el juego virtual</p>
                </div>
              </div>
              <button 
                id="close-modal-btn"
                onClick={() => setIsCheckoutOpen(false)} 
                className="w-8 h-8 rounded-xl bg-white hover:bg-orange-100 flex items-center justify-center border border-orange-200 text-zinc-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              
              {/* PATENTE */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Patente (Patente Obligatoria) *</label>
                <input
                  id="input-plate"
                  type="text"
                  required
                  placeholder="AA123BB o AAA123"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  className="w-full bg-orange-100/30 border border-orange-200 rounded-xl p-4 text-black text-sm font-black tracking-widest outline-none focus:border-orange-400 uppercase placeholder-zinc-600"
                />
              </div>

              {/* MARCA Y MODELO */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Marca</label>
                  <input
                    id="input-brand"
                    type="text"
                    placeholder="Toyota, Ford, etc."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-orange-100/30 border border-orange-200 rounded-xl p-4 text-black text-sm font-bold outline-none focus:border-orange-400 placeholder-zinc-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2">Modelo</label>
                  <input
                    id="input-model"
                    type="text"
                    placeholder="Corolla, Fiesta, etc."
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-orange-100/30 border border-orange-200 rounded-xl p-4 text-black text-sm font-bold outline-none focus:border-orange-400 placeholder-zinc-600"
                  />
                </div>
              </div>

              {/* COLOR EN JUEGO RETRO */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 flex items-center gap-1.5">
                  <Palette size={12} className="text-orange-500" /> Color en Pantalla Gigante *
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  {PREDEFINED_COLORS.map((col) => {
                    const isColSelected = selectedColor === col.hex;
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        id={`color-btn-${col.hex.replace('#', '')}`}
                        onClick={() => setSelectedColor(col.hex)}
                        title={col.name}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                          isColSelected 
                            ? 'border-black ring-4 ring-orange-400/30 scale-110 shadow-lg' 
                            : 'border-zinc-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isColSelected && (
                          <Check size={16} className={col.hex === '#ffffff' ? 'text-black' : 'text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]'} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* APODO PARA EL JUEGO */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-2 flex items-center gap-1.5">
                  <User size={12} className="text-orange-500" /> Apodo del Auto (Para el Juego) *
                </label>
                <input
                  id="input-nickname"
                  type="text"
                  required
                  maxLength={15}
                  placeholder="Ej: Furia, Rayo, Nave"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-orange-100/30 border border-orange-200 rounded-xl p-4 text-black text-sm font-black uppercase tracking-tight outline-none focus:border-orange-400 placeholder-zinc-600"
                />
                <span className="text-[9px] text-zinc-600 font-bold uppercase block pl-2">Aparecerá arriba de tu auto en el circuito virtual.</span>
              </div>

              {/* RESUMEN DE COMPRA */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Detalle de Compra</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">{selectedPackage.name}</h4>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">Ingresará a Zona de Espera</p>
                  </div>
                  <span className="text-lg font-black text-orange-400">${selectedPackage.price.toLocaleString()}</span>
                </div>
              </div>

              {/* BOTONES DE CONTROL */}
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  id="cancel-modal-btn"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-4 bg-orange-100 border border-orange-200 text-zinc-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-orange-200 transition-all cursor-pointer"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  id="submit-order-btn"
                  disabled={loading}
                  className="flex-1 py-4 bg-lime-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-lime-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-lime-500/25 disabled:bg-lime-600/50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> PROCESANDO...
                    </>
                  ) : (
                    <>
                      INICIAR LAVADO ➔
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* FOOTER GENERAL OMAR */}
      <footer className="relative z-10 py-10 bg-white/40 border-t border-orange-200 text-center space-y-3 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-zinc-600 font-bold">
          © 2026 Omar Adamo. Todos los derechos reservados.
        </p>
        <div className="flex justify-center gap-4 text-[9px] text-zinc-600 font-medium">
          <a href="mailto:adamoomar110@gmail.com" className="hover:text-orange-500 transition-colors">Email</a>
          <span>•</span>
          <a href="https://wa.me/5491178295317" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">WhatsApp</a>
          <span>•</span>
          <span className="text-zinc-600 font-black">v1.5</span>
        </div>
      </footer>
    </div>
  );
}
