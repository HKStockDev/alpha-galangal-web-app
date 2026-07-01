"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  deleteMyAvatar,
  updateMyProfile,
  uploadMyAvatar,
} from "@/lib/api";
import { useToast } from "@/context/toast-context";
import { Badge } from "@/components/ui/badge";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { cn } from "@/lib/utils";
import { userInitials } from "@/lib/user-initials";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import {
  ProfileCard,
  ProfileHeroBand,
  ProfileIconBadge,
  ProfileInputFrame,
} from "@/components/ui-kit/profile";

const AVATAR_INPUT_ID = "profile-avatar-input";

export function DashboardProfilePage() {
  const { user, accessToken, refetchUser, applyUserFromMe } = useAuth();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setName(user.full_name ?? "");
  }, [user?.id, user?.full_name]);

  if (!user) return null;

  const roleLabel = user.is_platform_admin
    ? "Platform admin"
    : "Organization member";

  const displayName =
    user.full_name?.trim() || user.email.split("@")[0] || user.email;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    try {
      await updateMyProfile(accessToken, name.trim());
      await refetchUser();
      showSuccess("Profile updated");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const ACCEPT_AVATAR = "image/jpeg,image/png,image/webp,image/gif";

  async function handleAvatarFile(file: File) {
    if (!accessToken) return;
    const okType = ACCEPT_AVATAR.split(",").some(
      (t) => file.type === t.trim()
    );
    if (!okType) {
      showError("Use a JPEG, PNG, WebP, or GIF image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError("Image must be 2MB or smaller");
      return;
    }
    setAvatarUploading(true);
    try {
      const updated = await uploadMyAvatar(accessToken, file);
      applyUserFromMe(updated);
      showSuccess("Photo updated");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    if (!accessToken) return;
    setAvatarRemoving(true);
    try {
      const updated = await deleteMyAvatar(accessToken);
      applyUserFromMe(updated);
      showSuccess("Photo removed");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setAvatarRemoving(false);
    }
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Profile
          </h1>
          <p className="text-base text-muted-foreground">
            Manage how you appear and your account details
          </p>
        </header>

        <ProfileCard>
          <ProfileHeroBand aria-hidden />
          <div className="relative px-5 pb-6 pt-0 sm:px-8 sm:pb-8">
            <div className="-mt-14 flex flex-col items-center gap-6 sm:-mt-16 sm:flex-row sm:items-end sm:gap-10">
              <div className="flex flex-col items-center gap-4 sm:items-start">
                <input
                  ref={fileInputRef}
                  id={AVATAR_INPUT_ID}
                  type="file"
                  accept={ACCEPT_AVATAR}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleAvatarFile(f);
                  }}
                />
                <label
                  htmlFor={AVATAR_INPUT_ID}
                  className={cn(
                    "group relative block cursor-pointer rounded-full",
                    "ring-4 ring-white ring-offset-0 transition-shadow",
                    "hover:ring-primary/25 focus-within:ring-primary/35"
                  )}
                >
                  <span className="sr-only">Change profile photo</span>
                  {user.avatar_url ? (
                  //   <img
                  //   src={user.avatar_url}
                  //   alt={`${displayName} profile photo`}
                  //   width={128}
                  //   height={128}
                  //   className="size-28 rounded-full object-cover shadow-md sm:size-32"
                  // />
                    <img
                      src="/male-placeholder.jpg"
                      alt="Default profile photo"
                      width={128}
                      height={128}
                      className="size-28 rounded-full object-cover shadow-md sm:size-32"
                    />
                  ) : (
                    <div
                      className={cn(
                        "flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5",
                        "text-2xl font-semibold text-primary shadow-md sm:size-32 sm:text-3xl"
                      )}
                      aria-hidden
                    >
                      {userInitials(user.full_name, user.email)}
                    </div>
                  )}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-0 flex items-center justify-center rounded-full",
                      "bg-foreground/55 opacity-0 transition-opacity",
                      "group-hover:opacity-100 group-focus-within:opacity-100"
                    )}
                  >
                    <Camera className="size-8 text-background" aria-hidden />
                  </span>
                </label>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {/* <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={avatarUploading || !accessToken}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarUploading ? "Uploading…" : "Upload new"}
                  </Button>
                  {user.avatar_url ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={avatarRemoving || !accessToken}
                      onClick={() => void handleRemoveAvatar()}
                    >
                      {avatarRemoving ? "Removing…" : "Remove"}
                    </Button>
                  ) : null} */}
                </div>
                <p className="max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
                  JPG, PNG, WebP, or GIF · max 2&nbsp;MB
                </p>
              </div>

              <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
                <p className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {displayName}
                </p>
                <p className="mt-1.5 truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
                <Badge variant="secondary" className="mt-4 font-medium">
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-start gap-3.5 border-b border-border bg-primary/[0.04] px-5 py-4 sm:gap-4 sm:px-8 sm:py-4">
            <ProfileIconBadge aria-hidden>
              <UserRound className="size-5" strokeWidth={1.75} />
            </ProfileIconBadge>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-[0.9375rem] font-semibold leading-tight text-foreground">
                Display name
              </h2>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                How your name appears in the header and across the workspace
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-5 sm:px-8 sm:py-6">
            <div className="space-y-2">
              <FormLabel
                htmlFor="full-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Full name
              </FormLabel>
              <ProfileInputFrame>
                <FormInput
                  id="full-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  autoComplete="name"
                  className={cn(
                    "h-11 border-0 bg-transparent shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                />
              </ProfileInputFrame>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-[55%]">
                Changes apply immediately after you save and sync everywhere
                you&apos;re signed in.
              </p>
              <PrimaryButton
                type="submit"
                disabled={saving || !accessToken}
                className="w-full shrink-0 sm:w-auto sm:min-w-30"
              >
                {saving ? "Saving…" : "Save"}
              </PrimaryButton>
            </div>
          </form>
        </ProfileCard>
      </div>
    </div>
  );
}
