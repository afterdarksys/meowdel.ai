import { ExtImporter, ImportItem } from '../types';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export class AppleNotesImporter implements ExtImporter {
    platform: 'apple' = 'apple';

    async authenticate(credentials?: any): Promise<boolean> {
        try {
            // Check if osascript and Notes app exist/can be communicated with.
            // On macOS, this will prompt the user for permission the first time.
            const { stdout } = await execAsync('osascript -e \'tell application "Notes" to get name of first account\'');
            return stdout.trim().length > 0;
        } catch (e) {
            console.error('Apple Notes Auth Failed:', e);
            return false;
        }
    }

    async fetchItems(): Promise<ImportItem[]> {
        // Warning: For a user with thousands of notes, this script could be slow.
        // We fetch the ID, name, body (HTML), and modification date.
        const script = `
        tell application "Notes"
            set noteList to every note
            set results to "["
            set noteCount to count of noteList
            repeat with i from 1 to noteCount
                set n to item i of noteList
                set nName to name of n
                set nBody to body of n
                set nId to id of n
                set nMod to modification date of n
                
                -- Escape quotes and backslashes for JSON
                set escName to my escapeString(nName)
                set escBody to my escapeString(nBody)
                set escId to my escapeString(nId)
                
                -- Naive date formatting for JSON
                set nModStr to (year of nMod as string) & "-" & (month of nMod as integer as string) & "-" & (day of nMod as string)
                
                set noteJson to "{\\"id\\":\\"" & escId & "\\", \\"title\\":\\"" & escName & "\\", \\"content\\":\\"" & escBody & "\\", \\"updatedAt\\":\\"" & nModStr & "\\"}"
                
                set results to results & noteJson
                if i < noteCount then
                    set results to results & ","
                end if
            end repeat
            set results to results & "]"
            return results
        end tell

        on escapeString(str)
            -- Super basic escaping for AppleScript to JSON (handles quotes, slashes,newlines)
            set AppleScript's text item delimiters to "\\\\"
            set temp to text items of str
            set AppleScript's text item delimiters to "\\\\\\\\"
            set str to temp as string
            
            set AppleScript's text item delimiters to "\\""
            set temp to text items of str
            set AppleScript's text item delimiters to "\\\\\\""
            set str to temp as string
            
            set AppleScript's text item delimiters to return
            set temp to text items of str
            set AppleScript's text item delimiters to "\\\\n"
            set str to temp as string
            
            set AppleScript's text item delimiters to ASCII character 10
            set temp to text items of str
            set AppleScript's text item delimiters to "\\\\n"
            set str to temp as string

            return str
        end escapeString
        `;

        try {
            const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { maxBuffer: 1024 * 1024 * 50 }); // 50MB buffer
            const items = JSON.parse(stdout);
            
            return items.map((i: any) => ({
                id: i.id,
                title: i.title,
                content: i.content,
                updatedAt: i.updatedAt,
                tags: ['Apple Notes']
            }));
        } catch (e) {
            console.error('Failed to fetch Apple Notes:', e);
            throw new Error('Failed to extract notes via AppleScript. Ensure Meowdel has permissions.');
        }
    }

    async convertToMarkdown(item: ImportItem): Promise<string> {
        // Apple Notes body is usually HTML. We need to convert it to Markdown.
        // A simple regex approach or utilizing a lightweight HTML to MD converter.
        // For now, doing a basic manual sanitize since Apple Notes HTML is structured.
        
        let html = item.content;
        
        // Remove font tags, span tags but keep content
        html = html.replace(/<\/?(font|span|div)[^>]*>/gi, '');
        // Convert headers
        html = html.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (match, level, content) => {
            return `\n${'#'.repeat(Number(level))} ${content}\n`;
        });
        // Convert bold/italic
        html = html.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        html = html.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
        // Convert breaks/paragraphs
        html = html.replace(/<br\s*\/?>/gi, '\n');
        html = html.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
        // Convert lists
        html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        html = html.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
        
        // Remove remaining HTML tags
        html = html.replace(/<[^>]+>/g, '');
        
        // Decode common HTML entities
        html = html.replace(/&nbsp;/g, ' ')
                   .replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"')
                   .replace(/&#39;/g, "'");

        return html.trim();
    }
}
