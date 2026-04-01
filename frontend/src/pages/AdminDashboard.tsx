import React, { useMemo, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import { api } from "../lib/api";

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
};

const AdminDashboard: React.FC = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Array<{ value: string; label: string }>>([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "RECEPTION",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<User[]>("/users/")).data,
  });

  useQuery({
    queryKey: ["roles"],
    queryFn: async () => (await api.get("/roles/")).data as Array<{ value: string; label: string }>,
    onSuccess: (data) => setRoles(data),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      await api.post("/users/", form);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setForm({ username: "", password: "", email: "", first_name: "", last_name: "", role: "RECEPTION" });
    },
  });

  const columns = useMemo<GridColDef<User>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "username", headerName: "Username", flex: 1, minWidth: 160 },
      { field: "role", headerName: "Role", width: 140 },
      { field: "email", headerName: "Email", flex: 1.2, minWidth: 200 },
      { field: "first_name", headerName: "First", width: 140 },
      { field: "last_name", headerName: "Last", width: 140 },
      { field: "is_active", headerName: "Active", width: 110, type: "boolean" },
    ],
    [],
  );

  return (
    <AppShell title="Admin dashboard">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Create user
        </Button>
      </Stack>

      <div style={{ height: 560, width: "100%" }}>
        <DataGrid rows={users} columns={columns} loading={isLoading} disableRowSelectionOnClick />
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Username" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              helperText="Min 8 chars (Django validation)."
            />
            <TextField select label="Role" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
              {(roles.length ? roles : [{ value: "RECEPTION", label: "Reception" }]).map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="First name" value={form.first_name} onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))} fullWidth />
              <TextField label="Last name" value={form.last_name} onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))} fullWidth />
            </Stack>
            <TextField label="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createUser.mutate()} disabled={createUser.isPending}>
            {createUser.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default AdminDashboard;

