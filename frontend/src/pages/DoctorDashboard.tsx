import React, { useMemo, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import { api } from "../lib/api";

type Appointment = {
  id: number;
  start_at: string;
  end_at: string;
  status: string;
  patient: number;
  doctor: number;
  reason: string;
  clinical_notes: string;
};

const DoctorDashboard: React.FC = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<Partial<Appointment>>({ status: "SCHEDULED", clinical_notes: "" });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => (await api.get<Appointment[]>("/appointments/")).data,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const payload = { status: form.status, clinical_notes: form.clinical_notes };
      await api.patch(`/appointments/${editing.id}/`, payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
      setEditing(null);
    },
  });

  const columns = useMemo<GridColDef<Appointment>[]>(
    () => [
      {
        field: "start_at",
        headerName: "Start",
        flex: 1,
        minWidth: 180,
        valueGetter: (v) => new Date(v).toLocaleString(),
      },
      {
        field: "end_at",
        headerName: "End",
        flex: 1,
        minWidth: 180,
        valueGetter: (v) => new Date(v).toLocaleString(),
      },
      { field: "status", headerName: "Status", flex: 0.7, minWidth: 140 },
      {
        field: "actions",
        headerName: "Actions",
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setEditing(params.row);
              setForm({ status: params.row.status, clinical_notes: params.row.clinical_notes });
              setOpen(true);
            }}
          >
            Update
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <AppShell title="Doctor dashboard">
      <div style={{ height: 560, width: "100%" }}>
        <DataGrid
          rows={appointments}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Status"
              value={form.status || "SCHEDULED"}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              fullWidth
            >
              {["SCHEDULED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Clinical notes (encrypted)"
              value={form.clinical_notes || ""}
              onChange={(e) => setForm((s) => ({ ...s, clinical_notes: e.target.value }))}
              multiline
              minRows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default DoctorDashboard;

