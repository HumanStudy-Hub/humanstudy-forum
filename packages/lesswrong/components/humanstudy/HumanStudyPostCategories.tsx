'use client';

import React from 'react';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { tagGetUrl } from '@/lib/collections/tags/helpers';

type CategoryTag = { _id: string, name: string, slug: string, core?: boolean | null };

const styles = defineStyles('HumanStudyPostCategories', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  compact: {
    display: 'inline-flex',
    marginTop: 0,
    marginLeft: 8,
    gap: 4,
    verticalAlign: 'middle',
  },
  chip: {
    ...theme.typography.commentStyle,
    fontSize: 12,
    lineHeight: '18px',
    padding: '1px 8px',
    borderRadius: 2,
    background: theme.palette.panelBackground.translucent3,
    color: theme.palette.primary.main,
    whiteSpace: 'nowrap',
    '&:hover': { opacity: 1, textDecoration: 'none', background: theme.palette.panelBackground.translucent2 },
  },
  compactChip: {
    fontSize: 11,
    lineHeight: '16px',
    padding: '0 6px',
  },
  otherTag: {
    color: theme.palette.text.dim3,
  },
}));

/** Link for a category: the home feed filtered to that category. */
export const humanStudyCategoryUrl = (slug: string) => `/?category=${encodeURIComponent(slug)}`;

/**
 * HumanStudy: shows a post's categories (core tags) as chips. On the post page
 * (not compact) other, member-created tags follow in a quieter style.
 */
const HumanStudyPostCategories = ({ tags, compact = false }: {
  tags: ReadonlyArray<CategoryTag | null> | null | undefined,
  compact?: boolean,
}) => {
  const classes = useStyles(styles);
  const all = (tags ?? []).filter((t): t is CategoryTag => !!t);
  const categories = all.filter(t => t.core);
  const others = compact ? [] : all.filter(t => !t.core);
  if (!categories.length && !others.length) return null;

  return <span className={classNames(classes.root, compact && classes.compact)}>
    {categories.map(tag => <Link
      key={tag._id}
      to={humanStudyCategoryUrl(tag.slug)}
      className={classNames(classes.chip, compact && classes.compactChip)}
      onClick={(ev: React.MouseEvent) => ev.stopPropagation()}
    >
      {tag.name}
    </Link>)}
    {others.map(tag => <Link
      key={tag._id}
      to={tagGetUrl(tag)}
      className={classNames(classes.chip, classes.otherTag)}
    >
      #{tag.name}
    </Link>)}
  </span>;
};

export default HumanStudyPostCategories;
