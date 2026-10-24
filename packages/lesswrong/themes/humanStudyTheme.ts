const sans = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const serif = 'Georgia, Cambria, "Times New Roman", serif';

export const humanStudyTheme: SiteThemeSpecification = {
  componentPalette: (dark) => ({
    fonts: { sansSerifStack: sans, serifStack: serif, headerStack: sans },
    primary: { main: dark ? '#80c5cd' : '#155e75', dark: '#164e63', light: '#a5d9dd', contrastText: '#ffffff' },
    secondary: { main: dark ? '#80c5cd' : '#155e75', dark: '#164e63', light: '#a5d9dd', contrastText: '#ffffff' },
    header: { background: dark ? '#192628' : '#ffffff', text: dark ? '#e5eeee' : '#19383d' },
    background: { default: dark ? '#142123' : '#f6f5f1' },
  }),
  make: (palette) => ({
    isLW: true,
    isAF: false,
    typography: {
      fontFamily: sans,
      body1: { fontFamily: sans, fontSize: 16, lineHeight: '25px' },
      postsItemTitle: { fontSize: 22 },
      postStyle: { fontFamily: serif, fontSize: 19, lineHeight: '1.8', color: palette.text.primary },
      commentStyle: { fontFamily: sans, fontSize: 16, lineHeight: '1.75' },
    },
  }),
};
