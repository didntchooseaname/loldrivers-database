import fs from 'fs';
import path from 'path';

export interface HelpContent {
  globalHelp: string;
  filterHelp: string;
}

let cachedContent: HelpContent | null = null;

export async function getHelpContent(): Promise<HelpContent> {
  if (cachedContent) {
    return cachedContent;
  }

  try {
    const contentDir = path.join(process.cwd(), 'src', 'content');
    
    const globalHelpPath = path.join(contentDir, 'global-help.md');
    const filterHelpPath = path.join(contentDir, 'filter-help.md');
    
    const globalHelp = fs.readFileSync(globalHelpPath, 'utf-8');
    const filterHelp = fs.readFileSync(filterHelpPath, 'utf-8');
    
    cachedContent = {
      globalHelp,
      filterHelp
    };
    
    return cachedContent;
  } catch (error) {
    console.error('Error loading help content:', error);
    return {
      globalHelp: '# Help content not available',
      filterHelp: '# Filter help content not available'
    };
  }
}
