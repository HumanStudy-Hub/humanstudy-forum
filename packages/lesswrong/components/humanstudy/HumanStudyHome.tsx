'use client';

import React, { useState } from 'react';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useForumType } from '@/components/hooks/useForumType';
import { humanStudyFeaturedPostIdSetting } from '@/lib/instanceSettings';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import PostsList2 from '@/components/posts/PostsList2';
import SingleColumnSection from '@/components/common/SingleColumnSection';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';

const featuredPostQuery = gql(`
  query HumanStudyFeaturedPost($documentId: String!) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        _id
        title
        slug
        user { _id displayName }
        contents { _id plaintextDescription }
      }
    }
  }
`);

const styles = defineStyles('HumanStudyHome', (theme: ThemeType) => ({
  root: { paddingBottom: 56 },
  featured: { background: theme.palette.panelBackground.translucent3, padding: '20px 24px', marginBottom: 28, [theme.breakpoints.down('sm')]: { padding: '18px 16px' } },
  kicker: { ...theme.typography.commentStyle, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: theme.palette.primary.main, margin: '0 0 8px' },
  title: { ...theme.typography.headerStyle, fontFamily: theme.palette.fonts.headerStack, fontSize: 28, fontWeight: 400, lineHeight: 1.25, margin: '0 0 12px' },
  excerpt: { ...theme.typography.commentStyle, fontSize: 15, lineHeight: 1.65, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  read: { color: theme.palette.primary.main, marginLeft: 16 },
  byline: { ...theme.typography.commentStyle, fontSize: 13, color: theme.palette.text.dim3 },
  controls: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  tab: { ...theme.typography.commentStyle, fontSize: 13, border: 0, borderRadius: 2, padding: '6px 16px', background: theme.palette.panelBackground.default, color: theme.palette.text.dim3, cursor: 'pointer', '&:hover': { color: theme.palette.text.normal } },
  active: { background: theme.palette.primary.main, color: theme.palette.primary.contrastText, '&:hover': { color: theme.palette.primary.contrastText } },
  write: { ...theme.typography.commentStyle, marginLeft: 'auto', fontSize: 13, padding: '6px 0 6px 12px', color: theme.palette.text.dim3, '&:hover': { color: theme.palette.primary.main } },
  footer: { ...theme.typography.commentStyle, fontSize: 12, color: theme.palette.text.dim3, marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: '8px 20px' },
}));

const tabs = [{ id: 'new', label: 'Recent' }, { id: 'top', label: 'Top' }, { id: 'questions', label: 'Questions' }] as const;
type Feed = typeof tabs[number]['id'];

function FeaturedDiscussion({ documentId }: { documentId: string }) {
  const classes = useStyles(styles);
  const { data } = useQuery(featuredPostQuery, { variables: { documentId } });
  const post = data?.post?.result;
  if (!post) return null;
  return <section className={classes.featured} aria-label="Featured discussion">
    <p className={classes.kicker}>Field notes · Example discussion</p>
    <h1 className={classes.title}><Link to={`/posts/${post._id}/${post.slug}`}>{post.title}</Link></h1>
    <p className={classes.excerpt}>{post.contents?.plaintextDescription}</p>
    <div className={classes.byline}>by {post.user?.displayName}<Link to={`/posts/${post._id}/${post.slug}`} className={classes.read}>Read discussion →</Link></div>
  </section>;
}

export default function HumanStudyHome() {
  const classes = useStyles(styles);
  const { forumType } = useForumType();
  const featuredPostId = humanStudyFeaturedPostIdSetting.get(forumType);
  const [feed, setFeed] = useState<Feed>('new');
  const terms: PostsViewTerms = { view: 'new', sortedBy: feed === 'top' ? 'top' : 'new', limit: 20, ...(feed === 'questions' ? { question: true } : {}) };
  return <main className={classes.root}>
    <SingleColumnSection>
      {featuredPostId && <SuspenseWrapper name="HumanStudyFeatured"><FeaturedDiscussion documentId={featuredPostId} /></SuspenseWrapper>}
      <section aria-label="Discussions">
        <div className={classes.controls} role="tablist" aria-label="Discussion feed">
          {tabs.map(tab => <button key={tab.id} role="tab" aria-selected={feed === tab.id} className={classNames(classes.tab, feed === tab.id && classes.active)} onClick={() => setFeed(tab.id)}>{tab.label}</button>)}
          <Link to="/newPost" className={classes.write}>Write a post</Link>
        </div>
        <PostsList2 key={feed} terms={terms} showPostedAt hideTrailingButtons boxShadow={false} />
      </section>
      <footer className={classes.footer}>
        <Link to="/posts/hsExampleWelcome001/a-place-to-think-together">About HumanStudy</Link>
        <a href="https://humanstudy-hub.com">HumanStudy Hub ↗</a>
        <a href="https://github.com/ForumMagnum/ForumMagnum">Powered by ForumMagnum</a>
      </footer>
    </SingleColumnSection>
  </main>;
}
