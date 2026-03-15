export interface ImportItem {
    id: string;
    title: string;
    content: string; // raw content or HTML depending on platform
    url?: string;
    updatedAt?: string;
    tags?: string[];
}

export interface ExtImporter {
    platform: 'notion' | 'google' | 'microsoft' | 'apple';
    
    // Verify credentials and basic access
    authenticate(credentials?: any): Promise<boolean>;
    
    // Fetch the list/content of all items available
    fetchItems(): Promise<ImportItem[]>;
    
    // Convert the raw item into clean Markdown
    convertToMarkdown(item: ImportItem): Promise<string>;
}
