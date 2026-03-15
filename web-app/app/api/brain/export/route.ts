import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import archiver from 'archiver'

const getBrainDir = () => path.resolve(process.cwd(), '../brain')

export async function POST(request: Request) {
  try {
    const { format } = await request.json()

    if (format !== 'zip') {
      return NextResponse.json({ error: 'Unsupported format. Only zip is supported.' }, { status: 400 })
    }

    const brainDir = getBrainDir()
    
    // Check if directory exists
    try {
      const stat = await fs.stat(brainDir)
      if (!stat.isDirectory()) throw new Error("Not a directory")
    } catch {
      return NextResponse.json({ error: 'Brain directory not found' }, { status: 404 })
    }

    // Since Next.js App Router res/req streams are complex to pipe directly with archiver 
    // in a cross-platform way without custom Readable streams, we will buffer the zip 
    // into memory and return it. For massive vaults this isn't ideal, but it works for MVP.

    return new Promise<NextResponse>((resolve, reject) => {
        const buffers: Buffer[] = []
        const archive = archiver('zip', {
            zlib: { level: 9 } // maximum compression
        })

        archive.on('data', (data) => buffers.push(data))

        archive.on('error', (err) => {
            console.error('Archive error:', err)
            resolve(NextResponse.json({ error: 'Failed to create archive' }, { status: 500 }))
        })

        archive.on('end', () => {
            const finalBuffer = Buffer.concat(buffers)
            resolve(new NextResponse(finalBuffer, {
                headers: {
                    'Content-Type': 'application/zip',
                    'Content-Disposition': `attachment; filename="meowdel-brain-export-${new Date().toISOString().split('T')[0]}.zip"`,
                    'Content-Length': finalBuffer.length.toString()
                }
            }))
        })

        // Add the entire brain directory
        archive.directory(brainDir, 'meowdel-brain')
        archive.finalize()
    })

  } catch (error: any) {
    console.error("Export error", error)
    return NextResponse.json({ error: 'Failed to initialize export' }, { status: 500 })
  }
}
