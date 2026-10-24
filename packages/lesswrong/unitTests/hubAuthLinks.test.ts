import { forumReturnPath, hubAccountUrl } from '../lib/auth/hubAuthLinks';

describe('shared account return URLs', () => {
  it.each([
    'https://example.com/steal',
    '//example.com/steal',
    '/\\example.com/steal',
    '/login',
    '/login/',
    '/logout/',
    '/auth',
    '/auth/hub/refresh?returnTo=/login',
  ])('does not send account returns to an external origin or authentication loop: %s', (value) => {
    expect(forumReturnPath(value)).toBe('/');
  });

  it('retains the article, query and comment anchor after account authentication', () => {
    expect(forumReturnPath('/posts/abc/paper?tab=comments#comment-123'))
      .toBe('/posts/abc/paper?tab=comments#comment-123');
  });

  it('keeps return URLs as encoded data on the central account origin', () => {
    const returnTo = 'https://forum.humanstudy-hub.com/posts/abc?tab=comments#comment-123';
    const target = new URL(hubAccountUrl('https://humanstudy-hub.com', returnTo, 'logout'));
    expect(target.origin).toBe('https://humanstudy-hub.com');
    expect(target.pathname).toBe('/account');
    expect(target.searchParams.get('returnTo')).toBe(returnTo);
    expect(target.searchParams.get('action')).toBe('logout');
  });
});
