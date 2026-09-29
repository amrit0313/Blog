// app/admin/blogs/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { toast } from "sonner";
import { blogApi, type Blog } from "../../../lib/blog";
import { adminApi } from "../../../lib/admin";

export default function AdminBlogsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Blog[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize:10 });
  const [loading, setLoading] = useState(true);
  const [unpublishTarget, setUnpublishTarget] = useState<Blog | null>(null);
  const [unpublishing, setUnpublishing] = useState(false);

  async function handleConfirmUnpublish() {
    if (!unpublishTarget) return;
    setUnpublishing(true);
    try {
      await adminApi.unpublishBlog(unpublishTarget._id);
      toast.success("Blog unpublished");
      setRows((prev) =>
        prev.map((b) =>
          b._id === unpublishTarget._id ? { ...b, status: "unpublished" } : b
        )
      );
      setUnpublishTarget(null);
    } catch {
      toast.error("Failed to unpublish blog.");
    } finally {
      setUnpublishing(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    adminApi
      .listAllBlogs({ page: paginationModel.page + 1, limit: paginationModel.pageSize })
      .then((res) => {
        setRows(res.result);
        setRowCount(res.meta.totalBlogs);
      })
      .finally(() => setLoading(false));
  }, [paginationModel]);

  const columns: GridColDef<Blog>[] = [
    { field: "title", headerName: "Title", flex: 1, minWidth: 200 },
    { field: "author", headerName: "Author", width: 160, valueGetter: (_v, row) => row.author?.name },
    {
      field: "status", headerName: "Status", width: 130,
      renderCell: (p) => (
        <Chip size="small" label={p.value} color={p.value === "published" ? "success" : "warning"} />
      ),
    },
    {
      field: "createdAt", headerName: "Created", width: 140,
      valueFormatter: (v) => new Date(v).toLocaleDateString(),
    },
    {
      field: "actions", headerName: "Actions", width: 140, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
          <Button
            size="small"
            disabled={p.row.status !== "published"}
            onClick={(e) => {
              e.stopPropagation();
              setUnpublishTarget(p.row);
            }}
          >
            Unpublish
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Blogs</Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20]}
        disableRowSelectionOnClick
        onRowClick={(params) => router.push(`/admin/blogs/${params.id}`)}
        sx={{
          bgcolor: "background.paper",
          "& .MuiDataGrid-row": { cursor: "pointer" },
        }}
      />

      <Dialog
        open={Boolean(unpublishTarget)}
        onClose={() => setUnpublishTarget(null)}
      >
        <DialogTitle>Unpublish Blog</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to unpublish this blog?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnpublishTarget(null)} disabled={unpublishing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUnpublish}
            color="error"
            variant="contained"
            disabled={unpublishing}
          >
            {unpublishing ? "Unpublishing..." : "Yes, Unpublish"}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}