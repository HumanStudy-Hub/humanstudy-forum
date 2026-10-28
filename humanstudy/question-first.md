# Question-first home

Keep the ForumMagnum instance, native post types, editor, answers/comments, votes
and moderation. Change the homepage priority rather than introduce another forum.

- Questions are the default feed. The primary action opens the native editor at
  `/newPost?category=question`, which preselects the existing question category.
- Discussions and articles are available through the second feed. It shows native
  non-question posts, keeping both short discussions and long essays accessible.
  No new distinction between a discussion and an essay is imposed on authors.
- The configured featured discussion appears after that secondary feed, rather
  than placing a blog-style feature above the default questions.
- Both feeds retain Recent and Top sorting using their native named views.
  These are existing chronological/score sorts, not personalized recommendations.
- Questions, including critical questions about AI, use the same native workflow;
  no stance-specific filter or promised response time is introduced.

This change adds no database fields, data migration or new publishing workflow.
The existing example posts remain explicitly examples. Replacing examples with
real community contributions is separate editorial work.
