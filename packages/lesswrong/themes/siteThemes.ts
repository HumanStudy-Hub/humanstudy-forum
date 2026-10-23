import { humanStudyForumSetting, type ForumTypeString } from '@/lib/instanceSettings';
import { humanStudyTheme } from './humanStudyTheme';

export const lessWrongTheme: SiteThemeSpecification = {
  componentPalette: (dark: boolean) => ({
  }),
  make: (palette: ThemePalette) => ({
    isLW: true,
    isAF: false,
  }),
};
export const alignmentForumTheme: SiteThemeSpecification = {
  componentPalette: (dark: boolean) => ({
  }),
  make: (palette: ThemePalette) => ({
    isLW: false,
    isAF: true,
  }),
};

export const getSiteTheme = (forumType: ForumTypeString): SiteThemeSpecification => {
  if (humanStudyForumSetting.get(forumType)) return humanStudyTheme;
  if (forumType === 'AlignmentForum') return alignmentForumTheme;
  else return lessWrongTheme;
}
