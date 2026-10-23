'use client';

import React, { useState } from 'react';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import PostsList2 from '@/components/posts/PostsList2';

const styles = defineStyles('HumanStudyHome', (theme: ThemeType) => ({
  root: { '& .PostsTitle-root': { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', lineHeight: 1.4 }, '& .LWPostsItem-title': { maxWidth: 'none', minWidth: 0, flex: 1 }, '& .LWPostsItem-author': { '&&': { flex: '0 0 auto' } }, '& .LWPostsItem-spacer': { display: 'none' }, fontFamily: theme.palette.fonts.sansSerifStack, maxWidth: 1060, margin: '0 auto', padding: '56px 36px 80px', [theme.breakpoints.down('sm')]: { padding: '32px 20px 60px' } },
  hero: { paddingBottom: 38, borderBottom: theme.palette.greyBorder('1px', .12) },
  eyebrow: { color: theme.palette.primary.main, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 20px' },
  title: { fontFamily: theme.palette.fonts.serifStack, fontWeight: 400, fontSize: 54, lineHeight: 1.15, letterSpacing: '-0.025em', margin: '0 0 18px', maxWidth: 740, [theme.breakpoints.down('sm')]: { fontSize: 38 } },
  description: { color: theme.palette.text.secondary, fontSize: 17, lineHeight: 1.65, maxWidth: 650, margin: 0 },
  content: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 208px', gap: 56, paddingTop: 28, [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr', gap: 32 } },
  controls: { display: 'flex', gap: 24, borderBottom: theme.palette.greyBorder('1px', .12), marginBottom: 12 },
  tab: { border: 0, background: 'none', padding: '0 0 14px', font: 'inherit', fontSize: 14, color: theme.palette.text.secondary, cursor: 'pointer', borderBottom: '2px solid transparent', '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 4 } },
  active: { color: theme.palette.primary.main, borderBottomColor: theme.palette.primary.main, fontWeight: 600 },
  aside: { fontSize: 14, lineHeight: 1.75, color: theme.palette.text.secondary, '& h2': { fontSize: 14, color: theme.palette.text.primary, fontWeight: 600, margin: '0 0 12px' }, '& p': { margin: '0 0 20px' } },
  write: { display: 'block', padding: '10px 16px', marginBottom: 28, borderRadius: 4, background: theme.palette.primary.main, color: theme.palette.primary.contrastText, textAlign: 'center', fontWeight: 500, '&:hover': { opacity: .88 } },
  link: { display: 'block', padding: '5px 0', color: theme.palette.primary.main },
  footer: { marginTop: 40, paddingTop: 16, borderTop: theme.palette.greyBorder('1px', .12), fontSize: 12 },
}));

const tabs = [{ id: 'new', label: 'Latest' }, { id: 'top', label: 'Top' }, { id: 'questions', label: 'Questions' }] as const;
type Feed = typeof tabs[number]['id'];

export default function HumanStudyHome() {
  const classes = useStyles(styles);
  const [feed, setFeed] = useState<Feed>('new');
  const terms: PostsViewTerms = { view: 'new', sortedBy: feed === 'top' ? 'top' : 'new', limit: 20, ...(feed === 'questions' ? { question: true } : {}) };
  return <main className={classes.root}>
    <section className={classes.hero} aria-labelledby="forum-title">
      <p className={classes.eyebrow}>The HumanStudy community</p>
      <h1 id="forum-title" className={classes.title}>Understanding people.<br />Thinking together.</h1>
      <p className={classes.description}>A place for questions, explanations, and evidence about people and society.</p>
    </section>
    <div className={classes.content}>
      <section aria-label="Discussions">
        <div className={classes.controls} role="tablist" aria-label="Discussion feed">
          {tabs.map(tab => <button key={tab.id} role="tab" aria-selected={feed === tab.id} className={classNames(classes.tab, feed === tab.id && classes.active)} onClick={() => setFeed(tab.id)}>{tab.label}</button>)}
        </div>
        <PostsList2 key={feed} terms={terms} showPostedAt hideTrailingButtons boxShadow={false} />
      </section>
      <aside className={classes.aside}>
        <Link to="/newPost" className={classes.write}>Start a discussion</Link>
        <h2>Welcome to the conversation</h2>
        <p>Bring a question, an observation, or an idea worth examining. Help each other understand it better.</p>
        <Link to="/library" className={classes.link}>Reading collections ↗</Link>
        <Link to="/allPosts" className={classes.link}>All discussions ↗</Link>
        <a href="https://humanstudy-hub.com/studies" className={classes.link}>Explore studies ↗</a>
        <div className={classes.footer}>Built on <a href="https://github.com/ForumMagnum/ForumMagnum">ForumMagnum</a>.<br />A home for thoughtful inquiry.</div>
      </aside>
    </div>
  </main>;
}
