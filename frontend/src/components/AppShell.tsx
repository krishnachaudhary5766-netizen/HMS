import React from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useAuth } from "../auth";

const AppShell: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant={isSm ? "subtitle1" : "h6"} sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, display: { xs: "none", sm: "block" } }}>
            {user?.username} · {user?.role}
          </Typography>
          <Button variant="contained" color="primary" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default AppShell;

