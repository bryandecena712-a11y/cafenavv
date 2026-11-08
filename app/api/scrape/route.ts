import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 4;

type JsonRecord = Record<string, unknown>;

function isPublicIpv4(address: string) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b, c] = octets;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isPublicIpv6(address: string) {
  const normalized = address.toLowerCase();
  if (!normalized.startsWith('2') && !normalized.startsWith('3')) return false;
  if (
    normalized.startsWith('2001:db8:') ||
    normalized.startsWith('2001:0000:') ||
    normalized.startsWith('2001:0010:') ||
    normalized.startsWith('2001:0020:') ||
    normalized.startsWith('2002:')
  ) {
    return false;
  }
  return true;
}

async function validatePublicUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Enter a valid website or social media URL.');
  }

  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username ||
    url.password ||
    (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80'))
  ) {
    throw new Error('Only public HTTP or HTTPS website links are supported.');
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('That URL is not a public website.');
  }

  const ipVersion = isIP(hostname);
  const addresses = ipVersion
    ? [{ address: hostname, family: ipVersion }]
    : await lookup(hostname, { all: true, verbatim: true });

  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) =>
      family === 4 ? !isPublicIpv4(address) : !isPublicIpv6(address)
    )
  ) {
    throw new Error('That URL does not resolve to a public website.');
  }

  return url;
}

async function fetchPage(initialUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  let url = initialUrl;

  try {
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const safeUrl = await validatePublicUrl(url);
      const response = await fetch(safeUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const redirect = response.headers.get('location');
        if (!redirect || redirectCount === MAX_REDIRECTS) {
          throw new Error('The website redirected too many times.');
        }
        url = new URL(redirect, safeUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`The website could not be read (HTTP ${response.status}).`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!/^(text\/html|application\/xhtml\+xml)(;|$)/i.test(contentType)) {
        throw new Error('That link does not provide a readable web page.');
      }

      const contentLength = Number(response.headers.get('content-length'));
      if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
        throw new Error('The linked page is too large to read.');
      }

      if (!response.body) {
        throw new Error('The linked page did not return any content.');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_HTML_BYTES) {
          await reader.cancel();
          throw new Error('The linked page is too large to read.');
        }
        chunks.push(value);
      }

      const bytes = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const html = new TextDecoder().decode(bytes);
      return { html, pageUrl: safeUrl.toString() };
    }

    throw new Error('Could not follow the website redirect.');
  } finally {
    clearTimeout(timeout);
  }
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function textValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  if (Array.isArray(value)) return value.map(textValue).find(Boolean) || '';
  const record = asRecord(value);
  if (record) return textValue(record.name ?? record.text ?? record.value ?? record['@value'] ?? record.url);
  return '';
}

function collectStructuredData($: ReturnType<typeof cheerio.load>) {
  const records: JsonRecord[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = asRecord(value);
    if (!record) return;
    records.push(record);
    visit(record['@graph']);
  };

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      visit(JSON.parse($(element).contents().text()));
    } catch {
      // Ignore malformed structured-data blocks and continue using page metadata.
    }
  });

  return records;
}

function hasType(record: JsonRecord, names: string[]) {
  const types = Array.isArray(record['@type']) ? record['@type'] : [record['@type']];
  return types.some(
    (type) => typeof type === 'string' && names.includes(type.split('/').pop() || type)
  );
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const text = textValue(value);
    if (text) return text;
  }
  return '';
}

