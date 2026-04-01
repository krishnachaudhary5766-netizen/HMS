import React, { useMemo, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import { api } from "../lib/api";

type Invoice = {
  id: number;
  patient: number;
  status: string;
  total: string;
  balance_due: string;
  created_at: string;
};

const BillingDashboard: React.FC = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<Partial<Invoice>>({ patient: 0, status: "DRAFT", total: "0", balance_due: "0" });
  const [payment, setPayment] = useState({ amount: "0", method: "CASH", reference: "" });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const data: any = (await api.get("/invoices/")).data;
      return Array.isArray(data) ? (data as Invoice[]) : (data?.results as Invoice[]) || [];
    },
  });

  const saveInvoice = useMutation({
    mutationFn: async () => {
      const cleaned: any = { ...form };
      // Prevent empty-string date/datetime fields from being sent
      for (const k of ["issued_at", "due_at"] as const) {
        if ((cleaned as any)[k] === "") (cleaned as any)[k] = null;
      }
      if (cleaned.appointment === "") cleaned.appointment = null;
      // Ensure patient is a valid id
      if (!cleaned.patient || Number(cleaned.patient) <= 0) {
        throw { response: { data: { patient: ["Patient ID is required."] } } };
      }
      if (editing?.id) {
        await api.patch(`/invoices/${editing.id}/`, cleaned);
      } else {
        await api.post(`/invoices/`, cleaned);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["invoices"] });
      setOpen(false);
      setEditing(null);
    },
  });

  const createPayment = useMutation({
    mutationFn: async () => {
      if (!editing?.id) return;
      await api.post(`/payments/`, { invoice: editing.id, ...payment });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["invoices"] });
      setPayOpen(false);
      setPayment({ amount: "0", method: "CASH", reference: "" });
    },
  });

  const columns = useMemo<GridColDef<Invoice>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "patient", headerName: "Patient ID", width: 120 },
      { field: "status", headerName: "Status", flex: 0.7, minWidth: 140 },
      { field: "total", headerName: "Total", flex: 0.6, minWidth: 110 },
      { field: "balance_due", headerName: "Balance due", flex: 0.7, minWidth: 130 },
      {
        field: "created_at",
        headerName: "Created",
        flex: 1,
        minWidth: 180,
        valueGetter: (v) => new Date(v).toLocaleString(),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 260,
        sortable: false,
        filterable: false,
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
              variant="outlined"
              onClick={() => {
                setEditing(params.row);
                setPayOpen(true);
              }}
            >
              Add payment
            </Button>
          </Stack>
        ),
      },
    ],
    [],
  );

  return (
    <AppShell title="Billing dashboard">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            setEditing(null);
            setForm({ patient: 0, status: "DRAFT", total: "0", balance_due: "0" });
            setOpen(true);
          }}
        >
          Create invoice
        </Button>
      </Stack>

      <div style={{ height: 560, width: "100%" }}>
        <DataGrid
          rows={invoices}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        />
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit invoice" : "Create invoice"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {saveInvoice.isError && (
              <Alert severity="error">
                {(() => {
                  const anyErr: any = saveInvoice.error;
                  const data = anyErr?.response?.data;
                  if (typeof data === "string") return data;
                  if (data?.detail) return String(data.detail);
                  if (data && typeof data === "object") {
                    return Object.entries(data)
                      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
                      .join(" | ");
                  }
                  return "Failed to save invoice.";
                })()}
              </Alert>
            )}
            <TextField
              label="Patient ID"
              type="number"
              value={form.patient ?? 0}
              onChange={(e) => setForm((s) => ({ ...s, patient: Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={form.status || "DRAFT"}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
              fullWidth
            >
              {["DRAFT", "ISSUED", "PAID", "VOID"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Total"
                value={form.total || "0"}
                onChange={(e) => setForm((s) => ({ ...s, total: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Balance due"
                value={form.balance_due || "0"}
                onChange={(e) => setForm((s) => ({ ...s, balance_due: e.target.value }))}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveInvoice.mutate()}
            disabled={saveInvoice.isPending || !form.patient || Number(form.patient) <= 0}
          >
            {saveInvoice.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={payOpen} onClose={() => setPayOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add payment (invoice #{editing?.id})</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Amount"
              value={payment.amount}
              onChange={(e) => setPayment((s) => ({ ...s, amount: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="Method"
              value={payment.method}
              onChange={(e) => setPayment((s) => ({ ...s, method: e.target.value }))}
              fullWidth
            >
              {["CASH", "CARD", "UPI", "BANK", "OTHER"].map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reference"
              value={payment.reference}
              onChange={(e) => setPayment((s) => ({ ...s, reference: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createPayment.mutate()} disabled={createPayment.isPending}>
            {createPayment.isPending ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default BillingDashboard;

