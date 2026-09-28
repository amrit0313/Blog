// app/admin/blogs/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { blogApi, type Blog } from "../../../lib/blog";

export default function AdminBlogsPage() {
  const [rows, setRows] = useState<Blog[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    blogApi
      .list({ page: paginationModel.page + 1, limit: paginationModel.pageSize })
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
      field: "actions", headerName: "Actions", width: 200, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
          <Button size="small" href={`/dashboard/blogs/${p.row._id}/edit`}>Edit</Button>
          <Button size="small" color="error" onClick={() => console.log("delete", p.row._id)}>
            Delete
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
        sx={{ bgcolor: "background.paper" }}
      />
    </>
  );
}