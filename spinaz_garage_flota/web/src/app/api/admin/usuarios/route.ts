import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient();

    const [profilesRes, vehiclesRes, reportsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').order('full_name'),
      supabaseAdmin.from('vehicles').select('*'),
      supabaseAdmin.from('daily_reports').select('driver_id, revenue, start_km, end_km, start_time, end_time')
    ]);

    if (profilesRes.error) throw new Error('Error profiles: ' + profilesRes.error.message);
    if (vehiclesRes.error) throw new Error('Error vehicles: ' + vehiclesRes.error.message);

    const profiles = profilesRes.data || [];
    const vehicles = vehiclesRes.data || [];
    const reports = reportsRes.data || [];

    const usersWithStats = profiles.map((user: any) => {
      const userReports = reports.filter((r: any) => r.driver_id === user.id);
      
      const totalRevenue = userReports.reduce((acc: number, r: any) => acc + Number(r.revenue || 0), 0);
      const totalKm = userReports.reduce((acc: number, r: any) => acc + ((r.end_km || r.start_km) - (r.start_km || 0)), 0);
      const totalHours = userReports.reduce((acc: number, r: any) => {
        if (r.end_time && r.start_time) {
          return acc + (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / (1000 * 60 * 60);
        }
        return acc;
      }, 0);

      const userVehicle = vehicles.find((v: any) => v.id === user.vehicle_id);

      return {
        ...user,
        vehicles: userVehicle || null,
        stats: {
          revenue: totalRevenue,
          km: totalKm,
          hours: Math.round(totalHours)
        }
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

    const supabaseAdmin = createAdminClient();

    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();

    if (targetProfile?.role === 'admin') {
      return NextResponse.json({ error: 'El usuario Administrador está protegido y no se puede eliminar.' }, { status: 403 });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);

    if (profileError) {
      throw new Error('Error al eliminar perfil: ' + profileError.message);
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

    const supabaseAdmin = createAdminClient();

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