function resolveImage(value: unknown, baseUrl: string) {
  const image = textValue(value);
  if (!image) return '';
  try {
    const url = new URL(image, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function getAddress(value: unknown) {
  const address = asRecord(value);
  if (!address) return textValue(value);
  return [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    textValue(address.addressCountry),
  ]
    .map(textValue)
    .filter(Boolean)
    .join(', ');
}

function getCoordinates(value: unknown) {
  const geo = asRecord(value);
  if (!geo) return null;
  const lat = Number(geo.latitude);
  const lng = Number(geo.longitude);
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
}

function getOfferPrice(value: unknown) {
  const offer = Array.isArray(value) ? asRecord(value[0]) : asRecord(value);
  const currency = textValue(offer?.priceCurrency).toUpperCase();
  if (currency && currency !== 'PHP' && currency !== '₱') return null;
  const price = offer?.price ?? offer?.lowPrice;
  const rawPrice = textValue(price);
  if (!currency && !rawPrice.includes('₱')) return null;
  const amount = Number(rawPrice.replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function getAdditionalProperty(record: JsonRecord | undefined, propertyName: string) {
  const properties = Array.isArray(record?.additionalProperty)
    ? record.additionalProperty
    : [record?.additionalProperty];
  const match = properties
    .map(asRecord)
    .find(
      (property) =>
        property &&
        firstValue(property.name, property.propertyID).toLowerCase() === propertyName.toLowerCase()
    );
  return textValue(match?.value);
}

function getExplicitEnvironment(record: JsonRecord | undefined) {
  const features = Array.isArray(record?.amenityFeature) ? record.amenityFeature : [record?.amenityFeature];
  let indoor = typeof record?.hasIndoorSeating === 'boolean' ? record.hasIndoorSeating : undefined;
  let outdoor = typeof record?.hasOutdoorSeating === 'boolean' ? record.hasOutdoorSeating : undefined;

  for (const feature of features) {
    const item = asRecord(feature);
    if (!item) continue;
    const name = firstValue(item.name, item.propertyID).toLowerCase();
    const value = item.value;
    const enabled = value === true || String(value).toLowerCase() === 'true';
    const disabled = value === false || String(value).toLowerCase() === 'false';
    if (name.includes('indoor seating')) indoor = enabled ? true : disabled ? false : indoor;
    if (name.includes('outdoor seating')) outdoor = enabled ? true : disabled ? false : outdoor;
  }

  if (indoor === true && outdoor === true) return 'Both Indoor & Outdoor';
  if (indoor === true && outdoor === false) return 'Indoor Cafe';
  if (indoor === false && outdoor === true) return 'Outdoor Cafe';
  return '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urlInput = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!urlInput) {
      return NextResponse.json({ error: 'A website or social media URL is required.' }, { status: 400 });
    }

    const { html, pageUrl } = await fetchPage(urlInput);
    const $ = cheerio.load(html);
    const records = collectStructuredData($);
    const cafeRecord = records.find((record) =>
      hasType(record, ['CafeOrCoffeeShop', 'Restaurant', 'FoodEstablishment', 'LocalBusiness'])
    );
    const productRecord = records.find((record) =>
      hasType(record, ['Product', 'MenuItem', 'IndividualProduct'])
    );
    const itemRecord = productRecord || records.find((record) => hasType(record, ['Offer']));
    const pageRecord = records.find((record) => textValue(record.name));
    const primaryRecord = productRecord || cafeRecord || pageRecord;

    const meta = (selector: string) => $(selector).first().attr('content')?.trim() || '';
    const itemProp = (name: string) =>
      $(`[itemprop="${name}"]`).first().attr('content')?.trim() ||
      $(`[itemprop="${name}"]`).first().text().trim() ||
      '';
    const pageTitle = firstValue(
      pageRecord?.name,
      meta('meta[property="og:title"]'),
      meta('meta[name="twitter:title"]'),
      itemProp('name'),
      $('title').text()
    );
    const title = firstValue(productRecord?.name, cafeRecord?.name, pageTitle);
    const cafeName = firstValue(cafeRecord?.name, pageTitle);
    const itemName = firstValue(productRecord?.name, cafeRecord ? '' : pageTitle);
    const pageDescription = firstValue(
      primaryRecord?.description,
      meta('meta[property="og:description"]'),
      meta('meta[name="twitter:description"]'),
      meta('meta[name="description"]'),
      itemProp('description')
    );
    const cafeDescription = firstValue(cafeRecord?.description, pageDescription);
    const itemDescription = firstValue(productRecord?.description, pageDescription);
    const image = resolveImage(
      firstValue(
        primaryRecord?.image,
        meta('meta[property="og:image"]'),
        meta('meta[name="twitter:image"]')
      ),
      pageUrl
    );
    const cafeImage = resolveImage(
      firstValue(cafeRecord?.image, meta('meta[property="og:image"]'), meta('meta[name="twitter:image"]')),
      pageUrl
    );
    const itemImage = resolveImage(
      firstValue(productRecord?.image, meta('meta[property="og:image"]'), meta('meta[name="twitter:image"]')),
      pageUrl
    );
    const address = firstValue(
      getAddress(cafeRecord?.address),
      meta('meta[property="business:contact_data:locality"]'),
      itemProp('address')
    );
    const structuredCoordinates = getCoordinates(cafeRecord?.geo);
    const metadataLat = meta('meta[property="place:location:latitude"]');
    const metadataLng = meta('meta[property="place:location:longitude"]');
    const coordinates =
      structuredCoordinates ||
      (metadataLat && metadataLng
        ? { lat: Number(metadataLat), lng: Number(metadataLng) }
        : null);
    const validCoordinates =
      coordinates &&
      Number.isFinite(coordinates.lat) &&
      Number.isFinite(coordinates.lng) &&
      Math.abs(coordinates.lat) <= 90 &&
      Math.abs(coordinates.lng) <= 180
        ? coordinates
        : null;

    const priceRange = firstValue(
      cafeRecord?.priceRange,
      meta('meta[property="business:price_range"]'),
      itemProp('priceRange')
    );
    const vibe = firstValue(
      meta('meta[name="vibe"]'),
      meta('meta[property="cafenav:vibe"]'),
      getAdditionalProperty(cafeRecord, 'vibe')
    );
    const environment = firstValue(
      meta('meta[name="environment"]'),
      meta('meta[property="cafenav:environment"]'),
      getAdditionalProperty(cafeRecord, 'environment'),
      getExplicitEnvironment(cafeRecord)
    );
    const itemPrice =
      getOfferPrice(itemRecord?.offers) ??
      getOfferPrice(records.find((record) => hasType(record, ['Offer']))) ??
      getOfferPrice({
        price:
          meta('meta[property="product:price:amount"]') ||
          meta('meta[property="og:price:amount"]') ||
          itemProp('price'),
        priceCurrency:
          meta('meta[property="product:price:currency"]') ||
          meta('meta[property="og:price:currency"]') ||
          itemProp('priceCurrency'),
      });

    const result = {
      title,
      cafe_name: cafeName,
      item_name: itemName,
      description: pageDescription,
      cafe_description: cafeDescription,
      item_description: itemDescription,
      image_url: image,
      cafe_image_url: cafeImage,
      item_image_url: itemImage,
      location: address,
      item_price: itemPrice,
      price_range: priceRange,
      vibe,
      environment,
      content_type: cafeRecord ? 'cafe' : productRecord ? 'product' : 'page',
      ...(validCoordinates || {}),
      fields_found: [
        (cafeName || itemName) && 'name',
        (pageDescription || cafeDescription || itemDescription) && 'description',
        (image || cafeImage || itemImage) && 'image',
        address && 'location',
        validCoordinates && 'coordinates',
        priceRange && 'price range',
        vibe && 'vibe',
        environment && 'environment',
        itemPrice !== null && 'item price',
      ].filter(Boolean),
    };

    if (result.fields_found.length === 0) {
      return NextResponse.json(
        { error: 'The page is reachable, but it does not expose cafe or menu details to auto-fill.' },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read details from that link.';
    console.error('Scraping error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
