import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, message: 'Base de datos DonWeb MySQL activa y funcionando.' });
}

