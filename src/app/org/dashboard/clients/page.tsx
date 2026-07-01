"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_TYPES,
  createOrganizationClient,
  deleteOrganizationClient,
  fetchMyOrganizations,
  listOrganizationClients,
  updateOrganizationClient,
  type ClientType,
  type OrganizationClient,
} from "@/lib/api";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import {
  DangerButton,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from "@/components/ui-kit/buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui-kit/data-table";
import { LoadingSkeleton } from "@/components/ui-kit/loading-skeleton";
import { EmptyState } from "@/components/ui-kit/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [clients, setClients] = useState<OrganizationClient[]>([]);

  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isClientsLoading, setIsClientsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientType, setClientType] = useState<ClientType>("family_individual");
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [clientDeleteTarget, setClientDeleteTarget] = useState<OrganizationClient | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const loadClients = useCallback(async () => {
    if (!accessToken || !organizationId) return;
    setIsClientsLoading(true);
    try {
      const rows = await listOrganizationClients(accessToken, organizationId);
      setClients(rows);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setIsClientsLoading(false);
    }
  }, [accessToken, organizationId, showError]);

  useEffect(() => {
    if (!accessToken) return;
    setIsBootLoading(true);
    fetchMyOrganizations(accessToken)
      .then((orgs) => {
        if (orgs.length === 0) {
          showError("No organization found for this account");
          return;
        }
        setOrganizationId(orgs[0].id);
      })
      .catch((err) =>
        showError(err instanceof Error ? err.message : "Failed to resolve organization")
      )
      .finally(() => setIsBootLoading(false));
  }, [accessToken, showError]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  function resetClientForm() {
    setClientName("");
    setClientType("family_individual");
    setEditingClientId(null);
  }

  async function onSubmitClient(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !organizationId) return;
    if (!clientName.trim()) {
      showError("Client name is required");
      return;
    }
    try {
      if (editingClientId) {
        await updateOrganizationClient(accessToken, organizationId, editingClientId, {
          name: clientName.trim(),
          client_type: clientType,
        });
        showSuccess("Client updated");
        resetClientForm();
        setClientModalOpen(false);
        await loadClients();
      } else {
        const created = await createOrganizationClient(accessToken, organizationId, {
          name: clientName.trim(),
          client_type: clientType,
        });
        showSuccess("Client created");
        resetClientForm();
        setClientModalOpen(false);
        await loadClients();
        router.push(`${ORG_DASHBOARD}/clients/${created.id}`);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save client");
    }
  }

  async function confirmDeleteClient() {
    if (!accessToken || !organizationId || !clientDeleteTarget) return;
    const deletedId = clientDeleteTarget.id;
    setIsDeleting(true);
    try {
      await deleteOrganizationClient(accessToken, organizationId, deletedId);
      showSuccess("Client deleted");
      setClientDeleteTarget(null);
      resetClientForm();
      await loadClients();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete client");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isBootLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Clients</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each client has its own page for entities, roles, and preferences.
            </p>
          </div>
          <PrimaryButton
            type="button"
            className="shrink-0 self-end sm:self-auto"
            onClick={() => {
              resetClientForm();
              setClientModalOpen(true);
            }}
          >
            New client
          </PrimaryButton>
        </div>

        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All clients</CardTitle>
              <CardDescription>Open a client to view and edit entities and details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-border">
                {isClientsLoading ? (
                  <LoadingSkeleton variant="card" lines={3} className="m-4" />
                ) : clients.length === 0 ? (
                  <EmptyState
                    compact
                    description="No clients yet. Create your first client to get started."
                    className="m-4"
                  />
                ) : (
                  <DataTable tableClassName="w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[1%] whitespace-nowrap text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="py-3">
                            <Link
                              href={`${ORG_DASHBOARD}/clients/${client.id}`}
                              className="group inline-flex min-w-0 items-center gap-2 text-left"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground group-hover:underline">
                                  {client.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Open record
                                  <ChevronRight
                                    className="ml-0.5 inline size-3 align-text-bottom opacity-70"
                                    aria-hidden
                                  />
                                </span>
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant="outline">{CLIENT_TYPE_LABELS[client.client_type]}</Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <GhostButton
                                    type="button"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    aria-label={`Open actions for ${client.name}`}
                                  >
                                    <MoreHorizontal className="size-4" aria-hidden />
                                  </GhostButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                  <DropdownMenuItem asChild>
                                    <Link href={`${ORG_DASHBOARD}/clients/${client.id}`}>
                                      <ChevronRight className="mr-2 size-4" aria-hidden />
                                      Open client page
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setEditingClientId(client.id);
                                      setClientName(client.name);
                                      setClientType(client.client_type);
                                      setClientModalOpen(true);
                                    }}
                                  >
                                    <Pencil className="mr-2 size-4" aria-hidden />
                                    Edit name &amp; type
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-700 focus:text-red-700"
                                    onSelect={() => setClientDeleteTarget(client)}
                                  >
                                    <Trash2 className="mr-2 size-4" aria-hidden />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <Dialog
          open={clientModalOpen}
          onOpenChange={(open) => {
            setClientModalOpen(open);
            if (!open) resetClientForm();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingClientId ? "Edit client" : "New client"}</DialogTitle>
              <DialogDescription>
                {editingClientId
                  ? "Update the client name and type."
                  : "Add a new client. You will be taken to their page to add entities."}
              </DialogDescription>
            </DialogHeader>
            <form id="client-form" className="grid gap-4 py-2" onSubmit={onSubmitClient}>
              <div className="space-y-2">
                <FormLabel htmlFor="client-name">Client name</FormLabel>
                <FormInput
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <FormLabel htmlFor="client-type">Client type</FormLabel>
                <select
                  id="client-type"
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value as ClientType)}
                  className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                >
                  {CLIENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CLIENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </form>
            <DialogFooter className="gap-3 sm:justify-end sm:gap-4">
              <SecondaryButton
                type="button"
                onClick={() => {
                  setClientModalOpen(false);
                  resetClientForm();
                }}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" form="client-form">
                {editingClientId ? "Save changes" : "Create client"}
              </PrimaryButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog
        open={Boolean(clientDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setClientDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {clientDeleteTarget?.name ?? "this client"} and all linked
              entities. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <DangerButton type="button" onClick={confirmDeleteClient} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete client"}
            </DangerButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
