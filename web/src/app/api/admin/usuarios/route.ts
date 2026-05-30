import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service Role Key no configurada' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Pedimos profiles, vehicles y daily_reports bypassing RLS
    const [profilesRes, vehiclesRes, reportsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').order('full_name'),
      supabaseAdmin.from('vehicles').select('*'),
      supabaseAdmin.from('daily_reports').select('id, driver_id, vehicle_id, revenue, start_km, end_km, start_time, end_time, created_at')
    ]);

    if (profilesRes.error) throw new Error('Error profiles: ' + profilesRes.error.message);
    if (vehiclesRes.error) throw new Error('Error vehicles: ' + vehiclesRes.error.message);

    const profiles = profilesRes.data || [];
    const vehicles = vehiclesRes.data || [];
    const reports = reportsRes.data || [];

    // Aggregate stats backend-side
    const usersWithStats = profiles.map(user => {
      const userReports = reports.filter(r => r.driver_id === user.id);
      
      const totalRevenue = userReports.reduce((acc, r) => acc + Number(r.revenue || 0), 0);
      const totalKm = userReports.reduce((acc, r) => acc + ((r.end_km || r.start_km) - (r.start_km || 0)), 0);
      const totalHours = userReports.reduce((acc, r) => {
        if (r.end_time && r.start_time) {
          return acc + (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / (1000 * 60 * 60);
        }
        return acc;
      }, 0);

      const userVehicle = vehicles.find(v => v.id === user.vehicle_id);

      // Mapear historial de trabajo
      const workHistory = userReports.map(r => {
        const vehicle = vehicles.find(v => v.id === r.vehicle_id);
        const hours = r.end_time && r.start_time 
          ? Math.round((new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / (1000 * 60 * 60)) 
          : 0;
        return {
          id: r.id,
          vehicle_plate: vehicle ? vehicle.plate : 'S/P',
          vehicle_model: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Desconocido',
          revenue: Number(r.revenue || 0),
          km: (r.end_km || r.start_km) - (r.start_km || 0),
          hours: hours,
          date: r.created_at || r.start_time
        };
      }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        ...user,
        vehicles: userVehicle || null,
        stats: {
          revenue: totalRevenue,
          km: totalKm,
          hours: Math.round(totalHours)
        },
        work_history: workHistory
      };
    });

    return NextResponse.json({ users: usersWithStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Intentamos eliminar de Auth (esto borra el perfil en cascada si existe)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    // Forzamos la eliminación del perfil público en caso de que sea un perfil huérfano (sin usuario Auth)
    // o si falló el borrado en cascada.
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);

    if (profileError) {
        throw new Error('Error al eliminar perfil: ' + profileError.message);
    }

    // Si no hubo error en profile, pero sí en auth y no es por usuario inexistente, lo reportamos en consola
    if (authError && authError.status !== 404 && !authError.message.includes('loading user')) {
        console.warn('Advertencia Auth al borrar usuario:', authError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, vehicle_id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ vehicle_id: vehicle_id || null })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
