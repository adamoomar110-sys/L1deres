'use client';
import { useState } from 'react';
import { Car, UploadCloud, FileText, User, MapPin, CheckCircle, AlertTriangle, Briefcase, ShieldCheck, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Footer from '@/components/Footer';

export default function PostulationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    dni: '',
    phone: '',
    age: '',
    zone: '',
    app_experience: '',
    accident_history: '',
    has_professional_license: false,
    can_pay_advance: false,
    accepted_terms: false,
  });

  const [files, setFiles] = useState<Record<string, File | null>>({
    dni_front: null,
    dni_back: null,
    license: null,
    selfie: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${formData.dni}_${folder}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('applicants-documents')
      .upload(filePath, file);

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('applicants-documents')
      .getPublicUrl(filePath);
      
    return publicUrl;
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Upload files first
      const fileUrls: Record<string, string> = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          fileUrls[key] = await uploadFile(file, key);
        }
      }

      // 2. Insert into database
      const { error } = await supabase
        .from('applicants')
        .insert([{
          full_name: formData.full_name,
          dni: formData.dni,
          phone: formData.phone,
          age: parseInt(formData.age),
          zone: formData.zone,
          app_experience: formData.app_experience,
          accident_history: formData.accident_history,
          has_professional_license: formData.has_professional_license,
          can_pay_advance: formData.can_pay_advance,
          dni_front_url: fileUrls.dni_front,
          dni_back_url: fileUrls.dni_back,
          license_url: fileUrls.license,
          selfie_url: fileUrls.selfie,
          status: 'pending'
        }]);
        
      if (error) throw error;

      // 3. Notify via API (Module 1, Task 3 will implement this)
      await fetch('/api/applicants/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: 'admin@spinazgarage.com', // Placeholder for now
            applicant_name: formData.full_name,
            dni: formData.dni
        })
      }).catch(() => console.log('Notification API not yet implemented'));

      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert(`Error al enviar la postulación: ${error.message || 'Reintentá en unos minutos.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900/50 border border-white/10 rounded-[3rem] p-10 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">¡Postulación Recibida!</h2>
          <p className="text-zinc-400 mb-8 font-medium leading-relaxed">
            Tu perfil ha ingresado a nuestro sistema de evaluación. Un responsable de <strong>Spinaz Garage</strong> revisará tu documentación.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl text-xs text-yellow-500 font-bold uppercase tracking-widest leading-relaxed">
            Te contactaremos vía WhatsApp únicamente si tu perfil es pre-seleccionado para una entrevista presencial.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col font-sans selection:bg-yellow-500 selection:text-black">
      <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="h-24 border-b border-white/5 flex items-center justify-center bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Car className="text-black" size={28} />
          </div>
          <h1 className="font-black text-2xl tracking-tighter italic">SPINAZ GARAGE</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10">
        <div className="max-w-2xl w-full">
          
          <div className="text-center mb-12">
            <span className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4 block">Reclutamiento Oficial</span>
            <h2 className="text-4xl lg:text-6xl font-black mb-4 tracking-tighter leading-none">
              ¿QUERÉS MANEJAR CON NOSOTROS?
            </h2>
            <p className="text-zinc-500 font-bold text-sm lg:text-lg uppercase tracking-widest">
              Sumate a la flota líder. Nivel Empresa.
            </p>
          </div>

          <form onSubmit={submitApplication} className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 lg:p-12 shadow-3xl">
            
            {/* PROGRESS BAR */}
            <div className="flex gap-2 mb-12">
               {[1, 2, 3].map(i => (
                 <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-white/5'}`} />
               ))}
            </div>

            {/* Step 1: Datos Personales */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <User className="text-yellow-500" size={20} />
                  <h3 className="text-xl font-black uppercase tracking-tight">1. Datos Personales</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Nombre Completo</label>
                    <input required type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:border-yellow-500 outline-none transition-all font-bold" placeholder="Juan Pérez" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">DNI</label>
                    <input required type="number" name="dni" value={formData.dni} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:border-yellow-500 outline-none transition-all font-bold" placeholder="Sin puntos" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Teléfono (WhatsApp)</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:border-yellow-500 outline-none transition-all font-bold" placeholder="11 1234 5678" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Edad</label>
                    <input required type="number" name="age" value={formData.age} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:border-yellow-500 outline-none transition-all font-bold" placeholder="Mínimo 21" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Zona de Residencia</label>
                    <input required type="text" name="zone" value={formData.zone} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:border-yellow-500 outline-none transition-all font-bold" placeholder="Barrio y Localidad" />
                  </div>
                </div>

                <button type="button" onClick={() => setStep(2)} className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl shadow-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2">
                  CONTINUAR <CheckCircle size={18} />
                </button>
              </div>
            )}

            {/* Step 2: Experiencia y Documentación */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <Briefcase className="text-yellow-500" size={20} />
                  <h3 className="text-xl font-black uppercase tracking-tight">2. Perfil y Fotos</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">¿Experiencia en Apps (Uber, Cabify, etc)?</label>
                    <textarea required name="app_experience" value={formData.app_experience} onChange={handleInputChange} rows={2} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 outline-none focus:border-yellow-500 text-sm font-medium resize-none" placeholder="Contanos tu experiencia manejando..."></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">Antecedentes de Siniestros</label>
                    <textarea required name="accident_history" value={formData.accident_history} onChange={handleInputChange} rows={2} className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 outline-none focus:border-yellow-500 text-sm font-medium resize-none" placeholder="Choques o problemas mecánicos previos..."></textarea>
                  </div>

                  {/* Upload Grid */}
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { id: 'dni_front', label: 'DNI FRENTE', icon: FileText },
                        { id: 'dni_back', label: 'DNI DORSO', icon: FileText },
                        { id: 'license', label: 'REGISTRO', icon: ShieldCheck },
                        { id: 'selfie', label: 'SELFIE', icon: User },
                     ].map(file => (
                        <div key={file.id} className="relative bg-black/40 border border-white/5 border-dashed rounded-2xl p-4 text-center hover:border-yellow-500/50 transition-colors group cursor-pointer overflow-hidden">
                           <input type="file" required onChange={(e) => handleFileChange(e, file.id)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                           <file.icon className={`mx-auto mb-2 ${files[file.id] ? 'text-green-500' : 'text-zinc-600'}`} size={20} />
                           <span className="text-[8px] font-black uppercase tracking-widest block text-zinc-400">{files[file.id] ? 'CARGADO' : file.label}</span>
                        </div>
                     ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white/5 text-zinc-500 font-black py-5 rounded-2xl">VOLVER</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-yellow-500 text-black font-black py-5 rounded-2xl shadow-xl">SIGUIENTE PASO</button>
                </div>
              </div>
            )}

            {/* Step 3: Condiciones Finales */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-yellow-500" size={20} />
                  <h3 className="text-xl font-black uppercase tracking-tight">3. Condiciones de Flota</h3>
                </div>

                <div className="bg-black/50 border border-white/5 rounded-[2rem] p-6 space-y-6 text-sm">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center shrink-0"><Info size={16}/></div>
                    <p className="text-zinc-400 font-medium leading-relaxed"><strong>PAGOS:</strong> Los alquileres se abonan todos los <strong>MIÉRCOLES</strong> antes de las 10:00 hs vía transferencia bancaria o en efectivo en el Lavadero. El atraso genera intereses.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-yellow-500/10 text-yellow-500 rounded-lg flex items-center justify-center shrink-0"><CheckCircle size={16}/></div>
                    <p className="text-zinc-400 font-medium leading-relaxed"><strong>REPORTE Y CONTROL:</strong> Debés enviar el reporte de KM cuando haya alguna falla del estado del vehículo, con la descripción breve de la misma, cada vez que ocurra una anomalía. El incumplimiento es motivo de suspensión.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center shrink-0"><ShieldCheck size={16}/></div>
                    <p className="text-zinc-400 font-medium leading-relaxed"><strong>SINIESTROS:</strong> Ante cualquier choque o problema, el reporte debe ser instantáneo. No cumplirlo anula el seguro.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-4 p-5 bg-black/20 border border-white/5 rounded-2xl cursor-pointer hover:bg-black/40 transition-all">
                    <input type="checkbox" required name="has_professional_license" checked={formData.has_professional_license} onChange={handleInputChange} className="w-6 h-6 accent-yellow-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Tengo registro profesional vigente</span>
                  </label>
                  <label className="flex items-center gap-4 p-5 bg-black/20 border border-white/5 rounded-2xl cursor-pointer hover:bg-black/40 transition-all">
                    <input type="checkbox" required name="can_pay_advance" checked={formData.can_pay_advance} onChange={handleInputChange} className="w-6 h-6 accent-yellow-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Puedo abonar la primer semana por adelantado</span>
                  </label>
                  <label className="flex items-center gap-4 p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl cursor-pointer hover:bg-yellow-500/10 transition-all">
                    <input type="checkbox" required name="accepted_terms" checked={formData.accepted_terms} onChange={handleInputChange} className="w-6 h-6 accent-yellow-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                      He leído y acepto todas las condiciones y los <a href="/terminos" target="_blank" className="text-yellow-500 underline hover:text-yellow-400" onClick={(e) => e.stopPropagation()}>Términos y Condiciones Legales</a>
                    </span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 bg-white/5 text-zinc-500 font-black py-5 rounded-2xl">VOLVER</button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] bg-yellow-500 text-black font-black py-5 rounded-2xl shadow-xl shadow-yellow-500/20">
                    {isSubmitting ? 'PROCESANDO...' : 'ENVIAR POSTULACIÓN'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
      
      <Footer className="py-8" />
    </div>
  );
}
