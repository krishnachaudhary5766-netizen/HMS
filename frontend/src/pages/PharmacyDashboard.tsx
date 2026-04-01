import React, { useMemo, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Tab, Tabs, TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "../components/AppShell";
import { api } from "../lib/api";

type Medication = {
  id: number;
  sku: string;
  name: string;
  strength: string;
  form: string;
  reorder_level: number;
  is_active?: boolean;
};

type StockLot = {
  id: number;
  medication: number;
  lot_number: string;
  expiry_date: string | null;
  unit_cost: string;
  quantity_on_hand: number;
  created_at: string;
};

type Dispense = {
  id: number;
  patient: number;
  lot: number;
  quantity: number;
  dispensed_at: string;
};

const PharmacyDashboard: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"meds" | "lots" | "dispense">("meds");

  const [medOpen, setMedOpen] = useState(false);
  const [medEditing, setMedEditing] = useState<Medication | null>(null);
  const [medForm, setMedForm] = useState<Partial<Medication>>({
    sku: "",
    name: "",
    strength: "",
    form: "",
    reorder_level: 0,
  });

  const [lotOpen, setLotOpen] = useState(false);
  const [lotForm, setLotForm] = useState<Partial<StockLot>>({
    medication: 0,
    lot_number: "",
    expiry_date: null,
    unit_cost: "0",
    quantity_on_hand: 0,
  });

  const [txnOpen, setTxnOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({ lot: 0, txn_type: "RECEIVE", quantity_delta: 1, note: "" });

  const [dispOpen, setDispOpen] = useState(false);
  const [dispForm, setDispForm] = useState({ patient: 0, lot: 0, quantity: 1, appointment: null as number | null, invoice: null as number | null });

  const { data: medications = [], isLoading: medsLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: async () => (await api.get<Medication[]>("/medications/")).data,
  });

  const { data: lots = [], isLoading: lotsLoading } = useQuery({
    queryKey: ["stock-lots"],
    queryFn: async () => (await api.get<StockLot[]>("/stock-lots/")).data,
  });

  const { data: dispenses = [], isLoading: dispLoading } = useQuery({
    queryKey: ["dispenses"],
    queryFn: async () => (await api.get<Dispense[]>("/dispenses/")).data,
  });

  const saveMedication = useMutation({
    mutationFn: async () => {
      if (medEditing?.id) return (await api.put(`/medications/${medEditing.id}/`, medForm)).data;
      return (await api.post(`/medications/`, medForm)).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["medications"] });
      setMedOpen(false);
      setMedEditing(null);
    },
  });

  const createLot = useMutation({
    mutationFn: async () => {
      return (await api.post(`/stock-lots/`, lotForm)).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["stock-lots"] });
      setLotOpen(false);
    },
  });

  const createTxn = useMutation({
    mutationFn: async () => {
      return (await api.post(`/inventory-txns/`, txnForm)).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["stock-lots"] });
      setTxnOpen(false);
    },
  });

  const createDispense = useMutation({
    mutationFn: async () => {
      return (await api.post(`/dispenses/`, dispForm)).data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["stock-lots"] });
      await qc.invalidateQueries({ queryKey: ["dispenses"] });
      setDispOpen(false);
    },
  });

  const medColumns = useMemo<GridColDef<Medication>[]>(
    () => [
      { field: "sku", headerName: "SKU", flex: 0.8, minWidth: 120 },
      { field: "name", headerName: "Name", flex: 1.5, minWidth: 180 },
      { field: "strength", headerName: "Strength", flex: 1, minWidth: 140 },
      { field: "form", headerName: "Form", flex: 0.8, minWidth: 120 },
      { field: "reorder_level", headerName: "Reorder", width: 110 },
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
              setMedEditing(params.row);
              setMedForm(params.row);
              setMedOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  const lotColumns = useMemo<GridColDef<StockLot>[]>(
    () => [
      { field: "id", headerName: "Lot ID", width: 90 },
      { field: "medication", headerName: "Medication ID", width: 130 },
      { field: "lot_number", headerName: "Lot #", flex: 1, minWidth: 140 },
      { field: "expiry_date", headerName: "Expiry", width: 130 },
      { field: "quantity_on_hand", headerName: "On hand", width: 110 },
      { field: "unit_cost", headerName: "Unit cost", width: 110 },
    ],
    [],
  );

  const dispColumns = useMemo<GridColDef<Dispense>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90 },
      { field: "patient", headerName: "Patient ID", width: 120 },
      { field: "lot", headerName: "Lot ID", width: 110 },
      { field: "quantity", headerName: "Qty", width: 90 },
      {
        field: "dispensed_at",
        headerName: "Dispensed",
        flex: 1,
        minWidth: 180,
        valueGetter: (v) => new Date(v).toLocaleString(),
      },
    ],
    [],
  );

  return (
    <AppShell title="Pharmacy dashboard">
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="meds" label="Medications" />
        <Tab value="lots" label="Stock lots" />
        <Tab value="dispense" label="Dispensing" />
      </Tabs>

      {tab === "meds" && (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => {
                setMedEditing(null);
                setMedForm({ sku: "", name: "", strength: "", form: "", reorder_level: 0 });
                setMedOpen(true);
              }}
            >
              Add medication
            </Button>
          </Stack>
          <div style={{ height: 560, width: "100%" }}>
            <DataGrid rows={medications} columns={medColumns} loading={medsLoading} disableRowSelectionOnClick />
          </div>
        </>
      )}

      {tab === "lots" && (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={() => setLotOpen(true)}>
              Create stock lot
            </Button>
            <Button variant="outlined" onClick={() => setTxnOpen(true)}>
              Receive/Adjust stock
            </Button>
          </Stack>
          <div style={{ height: 560, width: "100%" }}>
            <DataGrid rows={lots} columns={lotColumns} loading={lotsLoading} disableRowSelectionOnClick />
          </div>
        </>
      )}

      {tab === "dispense" && (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={() => setDispOpen(true)}>
              Dispense medicine
            </Button>
          </Stack>
          <div style={{ height: 560, width: "100%" }}>
            <DataGrid rows={dispenses} columns={dispColumns} loading={dispLoading} disableRowSelectionOnClick />
          </div>
        </>
      )}

      <Dialog open={medOpen} onClose={() => setMedOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{medEditing ? "Edit medication" : "Add medication"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="SKU" value={medForm.sku || ""} onChange={(e) => setMedForm((s) => ({ ...s, sku: e.target.value }))} />
            <TextField label="Name" value={medForm.name || ""} onChange={(e) => setMedForm((s) => ({ ...s, name: e.target.value }))} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Strength"
                value={medForm.strength || ""}
                onChange={(e) => setMedForm((s) => ({ ...s, strength: e.target.value }))}
                fullWidth
              />
              <TextField label="Form" value={medForm.form || ""} onChange={(e) => setMedForm((s) => ({ ...s, form: e.target.value }))} fullWidth />
            </Stack>
            <TextField
              label="Reorder level"
              type="number"
              value={medForm.reorder_level ?? 0}
              onChange={(e) => setMedForm((s) => ({ ...s, reorder_level: Number(e.target.value) }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => saveMedication.mutate()} disabled={saveMedication.isPending}>
            {saveMedication.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lotOpen} onClose={() => setLotOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create stock lot</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Medication ID"
              type="number"
              value={lotForm.medication ?? 0}
              onChange={(e) => setLotForm((s) => ({ ...s, medication: Number(e.target.value) }))}
            />
            <TextField label="Lot number" value={lotForm.lot_number || ""} onChange={(e) => setLotForm((s) => ({ ...s, lot_number: e.target.value }))} />
            <TextField
              label="Expiry date (YYYY-MM-DD)"
              value={lotForm.expiry_date || ""}
              onChange={(e) => setLotForm((s) => ({ ...s, expiry_date: e.target.value || null }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Unit cost" value={lotForm.unit_cost || "0"} onChange={(e) => setLotForm((s) => ({ ...s, unit_cost: e.target.value }))} fullWidth />
              <TextField
                label="Opening quantity"
                type="number"
                value={lotForm.quantity_on_hand ?? 0}
                onChange={(e) => setLotForm((s) => ({ ...s, quantity_on_hand: Number(e.target.value) }))}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLotOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createLot.mutate()} disabled={createLot.isPending}>
            {createLot.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={txnOpen} onClose={() => setTxnOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Receive / adjust inventory</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Lot ID" type="number" value={txnForm.lot} onChange={(e) => setTxnForm((s) => ({ ...s, lot: Number(e.target.value) }))} />
            <TextField label="Type" value={txnForm.txn_type} onChange={(e) => setTxnForm((s) => ({ ...s, txn_type: e.target.value }))} helperText='Use "RECEIVE" to add stock, "ADJUST" to correct.' />
            <TextField
              label="Quantity delta (+/-)"
              type="number"
              value={txnForm.quantity_delta}
              onChange={(e) => setTxnForm((s) => ({ ...s, quantity_delta: Number(e.target.value) }))}
            />
            <TextField label="Note" value={txnForm.note} onChange={(e) => setTxnForm((s) => ({ ...s, note: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTxnOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createTxn.mutate()} disabled={createTxn.isPending}>
            {createTxn.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dispOpen} onClose={() => setDispOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Dispense medicine</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Patient ID" type="number" value={dispForm.patient} onChange={(e) => setDispForm((s) => ({ ...s, patient: Number(e.target.value) }))} />
            <TextField label="Lot ID" type="number" value={dispForm.lot} onChange={(e) => setDispForm((s) => ({ ...s, lot: Number(e.target.value) }))} />
            <TextField label="Quantity" type="number" value={dispForm.quantity} onChange={(e) => setDispForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
            <TextField
              label="Appointment ID (optional)"
              type="number"
              value={dispForm.appointment ?? ""}
              onChange={(e) => setDispForm((s) => ({ ...s, appointment: e.target.value ? Number(e.target.value) : null }))}
            />
            <TextField
              label="Invoice ID (optional)"
              type="number"
              value={dispForm.invoice ?? ""}
              onChange={(e) => setDispForm((s) => ({ ...s, invoice: e.target.value ? Number(e.target.value) : null }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createDispense.mutate()} disabled={createDispense.isPending}>
            {createDispense.isPending ? "Dispensing..." : "Dispense"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
};

export default PharmacyDashboard;

