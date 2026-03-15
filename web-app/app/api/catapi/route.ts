import { NextResponse } from 'next/server';
import crypto from 'crypto';

// A collection of reliable, high-quality static cat image URLs for our API
const CAT_IMAGES = [
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80",
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&q=80",
  "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&q=80",
  "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=80",
  "https://images.unsplash.com/photo-1529778453900-1d52a21074bd?w=800&q=80",
  "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=800&q=80",
  "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800&q=80",
  "https://images.unsplash.com/photo-1501820488136-72669149e0d4?w=800&q=80",
  "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&q=80",
  "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=800&q=80"
];

const SEASONAL_CATS: Record<string, string[]> = {
  winter: ["https://images.unsplash.com/photo-1548247661-3d7905940716?w=800&q=80"], // cat in snow
  summer: ["https://images.unsplash.com/photo-1507984211203-76701d7bb120?w=800&q=80"], // cat in sun
  spring: ["https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80"], // cat with flowers
  fall:   ["https://images.unsplash.com/photo-1478098711619-5ab0b478d6e6?w=800&q=80"], // cat looking autumny
};

// Helper to reliably map a string hash to an index
function getHashIndex(input: string, max: number): number {
  const hash = crypto.createHash('md5').update(input).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return num % max;
}

// Generate the temporal keys so the "Cat of the Day" stays the same for 24 hours, etc.
function getTemporalKey(tier: string, date: Date): string | null {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const h = date.getUTCHours();
  
  switch (tier) {
    case 'hour': return `hour-${y}-${m}-${d}-${h}`;
    case 'day': return `day-${y}-${m}-${d}`;
    case 'week': 
      // simple week hash, week of year approximation
      const week = Math.floor((date.getTime() - new Date(y, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      return `week-${y}-${week}`;
    case 'month': return `month-${y}-${m}`;
    case 'quarter': return `quarter-${y}-${Math.floor(m / 3)}`;
    case 'mid-year': return `midyear-${y}-${Math.floor(m / 6)}`;
    case 'holiday': 
      // if Dec, return holiday, else this returns nothing or just default
      return m === 11 ? `holiday-${y}` : `holiday-generic`;
    default: return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier'); // e.g. hour, day, week, month, quarter, winter, summer, etc.
    const apiKey = request.headers.get('x-api-key') || searchParams.get('api_key');

    // Temporal Free Tiers
    const temporalTiers = ['hour', 'day', 'week', 'month', 'quarter', 'mid-year', 'holiday'];
    const seasonalTiers = ['winter', 'summer', 'spring', 'fall'];

    let imageUrl = "";

    if (tier && seasonalTiers.includes(tier.toLowerCase())) {
        // Seasonal free tier
        const seasonCats = SEASONAL_CATS[tier.toLowerCase()];
        imageUrl = seasonCats[Math.floor(Math.random() * seasonCats.length)];
    } else if (tier && temporalTiers.includes(tier.toLowerCase())) {
        // Temporal free tier
        const key = getTemporalKey(tier.toLowerCase(), new Date());
        const index = getHashIndex(key || 'default', CAT_IMAGES.length);
        imageUrl = CAT_IMAGES[index];
    } else {
        // PREMIUM: requires API key
        if (!apiKey) {
           return NextResponse.json(
             { error: 'Unauthorized', message: 'API Key required for random or non-free cat queries. Please supply x-api-key header or api_key param. Use ?tier=day, ?tier=hour, etc. for free access.' }, 
             { status: 401 }
           );
        }
        
        // In a real app we would validate the API key against the database here.
        // For Meowdel MVP, any string works if provided.
        
        imageUrl = CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
    }

    // Build the payload 
    const payload = {
       id: crypto.randomBytes(4).toString('hex'),
       url: imageUrl,
       width: 800,
       height: 600,
       tier: tier || 'premium'
    }

    return NextResponse.json([payload], {
       headers: {
           // Allow CORS for public API requests
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Methods': 'GET, OPTIONS',
           'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization'
       }
    });

  } catch (error: any) {
    console.error("Cat API error", error);
    return NextResponse.json({ error: 'Failed to fetch cat' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization'
    }
  });
}
