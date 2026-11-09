'use client';

import React, { useState } from 'react';
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
  more: {
    ...theme.typography.commentStyle,
    fontSize: 11,
    lineHeight: '16px',
    padding: '0 5px',
    border: 0,
    borderRadius: 2,
    cursor: 'pointer',
    background: 'transparent',
    color: theme.palette.text.dim3,
    '&:hover': { color: theme.palette.primary.main },
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
  const [expanded, setExpanded] = useState(false);
  const all = (tags ?? []).filter((t): t is CategoryTag => !!t);
  const categories = all.filter(t => t.core);
  const others = compact ? [] : all.filter(t => !t.core);
  if (!categories.length && !others.length) return null;
  // In post lists show one category and a "+N" toggle for the rest, so titles keep their room.
  const hiddenCount = compact && !expanded ? Math.max(categories.length - 1, 0) : 0;
  const shownCategories = hiddenCount ? categories.slice(0, 1) : categories;

  return <span className={classNames(classes.root, compact && classes.compact)}>
    {shownCategories.map(tag => <Link
      key={tag._id}
      to={humanStudyCategoryUrl(tag.slug)}
      className={classNames(classes.chip, compact && classes.compactChip)}
      onClick={(ev: React.MouseEvent) => ev.stopPropagation()}
    >
      {tag.name}
    </Link>)}
    {compact && categories.length > 1 && <button
      type="button"
      className={classes.more}
      title={expanded ? "Show fewer categories" : categories.slice(1).map(t => t.name).join(", ")}
      aria-expanded={expanded}
      onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setExpanded(!expanded); }}
    >
      {expanded ? "−" : `+${hiddenCount}`}
    </button>}
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
