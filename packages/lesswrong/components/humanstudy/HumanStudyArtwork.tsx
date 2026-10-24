'use client';

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('HumanStudyArtwork', () => ({
  root: { position: 'absolute', top: 90, right: 12, width: 'min(27vw, 390px)', pointerEvents: 'none', userSelect: 'none', '@media (max-width: 1199px)': { display: 'none' }, '@media print': { display: 'none' } },
  image: { display: 'block', width: '100%', height: 'auto' },
}));

export default function HumanStudyArtwork() {
  const classes = useStyles(styles);
  return <div className={classes.root} aria-hidden="true">
    <img src="/humanstudy/field-notes-v1.png" alt="" width={1024} height={1536} className={classes.image} decoding="async" loading="lazy" />
  </div>;
}
