import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { searchQuery, name, location, description, price_level, vibe, image_url } = body;

    let latitude: number | null = null;
    let longitude: number | null = null;
    let address = location || '';

    if (searchQuery) {
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              'User-Agent': 'CafeNav-App/1.0'
            }
          }
        );

        if (osmRes.ok) {
          const osmData = await osmRes.json();
          if (Array.isArray(osmData) && osmData.length > 0) {
            latitude = parseFloat(osmData[0].lat);
            longitude = parseFloat(osmData[0].lon);
            address = osmData[0].display_name;
          }
        }
      } catch (osmError) {
        console.warn('OpenStreetMap lookup warning:', osmError);
      }
    }

    const { data, error } = await supabase.from('suggestions').insert([
      {
        name: name || searchQuery || 'Untitled Cafe',
        location: address,
        description: description || '',
        price_level: price_level || '₱₱',
        vibe: vibe || 'chill',
        image_url: image_url || '',
        latitude,
        longitude,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API Suggestion Catch Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}