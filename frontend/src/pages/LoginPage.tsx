import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { api } from "../lib/api";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  const [tab, setTab] = useState<"login" | "create">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [roles, setRoles] = useState<Array<{ value: string; label: string }>>([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "RECEPTION",
    first_name: "",
    last_name: "",
    email: "",
  });

  const recentUsers = useMemo(() => {
    try {
      const raw = localStorage.getItem("hms_recent_users");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    api
      .get("/roles/")
      .then((res) => setRoles(res.data))
      .catch(() => setRoles([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      try {
        const updated = Array.from(new Set([username, ...recentUsers])).slice(0, 8);
        localStorage.setItem("hms_recent_users", JSON.stringify(updated));
      } catch {}
      navigate(from, { replace: true });
    } catch (err) {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/register/", newUser);
      setUsername(newUser.username);
      setPassword(newUser.password);
      setTab("login");
    } catch (err: any) {
      const data = err?.response?.data;
      if (typeof data === "string") {
        setError(data);
      } else if (data?.detail) {
        setError(String(data.detail));
      } else if (data && typeof data === "object") {
        // Surface serializer validation errors (field -> message list)
        const flat = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
          .join(" | ");
        setError(flat || "Failed to create user.");
      } else {
        setError("Failed to create user. Make sure backend is running and registration is enabled.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", bgcolor: "background.default" }}>
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4">HMS</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Login or create a demo user to access role dashboards.
              </Typography>

              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab value="login" label="Login" />
                <Tab value="create" label="Create user (dev)" />
              </Tabs>

              {error && <Alert severity="error">{error}</Alert>}

              {tab === "login" ? (
                <form onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      fullWidth
                      autoFocus
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      fullWidth
                    />

                    {recentUsers.length > 0 && (
                      <>
                        <Divider />
                        <TextField
                          select
                          label="Quick switch (fills username)"
                          value=""
                          onChange={(e) => setUsername(e.target.value)}
                          helperText="This just helps you switch accounts faster."
                          fullWidth
                        >
                          {recentUsers.map((u) => (
                            <MenuItem key={u} value={u}>
                              {u}
                            </MenuItem>
                          ))}
                        </TextField>
                      </>
                    )}

                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                      {loading ? "Signing in..." : "Sign in"}
                    </Button>
                  </Stack>
                </form>
              ) : (
                <form onSubmit={handleCreateUser}>
                  <Stack spacing={2}>
                    <TextField
                      label="Username"
                      value={newUser.username}
                      onChange={(e) => setNewUser((s) => ({ ...s, username: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
                      helperText="Min 8 chars (Django password validation)."
                      fullWidth
                    />
                    <TextField
                      select
                      label="Role"
                      value={newUser.role}
                      onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}
                      fullWidth
                    >
                      {(roles.length ? roles : [{ value: "RECEPTION", label: "Reception" }]).map((r) => (
                        <MenuItem key={r.value} value={r.value}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="First name"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser((s) => ({ ...s, first_name: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="Last name"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser((s) => ({ ...s, last_name: e.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <TextField
                      label="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
                      fullWidth
                    />
                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                      {loading ? "Creating..." : "Create user"}
                    </Button>
                    <Alert severity="info">
                      User creation works only while backend runs with <b>DJANGO_DEBUG=1</b>.
                    </Alert>
                  </Stack>
                </form>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;

