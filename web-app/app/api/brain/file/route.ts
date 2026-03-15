import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BRAIN_DIR = path.resolve(process.cwd(), '../brain')

// Secure path resolution to prevent directory traversal
function getSecureFilePath(requestedPath: string): string | null {
  const normPath = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '')
  const safePath = path.join(BRAIN_DIR, normPath)
  
  // Final verification that we're strictly inside the brain directory
  if (!safePath.startsWith(BRAIN_DIR)) {
      return null
  }
  return safePath
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reqPath = searchParams.get('path')

  if (!reqPath) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  const safePath = getSecureFilePath(reqPath)
  
  if (!safePath || !fs.existsSync(safePath)) {
     return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
  }

  try {
    const content = fs.readFileSync(safePath, 'utf-8')
    return NextResponse.json({
        success: true,
        path: reqPath,
        content
    })
  } catch (error) {
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: reqPath, content } = body

    if (!reqPath || typeof content !== 'string') {
        return NextResponse.json({ error: 'Missing path or content payload' }, { status: 400 })
    }

    // Force .md extension
    const finalPath = reqPath.endsWith('.md') ? reqPath : `${reqPath}.md`
    const safePath = getSecureFilePath(finalPath)

    if (!safePath) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Ensure parent directories exist
    fs.mkdirSync(path.dirname(safePath), { recursive: true })
    
    // Write the actual file
    fs.writeFileSync(safePath, content, 'utf-8')

    return NextResponse.json({
        success: true,
        message: 'File successfully written to Brain Vault.',
        path: finalPath
    })

  } catch (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to write file' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const reqPath = searchParams.get('path')
  
    if (!reqPath) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }
  
    const safePath = getSecureFilePath(reqPath)
    
    if (!safePath || !fs.existsSync(safePath)) {
       return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    try {
        fs.unlinkSync(safePath)
        return NextResponse.json({ success: true, message: 'File deleted.' })
    } catch (e) {
        return NextResponse.json({ error: 'Could not delete file.' }, { status: 500 })
    }
}
