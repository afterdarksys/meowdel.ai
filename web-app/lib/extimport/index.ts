import { ExtImporter, ImportItem } from './types';
import { AppleNotesImporter } from './providers/apple';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

export function getImporter(platform: string): ExtImporter {
    switch (platform) {
        case 'apple':
            return new AppleNotesImporter();
        // case 'notion':
        //    return new NotionImporter();
        default:
            throw new Error(`Platform ${platform} is not supported yet.`);
    }
}

function getBrainDir(): string {
  return path.resolve(process.cwd(), '../brain');
}

export async function processImport(platform: string, credentials?: any, onProgress?: (msg: string) => void) {
    const importer = getImporter(platform);
    
    if (onProgress) onProgress(`Authenticating with ${platform}...`);
    const isAuthenticated = await importer.authenticate(credentials);
    
    if (!isAuthenticated) {
        throw new Error(`Failed to authenticate with ${platform}`);
    }

    if (onProgress) onProgress(`Fetching items from ${platform}...`);
    const items = await importer.fetchItems();
    
    if (onProgress) onProgress(`Found ${items.length} items. Starting conversion and save...`);
    
    const brainDir = getBrainDir();
    // Ensure brain dir exists
    await fs.mkdir(brainDir, { recursive: true }).catch(() => {});

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (onProgress && i % 10 === 0) {
            onProgress(`Processing item ${i + 1} of ${items.length}...`);
        }

        try {
            const markdownContent = await importer.convertToMarkdown(item);
            
            // Clean title for slug
            const safeTitle = (item.title || 'Untitled Note')
                .replace(/[^a-zA-Z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .toLowerCase();
                
            let slug = `ext-${platform}-${safeTitle}`;
            if (!safeTitle) {
               slug = `ext-${platform}-${Date.now()}`;
            }

            const filePath = path.join(brainDir, `${slug}.md`);

            let finalContent = markdownContent;
            if (!finalContent.trim()) {
                finalContent = `\n# ${item.title}\n`;
            }

            const fileContent = matter.stringify(finalContent, {
                title: item.title,
                tags: item.tags || [],
                imported_from: platform,
                original_updated_at: item.updatedAt || new Date().toISOString()
            });

            await fs.writeFile(filePath, fileContent, 'utf8');
            successCount++;
        } catch (err) {
            console.error(`Failed to process item ${item.id}:`, err);
            errorCount++;
        }
    }

    if (onProgress) onProgress(`Import complete! Successfully imported ${successCount} notes. Failed: ${errorCount}.`);
    
    return { successCount, errorCount, total: items.length };
}
