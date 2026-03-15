import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward the file to the Python DocEngine Microservice
    const docEngineFormData = new FormData();
    docEngineFormData.append('file', file);

    const docEngineUrl = process.env.DOCENGINE_URL || 'http://localhost:8000';

    try {
        const response = await fetch(`${docEngineUrl}/parse`, {
        method: 'POST',
        body: docEngineFormData,
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("DocEngine Error:", errBody);
            return NextResponse.json({ error: `DocEngine parsed with error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        
        // Return the parsed markdown to the frontend
        return NextResponse.json({ 
            success: true, 
            filename: data.filename,
            markdown: data.markdown 
        });

    } catch (fetchError) {
        console.error("DocEngine Fetch Error:", fetchError);
        return NextResponse.json({ error: 'Failed to connect to DocEngine microservice.' }, { status: 502 });
    }

  } catch (error) {
    console.error('DocEngine Integration error:', error);
    return NextResponse.json({ error: 'Failed to process document upload' }, { status: 500 });
  }
}
