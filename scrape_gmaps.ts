import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { PrismaClient } from './app/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:cafenav.db',
});
const adapter = new PrismaLibSql(client);
const prisma = new PrismaClient({ adapter });

async function downloadImage(url: string, filepath: string) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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

async function scrapeGmapImages() {
  const browser = await puppeteer.launch({ headless: 'new' });
  
  const cafes = [
    { name: 'Grind. Coffee', query: 'Grind. Coffee Poblacion Calamba Laguna', file: 'grind-gmap.jpg' },
    { name: 'Usual Coffee', query: 'Usual Coffee JP Rizal Calamba', file: 'usual-gmap.jpg' },
    { name: '250 Cafe', query: '250 Cafe Poblacion Calamba', file: '250cafe-gmap.jpg' },
    { name: "Bo's Coffee", query: "Bo's Coffee Bagong Kalsada Calamba", file: 'bos-gmap.jpg' }
  ];

  for (const cafe of cafes) {
    try {
      console.log(`\nNavigating Google Maps for: ${cafe.name}...`);
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      let imageUrl = '';
      
      // Intercept network requests to grab the first user/owner uploaded photo
      page.on('response', response => {
        const url = response.url();
        // ONLY match lh3 or lh5 (actual photos), explicitly ignoring streetviewpixels
        if ((url.includes('lh3.googleusercontent.com/p/') || url.includes('lh5.googleusercontent.com/p/')) && !imageUrl) {
          imageUrl = url;
        }
      });

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(cafe.query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for network requests to fire
      await new Promise(r => setTimeout(r, 5000));
      
      // If it's a search results list, click the first place to load its photos
      try {
        const placeLinks = await page.$$('a[href*="/maps/place/"]');
        if (placeLinks.length > 0 && !imageUrl) {
          console.log('Found list of results, clicking the first one...');
          await placeLinks[0].click();
          await new Promise(r => setTimeout(r, 5000));
        }
      } catch (e) {
        // Ignore
      }
      
      await page.close();

      if (imageUrl) {
        // Enforce high-res
        let highResUrl = imageUrl;
        if (highResUrl.includes('=w')) {
           highResUrl = highResUrl.replace(/=w\d+-h\d+-[a-zA-Z0-9_-]+/, '=w1024-h768-k-no');
           highResUrl = highResUrl.replace(/=w\d+-h\d+&?/, '=w1024-h768-k-no');
        }
        console.log(`Found GMap photo for ${cafe.name}: ${highResUrl.substring(0, 80)}...`);
        
        const targetPath = path.join(process.cwd(), 'public', 'images', cafe.file);
        
        try {
            await downloadImage(highResUrl, targetPath);
        } catch (e) {
            console.log(`High res download failed, falling back to original url`);
            await downloadImage(imageUrl, targetPath);
        }
        
        await prisma.cafes.update({
          where: { name: cafe.name },
          data: { image_url: `/images/${cafe.file}` }
        });
        console.log(`Saved and updated DB for ${cafe.name}`);
      } else {
        console.log(`No GMap photo found for ${cafe.name}`);
      }
    } catch (e) {
      console.error(`Error scraping ${cafe.name}:`, (e as Error).message);
    }
  }

  await browser.close();
  await prisma.$disconnect();
}

scrapeGmapImages().catch(console.error);

