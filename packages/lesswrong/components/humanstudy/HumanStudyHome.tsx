'use client';

import React, { useState } from 'react';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import PostsList2 from '@/components/posts/PostsList2';

const styles = defineStyles('HumanStudyHome', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    maxWidth: 1120,
    margin: '0 auto',
    padding: '42px 36px 80px',
    [theme.breakpoints.down('sm')]: { padding: '28px 20px 60px' },
  },
  hero: { paddingBottom: 30 },
  eyebrow: { color: theme.palette.primary.main, fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 12px' },
  title: { fontFamily: theme.palette.fonts.serifStack, color: theme.palette.text.primary, fontWeight: 400, fontSize: 34, lineHeight: 1.25, letterSpacing: '-.025em', margin: '0 0 10px', [theme.breakpoints.down('sm')]: { fontSize: 29 } },
  description: { color: theme.palette.text.secondary, fontSize: 14, lineHeight: 1.7, margin: 0 },
  content: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 212px', gap: 40, alignItems: 'start', [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr', gap: 32 } },
  discussions: {
    minWidth: 0,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', .09),
    borderRadius: 3,
    padding: '0 26px 10px',
    [theme.breakpoints.down('sm')]: { padding: '0 16px 8px' },
    '& .LWPostsItem-background': { background: 'transparent' },
    '& .LWPostsItem-bottomBorder': { borderBottom: theme.palette.greyBorder('1px', .09) },
    '& .LWPostsItem-postsItem': {
      display: 'grid',
      gridTemplateColumns: '26px minmax(0, 1fr) auto auto',
      columnGap: 12,
      rowGap: 8,
      padding: '23px 0',
      alignItems: 'center',
    },
    '& .LWPostsItem-title': {
      '&&': { gridColumn: '2 / -1', gridRow: 1, minWidth: 0, width: 'auto', maxWidth: 'none', height: 'auto', minHeight: 0, overflow: 'visible', margin: 0, padding: 0, top: 0 },
    },
    '& .PostsTitle-root': { fontSize: 22, lineHeight: 1.4, letterSpacing: '-.015em', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', marginRight: 0 },
    '& .LWPostsItem-karma': { gridColumn: 1, gridRow: '1 / 3', alignSelf: 'start', paddingTop: 5, width: 'auto', margin: 0, color: theme.palette.text.secondary, fontSize: 12 },
    '& .LWPostsItem-author': { '&&': { gridColumn: 2, gridRow: 2, flex: 'none', minWidth: 0, maxWidth: 'none', margin: 0, fontSize: 12, color: theme.palette.text.secondary } },
    '& .PostsItemDate-postedAt': { '&&': { gridColumn: 3, gridRow: 2, width: 'auto', fontSize: 12, fontWeight: 400, color: theme.palette.text.secondary } },
    '& .LWPostsItem-tertiaryRow': { gridColumn: 4, gridRow: 2, margin: 0 },
    '& .LWPostsItem-spacer, & .LWPostsItem-mobileSecondRowSpacer, & .LWPostsItem-mobileActions, & .LWPostsItem-mobileIcons': { display: 'none' },
    '& .PostsItemComments-commentsIconLarge': { display: 'flex', alignItems: 'center', gap: 5, width: 'auto', height: 18, top: 0, color: theme.palette.text.secondary },
    '& .PostsItemComments-commentCountIcon': { position: 'static', transform: 'none', width: 13, height: 13, opacity: .5 },
    '& .PostsItemComments-commentCount': { position: 'static', transform: 'none', fontFamily: theme.palette.fonts.sansSerifStack, fontSize: 12, lineHeight: 1, color: theme.palette.text.secondary, '& div': { margin: 0 } },
    '& .PostsTitle-interactionWrapper': { fontFamily: theme.palette.fonts.sansSerifStack, fontSize: 12, verticalAlign: 'middle', marginLeft: 8 },
  },
  controls: { display: 'flex', gap: 24, borderBottom: theme.palette.greyBorder('1px', .13), paddingTop: 20 },
  tab: { border: 0, background: 'none', padding: '0 0 14px', font: 'inherit', fontSize: 13, color: theme.palette.text.secondary, cursor: 'pointer', borderBottom: '2px solid transparent', '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 4 } },
  active: { color: theme.palette.primary.main, borderBottomColor: theme.palette.primary.main, fontWeight: 600 },
  aside: { paddingTop: 2, fontSize: 13, lineHeight: 1.8, color: theme.palette.text.secondary, '& h2': { fontFamily: theme.palette.fonts.serifStack, fontSize: 21, color: theme.palette.text.primary, fontWeight: 400, lineHeight: 1.4, margin: '0 0 12px' }, '& p': { margin: '0 0 24px' } },
  write: { display: 'block', padding: '9px 16px', marginBottom: 30, border: `1px solid ${theme.palette.primary.main}`, borderRadius: 3, color: theme.palette.primary.main, textAlign: 'center', fontWeight: 500, fontSize: 13, '&:hover': { background: theme.palette.greyAlpha(.035) } },
  asideLinks: { borderTop: theme.palette.greyBorder('1px', .12), paddingTop: 17 },
  link: { display: 'block', padding: '5px 0', color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } },
  footer: { marginTop: 28, paddingTop: 18, borderTop: theme.palette.greyBorder('1px', .12), fontSize: 11, color: theme.palette.text.secondary },
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
      <h1 id="forum-title" className={classes.title}>Understanding people, together.</h1>
      <p className={classes.description}>A place for questions, explanations, and evidence about people and society.</p>
    </section>
    <div className={classes.content}>
      <section aria-label="Discussions" className={classes.discussions}>
        <div className={classes.controls} role="tablist" aria-label="Discussion feed">
          {tabs.map(tab => <button key={tab.id} role="tab" aria-selected={feed === tab.id} className={classNames(classes.tab, feed === tab.id && classes.active)} onClick={() => setFeed(tab.id)}>{tab.label}</button>)}
        </div>
        <PostsList2 key={feed} terms={terms} showPostedAt hideTrailingButtons boxShadow={false} />
      </section>
      <aside className={classes.aside}>
        <Link to="/newPost" className={classes.write}>Start a discussion</Link>
        <h2>Welcome to the conversation</h2>
        <p>Bring a question, an observation, or an idea worth examining. Help each other understand it better.</p>
        <div className={classes.asideLinks}><Link to="/library" className={classes.link}>Reading collections ↗</Link>
        <Link to="/allPosts" className={classes.link}>All discussions ↗</Link>
        <a href="https://humanstudy-hub.com/studies" className={classes.link}>Explore studies ↗</a></div>
        <div className={classes.footer}>Built on <a href="https://github.com/ForumMagnum/ForumMagnum">ForumMagnum</a>.<br />A home for thoughtful inquiry.</div>
      </aside>
    </div>
  </main>;
}
