import fs from 'fs';
import path from 'path';

export interface HelpContent {
  globalHelp: string;
  filterHelp: string;
  authentihashHelp: string;
}

export interface TermsResponse {
  success: boolean;
  content: string;
}

let cachedContent: HelpContent | null = null;
let cachedTerms: string | null = null;

export async function getHelpContent(type?: string): Promise<HelpContent | TermsResponse> {
  if (type === 'terms') {
    if (cachedTerms) {
      return { success: true, content: cachedTerms };
    }

    try {
      const contentDir = path.join(process.cwd(), 'src', 'content');
      const termsPath = path.join(contentDir, 'terms.md');
      
      const termsContent = fs.readFileSync(termsPath, 'utf-8');
      cachedTerms = termsContent;
      
      return { success: true, content: termsContent };
    } catch (error) {
      console.error('Error loading terms content:', error);
      return { success: false, content: '# Terms content not available' };
    }
  }

  // Default help content logic
  if (cachedContent) {
    return cachedContent;
  }

  try {
    const contentDir = path.join(process.cwd(), 'src', 'content');
    
    const globalHelpPath = path.join(contentDir, 'global-help.md');
    const filterHelpPath = path.join(contentDir, 'filter-help.md');
    const authentihashHelpPath = path.join(contentDir, 'authentihash-help.md');
    
    const globalHelp = fs.readFileSync(globalHelpPath, 'utf-8');
    const filterHelp = fs.readFileSync(filterHelpPath, 'utf-8');
    const authentihashHelp = fs.readFileSync(authentihashHelpPath, 'utf-8');
    
    cachedContent = {
      globalHelp,
      filterHelp,
      authentihashHelp
    };
    
    return cachedContent;
  } catch (error) {
    console.error('Error loading help content:', error);
    return {
      globalHelp: '# Help content not available',
      filterHelp: '# Filter help content not available',
      authentihashHelp: '# Authentihash help content not available'
    };
  }
}
