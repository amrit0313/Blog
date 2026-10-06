// app/admin/blogs/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Chip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, TextField,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { toast } from "sonner";
import { blogApi, type Blog } from "../../../lib/blog";
import { adminApi } from "../../../lib/admin";
import SearchBox from "../../../components/ui/search-box";

export default function AdminBlogsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Blog[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [unpublishTarget, setUnpublishTarget] = useState<Blog | null>(null);
  const [unpublishing, setUnpublishing] = useState(false);
  const [featureTarget, setFeatureTarget] = useState<Blog | null>(null);
  const [featuring, setFeaturing] = useState(false);

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

  async function handleConfirmFeature() {
    if (!featureTarget) return;
    setFeaturing(true);
    try {
      await adminApi.featureBlog(featureTarget._id);
      toast.success("Blog featured");
      setRows((prev) =>
        prev.map((b) =>
          b._id === featureTarget._id
            ? { ...b, status: "featured" }
            : b.status === "featured"
              ? { ...b, status: "published" }
              : b
        )
      );
      setFeatureTarget(null);
    } catch {
      toast.error("Failed to feature blog.");
    } finally {
      setFeaturing(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    adminApi
      .listAllBlogs({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: search || undefined,
        author: authorSearch || undefined,
        status: status || undefined,
        tag: tag || undefined,
      })
      .then((res) => {
        setRows(res.result);
        setRowCount(res.meta.totalBlogs);
      })
      .finally(() => setLoading(false));
  }, [paginationModel, search, authorSearch, status, tag]);

  const columns: GridColDef<Blog>[] = [
    { field: "title", headerName: "Title", flex: 1, minWidth: 200 },
    { field: "author", headerName: "Author", width: 160, valueGetter: (_v, row) => row.author?.name },
    {
      field: "status", headerName: "Status", width: 130,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.value}
          color={
            p.value === "featured"
              ? "info"
              : p.value === "published"
                ? "success"
                : "warning"
          }
        />
      ),
    },
    {
      field: "createdAt", headerName: "Created", width: 140,
      valueFormatter: (v) => new Date(v).toLocaleDateString(),
    },
    {
      field: "actions", headerName: "Actions", width: 220, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
          <Button
            size="small"
            disabled={p.row.status !== "published"}
            onClick={(e) => {
              e.stopPropagation();
              setFeatureTarget(p.row);
            }}
          >
            Feature
          </Button>
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
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Blogs</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <SearchBox
            initialValue={search}
            onSearch={(value) => {
              setSearch(value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            placeholder="Search by title"
          />
          <SearchBox
            initialValue={authorSearch}
            onSearch={(value) => {
              setAuthorSearch(value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            placeholder="Search by author"
          />
          <SearchBox
            initialValue={tag}
            onSearch={(value) => {
              setTag(value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            placeholder="Search by tag"
          />
          <TextField
            select
            size="small"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="featured">Featured</MenuItem>
            <MenuItem value="unpublished">Unpublished</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
        </Box>
      </Box>
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
        onRowClick={(params) => router.push(`/admin/blogs/${params.row.slug}`)}
        sx={{
          bgcolor: "background.paper",
          width: "100%",
          height: "auto",
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

      <Dialog
        open={Boolean(featureTarget)}
        onClose={() => !featuring && setFeatureTarget(null)}
      >
        <DialogTitle>Feature Blog</DialogTitle>
        <DialogContent>
          <Typography>
            Feature this blog on the homepage? It will replace the current featured blog.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeatureTarget(null)} disabled={featuring}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmFeature}
            color="primary"
            variant="contained"
            disabled={featuring}
          >
            {featuring ? "Featuring..." : "Yes, Feature"}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}