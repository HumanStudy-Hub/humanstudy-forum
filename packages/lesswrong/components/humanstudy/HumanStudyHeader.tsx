'use client';

import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { useCurrentUserId } from '@/components/common/withUser';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { LWUsersAccountMenu } from '@/components/users/UsersAccountMenu';
import UsersMenu from '@/components/users/UsersMenu';

const styles = defineStyles('HumanStudyHeader', (theme: ThemeType) => ({
  root: { fontFamily: theme.palette.fonts.sansSerifStack, position: 'relative', top: 0, left: 0, right: 0, height: 64, zIndex: 100, background: theme.palette.header.background, borderBottom: theme.palette.greyBorder('1px', .1) },
  inner: { height: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 36, [theme.breakpoints.down('sm')]: { padding: '0 20px', gap: 20 } },
  brand: { color: theme.palette.header.text, fontFamily: theme.palette.fonts.serifStack, fontSize: 25, fontWeight: 700, letterSpacing: '-.03em', whiteSpace: 'nowrap', '& span': { fontFamily: theme.palette.fonts.sansSerifStack, color: theme.palette.text.secondary, fontSize: 13, fontWeight: 400, letterSpacing: 0, marginLeft: 10 }, [theme.breakpoints.down('xs')]: { '& span': { display: 'none' } } },
  nav: { display: 'flex', gap: 24, alignItems: 'center', fontSize: 14, color: theme.palette.text.secondary, [theme.breakpoints.down('sm')]: { display: 'none' } },
  account: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18, fontSize: 14 },
  search: { color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } },
}));

export default function HumanStudyHeader() {
  const classes = useStyles(styles);
  const userId = useCurrentUserId();
  return <header className={classes.root}>
    <div className={classes.inner}>
      <Link to="/" className={classes.brand}>HumanStudy<span>Forum</span></Link>
      <nav className={classes.nav} aria-label="Main navigation">
        <Link to="/">Discussions</Link>
        <Link to="/library">Reading</Link>
        <a href="https://humanstudy-hub.com">HumanStudy Hub ↗</a>
      </nav>
      <div className={classes.account}>
        {userId ? <UsersMenu /> : <LWUsersAccountMenu />}
      </div>
    </div>
  </header>;
}
