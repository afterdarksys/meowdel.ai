import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain');
}

async function getMDRecursive(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name);
      if (dirent.name === '.git' || dirent.name === 'node_modules' || dirent.name.startsWith('.')) return [];
      return dirent.isDirectory() ? getMDRecursive(res) : res;
    })
  );
  return Array.prototype.concat(...files).filter(f => f.endsWith('.md'));
}

export async function POST() {
    try {
        const brainDir = getBrainDir();
        const files = await getMDRecursive(brainDir);
        
        if (files.length === 0) {
             return NextResponse.json({ success: false, message: 'No notes to dream about.' });
        }

        // Pick a random note
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const content = await fs.readFile(randomFile, 'utf8');
        const { data, content: body } = matter(content);

        // Anthropic Call
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            temperature: 0.8,
            system: `You are Meowdel, an AI cat. You are currently taking a nap. While dreaming, you are reviewing the user's notes.
Read the provided note and provide ONE single, highly insightful 1-2 sentence recommendation or observation about it. Prefix it with "💤 *Dreaming:* "`,
            messages: [{ role: 'user', content: `Note Title: ${data.title}\n\nContent:\n${body}` }]
        });

        const insight = response.content[0].type === 'text' ? response.content[0].text : 'Zzz...';

        // Actually append the dream locally to the markdown file to fulfill the "full implementation" request
        const newBody = `${body}\n\n> [!tip] Meowdel's Nap Insight\n> ${insight}\n`;
        const newFileContent = matter.stringify(newBody, data);
        await fs.writeFile(randomFile, newFileContent, 'utf8');

        return NextResponse.json({ 
            success: true, 
            file: path.basename(randomFile),
            insight
        });

    } catch (error: any) {
        console.error('Nap time error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
