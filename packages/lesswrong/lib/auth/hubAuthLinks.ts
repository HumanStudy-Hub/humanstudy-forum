export function forumReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try {
    const parsed = new URL(value, 'https://forum.humanstudy-hub.com');
    if (parsed.origin !== 'https://forum.humanstudy-hub.com') return '/';
    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (pathname === '/auth' || pathname.startsWith('/auth/') || pathname === '/login' || pathname === '/logout') return '/';
    return parsed.pathname + parsed.search + parsed.hash;
  } catch { return '/'; }
}

export function hubAccountUrl(origin: string, returnTo: string, action?: 'logout' | 'recovery'): string {
  const account = new URL('/account', origin);
  account.searchParams.set('returnTo', returnTo);
  if (action === 'logout') account.searchParams.set('action', 'logout');
  if (action === 'recovery') account.searchParams.set('mode', 'recovery');
  return account.toString();
}
