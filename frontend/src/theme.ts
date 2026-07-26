import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 700,

    h1: { fontSize: 48 },
    h2: { fontSize: 42 },
    h3: { fontSize: 36 },
    h4: { fontSize: 26 },
    h5: { fontSize: 20 },
    h6: { fontSize: 18 },
    subtitle1: { fontSize: 18 },
    body1: { fontSize: 16 },
    button: { textTransform: 'none' },
  },
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
});

export default theme;
