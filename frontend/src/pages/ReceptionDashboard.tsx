import React, { useMemo, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import { api } from "../lib/api";

type Patient = {
  id: number;
  mrn: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth: string | null;
  sex: string;
  address: string;
  emergency_contact: string;
};

const ReceptionDashboard: React.FC = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<Partial<Patient>>({
    mrn: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    date_of_birth: null,
    sex: "",
    address: "",
    emergency_contact: "",
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const data: any = (await api.get("/patients/")).data;
      return Array.isArray(data) ? (data as Patient[]) : (data?.results as Patient[]) || [];
    },
  });

  const savePatient = useMutation({
    mutationFn: async (payload: Partial<Patient>) => {
      const cleaned: any = { ...payload };
      if (cleaned.date_of_birth === "") cleaned.date_of_birth = null;
      if (editing?.id) {
        return (await api.put(`/patients/${editing.id}/`, cleaned)).data;
      }
      return (await api.post(`/patients/`, cleaned)).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["patients"] });
      setOpen(false);
      setEditing(null);
    },
  });

  const deletePatient = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/patients/${id}/`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const columns = useMemo<GridColDef<Patient>[]>(
    () => [
      { field: "mrn", headerName: "MRN", flex: 0.7, minWidth: 120 },
      { field: "first_name", headerName: "First name", flex: 1, minWidth: 140 },
      { field: "last_name", headerName: "Last name", flex: 1, minWidth: 140 },
      { field: "phone", headerName: "Phone", flex: 1, minWidth: 140 },
      { field: "email", headerName: "Email", flex: 1.2, minWidth: 180 },
      {
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        width: 220,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setEditing(params.row);
                setForm(params.row);
                setOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => deletePatient.mutate(params.row.id)}
            >
              Delete
            </Button>
          </Stack>
        ),
      },
    ],
    [deletePatient],
  );

  return (
    <AppShell title="Reception dashboard">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: "center" }}>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setForm({
              mrn: "",
              first_name: "",
              last_name: "",
              phone: "",
              email: "",
              date_of_birth: null,
              sex: "",
              address: "",
              emergency_contact: "",
            });
            setOpen(true);
          }}
        >
          Add patient
        </Button>
      </Stack>

      <div style={{ height: 560, width: "100%" }}>
        <DataGrid
          rows={patients}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit patient" : "Add patient"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {savePatient.isError && (
              <Alert severity="error">
                {(() => {
                  const anyErr: any = savePatient.error;
                  const data = anyErr?.response?.data;
                  if (typeof data === "string") return data;
                  if (data?.detail) return String(data.detail);
                  if (data && typeof data === "object") {
                    return Object.entries(data)
                      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
                      .join(" | ");
                  }
                  return "Failed to save patient.";
                })()}
              </Alert>
            )}
            <TextField label="MRN" value={form.mrn || ""} onChange={(e) => setForm((s) => ({ ...s, mrn: e.target.value }))} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="First name"
                value={form.first_name || ""}
                onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Last name"
                value={form.last_name || ""}
                onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Phone"
                value={form.phone || ""}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Email"
                value={form.email || ""}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Date of birth (YYYY-MM-DD)"
                value={form.date_of_birth || ""}
                onChange={(e) => setForm((s) => ({ ...s, date_of_birth: e.target.value || null }))}
                fullWidth
              />
              <TextField
                label="Sex (M/F/O)"
                value={form.sex || ""}
                onChange={(e) => setForm((s) => ({ ...s, sex: e.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              label="Address (encrypted)"
              value={form.address || ""}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              multiline
              minRows={2}
            />
            <TextField
              label="Emergency contact (encrypted)"
              value={form.emergency_contact || ""}
              onChange={(e) => setForm((s) => ({ ...s, emergency_contact: e.target.value }))}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => savePatient.mutate(form)}
            disabled={savePatient.isPending || !form.mrn || !form.first_name}
          >
            {savePatient.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default ReceptionDashboard;

