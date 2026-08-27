import fs from 'fs';
import path from 'path';
import https from 'https';
import { PrismaClient } from './app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: 'file:cafenav.db',
});
const prisma = new PrismaClient({ adapter });

async function downloadImage(url: string, filepath: string) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location!, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function scrapeImages() {
  const cafes = [
    { name: 'Grind. Coffee', query: 'Grind. Coffee Poblacion Calamba', file: 'grind-real.jpg' },
    { name: 'Usual Coffee', query: 'Usual Coffee JP Rizal Calamba', file: 'usual-real.jpg' },
    { name: '250 Cafe', query: '250 Cafe Poblacion Calamba', file: '250cafe-real.jpg' },
    { name: "Bo's Coffee", query: "Bo's Coffee Bagong Kalsada Calamba", file: 'bos-real.jpg' }
  ];

  for (const cafe of cafes) {
    try {
      console.log(`Scraping image for: ${cafe.name}...`);
      const searchUrl = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(cafe.query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await response.text();
      
      // Yahoo stores image URLs in the HTML in 'src' or 'data-src' of img tags with class 'process' or similar.
      // Easiest is to regex match http URLs ending in .jpg or .png inside the HTML.
      const match = html.match(/src='(https:\/\/[^']+\.jpg)'/);
      let imageUrl = match ? match[1] : null;
      
      if (!imageUrl) {
        // Fallback to Bing
        const bingResponse = await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(cafe.query)}`, {
           headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const bingHtml = await bingResponse.text();
        const bingMatch = bingHtml.match(/murl&quot;:&quot;(https:\/\/[^&]+?\.(jpg|jpeg))&quot;/i);
        if (bingMatch) imageUrl = bingMatch[1];
      }

      if (imageUrl) {
        console.log(`Found image for ${cafe.name}: ${imageUrl.substring(0, 50)}...`);
        const targetPath = path.join(process.cwd(), 'public', 'images', cafe.file);
        await downloadImage(imageUrl, targetPath);
        
        await prisma.cafes.update({
          where: { name: cafe.name },
          data: { image_url: `/images/${cafe.file}` }
        });
        console.log(`Saved and updated DB for ${cafe.name}`);
      } else {
        console.log(`No image found for ${cafe.name}`);
      }
    } catch (e) {
      console.error(`Error scraping ${cafe.name}:`, e);
    }
  }
  await prisma.$disconnect();
}

scrapeImages().catch(console.error);
