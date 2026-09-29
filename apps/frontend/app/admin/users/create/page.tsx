// app/admin/users/create/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Card, CircularProgress, MenuItem, TextField, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { toast } from "sonner";
import * as Yup from "yup";
import { adminApi, ApiError } from "../../../../lib/admin";

const createUserSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
  role: Yup.string().oneOf(["admin", "user"]).required("Role is required"),
});

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "background.paper",
    "& fieldset": { borderColor: "divider" },
    "&:hover fieldset": { borderColor: "#d8c5b7" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
  },
};

function Field({
  label, htmlFor, required, error, children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={htmlFor}
        sx={{
          display: "block",
          mb: 0.75,
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "text.primary",
        }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: "primary.main", ml: 0.5 }}>
            *
          </Box>
        )}
      </Typography>
      {children}
      {error && (
        <Typography
          component="span"
          sx={{ display: "block", mt: 0.5, fontSize: "0.8125rem", color: "error.main" }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default function CreateUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();

    try {
      await createUserSchema.validate(
        { name, email, password, confirmPassword, role },
        { abortEarly: false }
      );
      setErrors({});
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const e: Record<string, string> = {};
        err.inner.forEach((e2) => {
          if (e2.path) e[e2.path] = e2.message;
        });
        setErrors(e);
      }
      return;
    }

    setCreating(true);
    try {
      await adminApi.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      toast.success("User created.");
      router.push("/admin/users");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create user.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 768, mx: "auto", px: { xs: 0, sm: 2 }, py: 2 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin/users")}
        sx={{ mb: 2, ml: -1 }}
      >
        Back to Users
      </Button>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          component="span"
          sx={{
            display: "block",
            color: "primary.main",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Admin
        </Typography>
        <Typography variant="h4" sx={{ mt: 1, fontWeight: 700, color: "text.primary" }}>
          Create New User
        </Typography>
        <Typography component="span" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
          Add a new member and choose their role.
        </Typography>
      </Box>

      {/* Form card */}
      <Card
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: "10px",
          border: 1,
          borderColor: "divider",
          boxShadow: "0 8px 24px rgba(72,45,28,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Field label="Name" htmlFor="name" required error={errors.name}>
          <TextField
            id="name"
            fullWidth
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={Boolean(errors.name)}
            sx={inputSx}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={errors.email}>
          <TextField
            id="email"
            type="email"

            fullWidth
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(errors.email)}
            sx={{...inputSx }}
          />
        </Field>

        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <Field label="Password" htmlFor="password" required error={errors.password}>
            <TextField
              id="password"
              type="password"
              fullWidth
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(errors.password)}
              sx={inputSx}
            />
          </Field>

          <Field label="Confirm Password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
            <TextField
              id="confirmPassword"
              type="password"
              fullWidth
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(errors.confirmPassword)}
              sx={inputSx}
            />
          </Field>
        </Box>

        <Field label="Role" htmlFor="role">
          <TextField
            id="role"
            select
            size="small"
            fullWidth
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "user")}
            sx={inputSx}
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
        </Field>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            borderTop: 1,
            borderColor: "divider",
            pt: 3,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={() => router.push("/admin/users")}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={creating}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {creating ? "Creating..." : "Create User"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}