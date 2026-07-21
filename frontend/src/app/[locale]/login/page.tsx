"use client";

import { useState } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useTranslations } from 'next-intl'
import { Avatar, Box, Button, IconButton, InputAdornment, Paper, Stack, TextField, Typography, } from '@mui/material'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("LoginPage");

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

        <Stack component="form" spacing={2.5}>
          <TextField
            label={t("email")}
            name="email"
            type="email"
            autoComplete="email"
            fullWidth
          />
          <TextField
            label={t("password")}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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
          <Button type="submit" variant="contained" size="large" fullWidth>
            {t("submit")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
