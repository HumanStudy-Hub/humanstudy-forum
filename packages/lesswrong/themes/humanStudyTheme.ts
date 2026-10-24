export const humanStudyTheme: SiteThemeSpecification = {
  componentPalette: (dark) => ({
    primary: { main: dark ? '#9dbec0' : '#5e7e83', dark: '#3c5f64', light: '#c0d4d5', contrastText: '#ffffff' },
    secondary: { main: dark ? '#9dbec0' : '#5e7e83', dark: '#3c5f64', light: '#c0d4d5', contrastText: '#ffffff' },
  }),
  make: () => ({ isLW: true, isAF: false }),
};
