import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Alert,
  Avatar,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Visibility from '@mui/icons-material/Visibility'
import { useSignIn } from '@/features/login-form/useSignIn'

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("LoginPage");

  const { error, isSubmitting, handleSubmit } = useSignIn(t);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={[
          {
            width: "100%",
            maxWidth: 380,
            p: 4,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
          },
          (theme) =>
            theme.applyStyles("dark", {
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            }),
        ]}
      >
        <Stack spacing={1} sx={{ mb: 3, alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            {t("title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("subtitle")}
          </Typography>
        </Stack>

        <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
          <TextField
            label={t("email")}
            name="emailAddress"
            type="email"
            autoComplete="email"
            required
            fullWidth
          />
          <TextField
            label={t("password")}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                      onClick={() => setShowPassword((value) => !value)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            loading={isSubmitting}
          >
            {t("submit")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
