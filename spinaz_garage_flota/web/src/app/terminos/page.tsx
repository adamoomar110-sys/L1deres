import { Car, FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TerminosYCondiciones() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-yellow-500 selection:text-black">
      <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent pointer-events-none" />
      
      <header className="h-24 border-b border-white/5 flex items-center justify-center bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Car className="text-black" size={28} />
          </div>
          <h1 className="font-black text-2xl tracking-tighter italic text-white">SPINAZ GARAGE</h1>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto p-6 lg:p-12 relative z-10">
        <div className="mb-12">
          <span className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4 block">Documento Legal</span>
          <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tighter text-white">Términos y Condiciones de Uso y Contratación</h1>
          <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">
            Última actualización: Mayo 2026
          </p>
        </div>

        <div className="bg-zinc-900/30 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 lg:p-12 space-y-10 shadow-3xl">
          
          <section className="space-y-4">
             <div className="flex items-center gap-3 mb-6">
                <FileText className="text-yellow-500" size={24} />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">1. Consideraciones Generales</h2>
             </div>
             <p className="leading-relaxed">
               El presente documento establece las condiciones legales y los términos de uso aplicables a los choferes y postulantes que deseen alquilar y operar vehículos pertenecientes a la flota de <strong>Spinaz Garage</strong> (en adelante, "la Empresa"). 
               Al aceptar estos términos durante el proceso de postulación, el candidato (en adelante, "el Chofer") reconoce haber leído, entendido y aceptado todas las obligaciones aquí descriptas. Estas condiciones son plenamente lícitas y acordes a la normativa civil y comercial vigente en la República Argentina para el contrato de locación de cosas muebles.
             </p>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-yellow-500" size={24} />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">2. Condiciones de Pago y Alquiler</h2>
             </div>
             <ul className="list-none space-y-4 pl-0">
               <li className="flex gap-4">
                 <div className="w-6 h-6 mt-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">1</div>
                 <p className="leading-relaxed"><strong>Pago Adelantado:</strong> Conforme a las prácticas comerciales estándar de locación, el Chofer deberá abonar la primera semana de alquiler por adelantado antes de la entrega del vehículo, junto con el depósito de garantía que la Empresa determine.</p>
               </li>
               <li className="flex gap-4">
                 <div className="w-6 h-6 mt-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">2</div>
                 <p className="leading-relaxed"><strong>Día de Pago:</strong> Los pagos semanales por el uso del vehículo deben realizarse indefectiblemente todos los días <strong>MIÉRCOLES antes de las 10:00 hs</strong>. El atraso genera intereses.</p>
               </li>
               <li className="flex gap-4">
                 <div className="w-6 h-6 mt-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center shrink-0">3</div>
                 <p className="leading-relaxed"><strong>Medio de Pago:</strong> Los pagos serán recibidos a través de transferencia bancaria a la cuenta oficial provista por la Empresa o en efectivo en el Lavadero.</p>
               </li>
             </ul>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-yellow-500" size={24} />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">3. Operación y Control</h2>
             </div>
             <p className="leading-relaxed">La Empresa mantiene estrictos controles de calidad y mantenimiento para asegurar la integridad de su flota y el correcto cumplimiento del servicio.</p>
             <ul className="list-none space-y-4 pl-0">
                <li className="flex gap-4">
                  <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full shrink-0"></div>
                  <p className="leading-relaxed"><strong>Reporte de KM y Anomalías:</strong> Debés enviar el reporte de KM cuando haya alguna falla del estado del vehículo, con la descripción breve de la misma, cada vez que ocurra una anomalía para su correcta evaluación mecánica. El incumplimiento y falta de aviso es motivo de suspensión.</p>
                </li>
               <li className="flex gap-4">
                 <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full shrink-0"></div>
                 <p className="leading-relaxed"><strong>Uso Exclusivo:</strong> El vehículo debe ser utilizado exclusivamente para las aplicaciones de transporte de pasajeros declaradas (Uber, Cabify, DiDi, etc.) por el Chofer registrado. Queda terminantemente prohibido ceder, prestar o subalquilar el manejo a terceros.</p>
               </li>
               <li className="flex gap-4">
                 <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full shrink-0"></div>
                 <p className="leading-relaxed"><strong>Registro Profesional:</strong> El Chofer declara bajo juramento poseer Licencia de Conducir Profesional vigente y habilitada para el transporte de pasajeros.</p>
               </li>
             </ul>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">4. Siniestros y Responsabilidad</h2>
             </div>
             <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
               <p className="leading-relaxed text-red-200">
                 <strong>Notificación Inmediata y Carga de Denuncia:</strong> Ante cualquier incidente, choque, robo, hurto o problema mecánico, el Chofer <strong>DEBE REPORTARLO DE MANERA INSTANTÁNEA</strong> a la Empresa. 
                 Es exigencia de las aseguradoras contar con la denuncia al momento del hecho. El incumplimiento de esta cláusula o la demora injustificada en el aviso implicará la no cobertura del siniestro por parte de la aseguradora y/o de la Empresa, haciendo al Chofer patrimonial y económicamente responsable por la totalidad de los daños y perjuicios ocasionados al vehículo y a terceros.
               </p>
             </div>
          </section>
          
          <section className="space-y-4 pt-6 border-t border-white/5">
             <p className="text-sm text-zinc-500 leading-relaxed italic text-center">
               La marcación de la casilla "He leído y acepto todas las condiciones y los Términos y Condiciones Legales" en el formulario de postulación tiene carácter de firma electrónica y declaración jurada, y constituye la voluntad del Chofer de someterse a estas reglas y ser la base para la posterior firma del Contrato formal de Locación. 
               La Empresa se reserva el derecho de admisión y verificación de los antecedentes.
             </p>
          </section>

        </div>
      </main>

      <Footer className="py-8" />
    </div>
  );
}
