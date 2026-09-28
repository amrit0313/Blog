// app/admin/categories/page.tsx
"use client";
import { useEffect, useState } from "react";
import {
  Box, Button, Chip, Typography, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
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

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : categories.length === 0 ? (
        <Typography color="text.secondary">No categories yet.</Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
          {categories.map((cat) => (
            <ListItem
              key={cat._id}
              secondaryAction={
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => setDeleteTarget(cat)}
                  aria-label={`Delete ${cat.title}`}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={cat.title}
                secondary={cat.createdAt ? `Created ${new Date(cat.createdAt).toLocaleDateString()}` : undefined}
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Add Category Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Category Title"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            sx={{ mt: 1 }}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      >
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
