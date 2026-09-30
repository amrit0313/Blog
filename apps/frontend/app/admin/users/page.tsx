// app/admin/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "sonner";
import { adminApi, type AdminUser } from "../../../lib/admin";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminApi
      .listUsers()
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        setUsers(list);
      })
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget._id);
      toast.success("User deleted.");
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<AdminUser>[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
    { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value === "admin" ? "Admin" : "User"}
          color={p.value === "admin" ? "primary" : "default"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
          <Button
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(p.row);
            }}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/admin/users/create")}
        >
          Create User
        </Button>
      </Box>

      <DataGrid
        rows={users}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        pageSizeOptions={[5, 10]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        sx={{ bgcolor: "background.paper", width: "100%" }}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
