// app/admin/categories/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  Box, Button, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "sonner";
import { adminApi, type AdminCategory } from "../../../lib/admin";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCategory | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    adminApi
      .listCategories()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.result ?? [];
        setCategories(list);
      })
      .catch(() => toast.error("Failed to load categories."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await adminApi.createCategory({ title: newTitle.trim() });
      const created = "result" in res ? res.result : res;
      setCategories((prev) => [...prev, created]);
      toast.success("Category created.");
      setNewTitle("");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to create category.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deleteTarget._id);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      toast.success("Category deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(category: AdminCategory) {
    setEditTarget(category);
    setEditTitle(category.title ?? "");
  }

  async function handleEdit() {
    if (!editTarget || !editTitle.trim()) return;
    setEditing(true);
    try {
      await adminApi.updateCategory(editTarget._id, { title: editTitle.trim() });
      setCategories((prev) =>
        prev.map((c) =>
          c._id === editTarget._id ? { ...c, title: editTitle.trim() } : c
        )
      );
      toast.success("Category updated.");
      setEditTarget(null);
    } catch {
      toast.error("Failed to update category.");
    } finally {
      setEditing(false);
    }
  }

  const columns: GridColDef<AdminCategory>[] = [
    { field: "title", headerName: "Title", flex: 1, minWidth: 200 },
    {
      field: "createdAt",
      headerName: "Created",
      width: 160,
      valueFormatter: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p.row);
            }}
          >
            Edit
          </Button>
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
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Category
        </Button>
      </Box>

      <DataGrid
        rows={categories}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        pageSizeOptions={[5, 10]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        disableRowSelectionOnClick
        sx={{ bgcolor: "background.paper", width: "100%" }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <label htmlFor="newCategoryTitle">Category Title</label>
          <TextField
            autoFocus
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            sx={{ mt: 1}}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !newTitle.trim()}
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <label htmlFor="newCategoryTitle">New Title</label>
          <TextField
            autoFocus
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleEdit();
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={editing}>
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={editing || !editTitle.trim()}
          >
            {editing ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
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
