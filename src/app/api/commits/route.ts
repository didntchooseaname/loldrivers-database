import { NextResponse } from 'next/server';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const per_page = searchParams.get('per_page') || '50';
  const page = searchParams.get('page') || '1';

  try {
    const response = await fetch(
      `https://api.github.com/repos/didntchooseaname/loldrivers-database/commits?per_page=${per_page}&page=${page}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'LOLDrivers-Database',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const commits: Commit[] = await response.json();

    // Process commits for better frontend consumption
    const processedCommits = commits.map(commit => {
      const lines = commit.commit.message.split('\n').filter(line => line.trim());
      const title = lines[0] || 'No commit message';
      const description = lines.slice(1).join('\n').trim();

      return {
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        title,
        description,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
          github: commit.author ? {
            login: commit.author.login,
            avatar_url: commit.author.avatar_url,
            html_url: commit.author.html_url,
          } : null,
        },
        html_url: commit.html_url,
        timestamp: new Date(commit.commit.author.date).getTime(),
      };
    });

    return NextResponse.json({
      success: true,
      data: processedCommits,
      meta: {
        total: processedCommits.length,
        page: parseInt(page),
        per_page: parseInt(per_page),
        last_updated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Failed to fetch commits:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch commits from GitHub',
        data: [],
        meta: {
          total: 0,
          page: parseInt(page),
          per_page: parseInt(per_page),
          last_updated: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Add CORS headers for potential external usage
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
