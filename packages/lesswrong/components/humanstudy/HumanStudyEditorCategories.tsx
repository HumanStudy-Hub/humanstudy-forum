'use client';

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useCoreTags } from '@/components/tagging/useCoreTags';

const styles = defineStyles('HumanStudyEditorCategories', (theme: ThemeType) => ({
  root: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    padding: '2px 10px',
    borderRadius: 2,
    border: `1px solid ${theme.palette.grey[300]}`,
    background: 'transparent',
    color: theme.palette.text.dim3,
    cursor: 'pointer',
    '&:hover': { borderColor: theme.palette.primary.main, color: theme.palette.primary.main },
    '&:disabled': { cursor: 'wait', opacity: 0.6 },
  },
  selected: {
    borderColor: theme.palette.primary.main,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': { color: theme.palette.primary.contrastText, opacity: 0.85 },
  },
  error: { ...theme.typography.commentStyle, fontSize: 12, color: theme.palette.error.main },
}));

type TagRelevance = Record<string, number>;

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch('/graphql', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

async function fetchTagRelevance(postId: string): Promise<TagRelevance> {
  const data = await graphql<{ post: { result: { tagRelevance: TagRelevance | null } | null } }>(
    `query humanStudyPostTagRelevance($id: String) { post(input: { selector: { _id: $id } }) { result { tagRelevance } } }`,
    { id: postId },
  );
  return data.post?.result?.tagRelevance ?? {};
}

/**
 * HumanStudy editor: pick the post's categories (core tags) from a fixed list.
 * Each click saves immediately. The new tag set is computed from the post's
 * current server-side tags, so tags added elsewhere (e.g. "+ Add tag") are kept.
 */
const HumanStudyEditorCategories = ({ postId, onChange }: {
  postId: string,
  onChange?: () => void,
}) => {
  const classes = useStyles(styles);
  const { data } = useCoreTags();
  const categories = data?.tags?.results ?? [];
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTagRelevance(postId)
      .then(relevance => { if (!cancelled) setSelected(new Set(Object.keys(relevance))); })
      .catch(() => { if (!cancelled) setSelected(new Set()); });
    return () => { cancelled = true; };
  }, [postId]);

  const toggle = async (tagId: string) => {
    setSaving(true);
    setError(null);
    try {
      const relevance = { ...(await fetchTagRelevance(postId)) };
      if (relevance[tagId]) delete relevance[tagId];
      else relevance[tagId] = 1;
      const result = await graphql<{ updatePost: { data: { tagRelevance: TagRelevance | null } } }>(
        `mutation humanStudySetPostCategories($id: String!, $data: UpdatePostDataInput!) {
          updatePost(selector: { _id: $id }, data: $data) { data { _id tagRelevance } }
        }`,
        { id: postId, data: { tagRelevance: relevance } },
      );
      setSelected(new Set(Object.keys(result.updatePost.data.tagRelevance ?? {})));
      onChange?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!categories.length) return null;
  return <span className={classes.root} role="group" aria-label="Categories">
    {categories.map(tag => {
      const isSelected = !!selected?.has(tag._id);
      return <button
        key={tag._id}
        type="button"
        className={classNames(classes.chip, isSelected && classes.selected)}
        aria-pressed={isSelected}
        disabled={saving || !selected}
        onClick={() => void toggle(tag._id)}
      >
        {tag.name}
      </button>;
    })}
    {error && <span className={classes.error}>{error}</span>}
  </span>;
};

export default HumanStudyEditorCategories;
