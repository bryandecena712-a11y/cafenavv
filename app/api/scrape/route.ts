import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    // Fetch with realistic browser headers to prevent 403 Forbidden blocks
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Website blocked access (Status: ${response.status}). Try a different cafe link.` }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    // Extract Description
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    // Extract Image URL
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    // Extract Location
    let location =
      $('meta[property="business:contact_data:locality"]').attr('content') ||
      $('meta[property="place:location:locality"]').attr('content') ||
      $('[itemprop="addressLocality"]').text() ||
      $('[itemprop="streetAddress"]').text() ||
      '';

    if (!location) {
      const combinedText = `${title} ${description}`;
      const commonCities = ['Manila', 'Quezon City', 'Makati', 'BGC', 'Taguig', 'Cebu', 'Davao', 'Pasig', 'Mandaluyong', 'Alabang'];
      const foundCity = commonCities.find((city) => new RegExp(`\\b${city}\\b`, 'i').test(combinedText));
      if (foundCity) {
        location = foundCity;
      }
    }

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image_url: image.trim(),
      location: location.trim(),
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Could not scrape details from URL' }, { status: 500 });
  }
}