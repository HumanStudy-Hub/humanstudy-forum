'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SequencesGridWrapper from '@/components/sequences/SequencesGridWrapper';
import { Link } from '@/lib/reactRouterWrapper';

const styles = defineStyles('HumanStudyReading', (theme: ThemeType) => ({
  root: { maxWidth: 1000, margin: '0 auto', padding: '56px 28px 80px', fontFamily: theme.palette.fonts.sansSerifStack },
  heading: { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 },
  title: { fontFamily: theme.palette.fonts.serifStack, fontSize: 40, fontWeight: 400, margin: 0 },
  create: { color: theme.palette.primary.main, fontSize: 14, padding: '10px 14px', border: `1px solid ${theme.palette.primary.main}`, borderRadius: 4 },
  description: { color: theme.palette.text.secondary, fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 650 },
}));

export default function HumanStudyReading() {
  const classes = useStyles(styles);
  return <main className={classes.root}>
    <div className={classes.heading}><h1 className={classes.title}>Reading together</h1><Link className={classes.create} to="/sequencesNew">Create a collection</Link></div>
    <p className={classes.description}>Collect related essays into a path others can follow. Start with a question, connect useful discussions, and let a shared understanding grow.</p>
    <SequencesGridWrapper terms={{ view: 'communitySequences', limit: 12 }} itemsPerPage={12} showAuthor showLoadMore />
  </main>;
}
