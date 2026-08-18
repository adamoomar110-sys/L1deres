import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { driver_id, vehicle_id, description, photo_url, audio_url } = await req.json();

    const { data, error } = await supabase
      .from('incidents')
      .insert([{
        driver_id,
        vehicle_id,
        description,
        photo_url,
        audio_url,
        status: 'open'
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
