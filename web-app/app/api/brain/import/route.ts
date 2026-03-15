import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import * as unzipper from 'unzipper'
import { Readable } from 'stream'

const getBrainDir = () => path.resolve(process.cwd(), '../brain')

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const source = formData.get('source') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const brainDir = getBrainDir()
    await fs.mkdir(brainDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    let importedFiles = 0

    if (file.name.endsWith('.md')) {
       const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
       const destPath = path.join(brainDir, safeName)
       await fs.writeFile(destPath, buffer)
       importedFiles = 1
       
    } else if (file.name.endsWith('.zip')) {
       const directory = await unzipper.Open.buffer(buffer)

       for (const entry of directory.files) {
          if (entry.type === 'Directory') continue
          if (!entry.path.endsWith('.md') && !entry.path.endsWith('.txt')) continue

          const content = await entry.buffer()
          const baseName = path.basename(entry.path)
          const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_')
          
          if (!safeName) continue

          const destPath = path.join(brainDir, safeName.endsWith('.md') ? safeName : `${safeName}.md`)
          await fs.writeFile(destPath, content)
          importedFiles++
       }
    } else {
       return NextResponse.json({ error: 'Unsupported file type. Please upload .md or .zip' }, { status: 400 })
    }

    return NextResponse.json({ 
       success: true, 
       message: `Successfully imported ${importedFiles} files from ${source}.` 
    })

  } catch (error: any) {
    console.error("Import error", error)
    return NextResponse.json({ error: 'Failed to import files' }, { status: 500 })
  }
}
