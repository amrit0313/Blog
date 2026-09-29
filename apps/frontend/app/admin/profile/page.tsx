// app/admin/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Button, Typography, CircularProgress,
  Card, CardContent, Divider, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../../../context/AuthContext";
import { profileApi, ProfileData } from "../../../lib/profile";
import { ApiError } from "../../../lib/api";

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;

    profileApi
      .get()
      .then((res) => setProfile(res.profile ?? null))
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 400)) {
          setError("Unable to load profile.");
        }
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user?.role !== "admin") {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          you dont have access to this page
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="error">{error}</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const displayName = profile?.user?.name ?? user?.name ?? "Admin";
  const email = profile?.user?.email ?? user?.email ?? "";

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/admin")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar
                src={profile?.avatar}
                name={displayName}
                sx={{ width: 80, height: 80, fontSize: "2rem" }}
              />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {displayName}
                </Typography>
                <Typography color="text.secondary">{email}</Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "primary.main", fontWeight: 600, mt: 0.5 }}
                >
                  Administrator
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => router.push("/admin/profile/edit")}
            >
              Edit Profile
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {profile?.bio && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "text.secondary", mb: 1 }}
              >
                About
              </Typography>
              <Typography sx={{ lineHeight: 1.7 }}>{profile.bio}</Typography>
            </Box>
          )}

          {profile?.socialLinks && (
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "text.secondary", mb: 1 }}
              >
                Social Links
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {Object.entries(profile.socialLinks).map(([key, value]) =>
                  value ? (
                    <Typography key={key} variant="body2">
                      <strong className="capitalize">{key}:</strong> {value}
                    </Typography>
                  ) : null
                )}
              </Box>
            </Box>
          )}

          {!profile?.bio && !profile?.socialLinks && (
            <Typography color="text.secondary">
              No profile details added yet.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
