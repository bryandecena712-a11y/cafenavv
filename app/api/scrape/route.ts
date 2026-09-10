import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to access the provided link' }, { status: 400 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Extract Title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    // 2. Extract Description (Checking all common meta formats)
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[aria-label="description"]').attr('content') ||
      '';

    // 3. Extract Image URL
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    // 4. Extract Location / Address (Check microdata schema or tags)
    let location =
      $('meta[property="business:contact_data:locality"]').attr('content') ||
      $('meta[property="place:location:locality"]').attr('content') ||
      $('[itemprop="addressLocality"]').text() ||
      $('[itemprop="streetAddress"]').text() ||
      '';

    // Fallback: If no dedicated address tag exists, check title/description for location cues
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