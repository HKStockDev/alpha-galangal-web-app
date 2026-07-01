"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_TYPES,
  RELATIONSHIP_ROLE_LABELS,
  TIME_HORIZON_LABELS,
  createClientEntity,
  deleteClientEntity,
  deleteOrganizationClient,
  fetchMyOrganizations,
  getOrganizationClient,
  listClientEntities,
  updateClientEntity,
  updateOrganizationClient,
  type ClientEntity,
  type ClientType,
  type CreateClientEntityBody,
  type OrganizationClient,
} from "@/lib/api";
import { ORG_DASHBOARD } from "@/lib/auth-routing";
import {
  buildClientEntityBodyFromForm,
  emptyEntityForm,
  entityToForm,
  type EntityFormState,
} from "@/lib/clients-entity-form";
import { ClientEntityDialog } from "@/components/clients/client-entity-dialog";
import { Badge } from "@/components/ui/badge";
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
import { FormInput, FormLabel } from "@/components/ui-kit/forms";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";

export default function OrganizationClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const router = useRouter();
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useToast();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [client, setClient] = useState<OrganizationClient | null>(null);
  const [entities, setEntities] = useState<ClientEntity[]>([]);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientType, setClientType] = useState<ClientType>("family_individual");
  const [clientDeleteTarget, setClientDeleteTarget] = useState(false);

  const [entityForm, setEntityForm] = useState<EntityFormState>(() => emptyEntityForm());
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [entityDeleteTarget, setEntityDeleteTarget] = useState<ClientEntity | null>(null);

  const listPath = `${ORG_DASHBOARD}/clients`;

  const loadPage = useCallback(async () => {
    if (!accessToken || !organizationId || !clientId) return;
    setIsPageLoading(true);
    setLoadError(null);
    try {
      const [c, ent] = await Promise.all([
        getOrganizationClient(accessToken, organizationId, clientId),
        listClientEntities(accessToken, organizationId, clientId),
      ]);
      setClient(c);
      setEntities(ent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load client";
      setLoadError(msg);
      setClient(null);
      setEntities([]);
    } finally {
      setIsPageLoading(false);
    }
  }, [accessToken, organizationId, clientId]);

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
    void loadPage();
  }, [loadPage]);

  function resetEntityForm() {
    setEntityForm(emptyEntityForm());
    setEditingEntityId(null);
  }

  function openNewEntityModal() {
    resetEntityForm();
    setEntityModalOpen(true);
  }

  async function onSubmitEntity(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !organizationId || !clientId) return;
    let payload: CreateClientEntityBody;
    try {
      payload = buildClientEntityBodyFromForm(entityForm, Boolean(editingEntityId));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Invalid entity form");
      return;
    }
    try {
      if (editingEntityId) {
        await updateClientEntity(accessToken, organizationId, clientId, editingEntityId, payload);
        showSuccess("Entity updated");
      } else {
        await createClientEntity(accessToken, organizationId, clientId, payload);
        showSuccess("Entity created");
      }
      setEntityModalOpen(false);
      resetEntityForm();
      await loadPage();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save entity");
    }
  }

  async function onSubmitClientEdit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !organizationId || !clientId || !client) return;
    if (!clientName.trim()) {
      showError("Client name is required");
      return;
    }
    try {
      const updated = await updateOrganizationClient(accessToken, organizationId, clientId, {
        name: clientName.trim(),
        client_type: clientType,
      });
      setClient(updated);
      showSuccess("Client updated");
      setClientModalOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update client");
    }
  }

  async function confirmDeleteClient() {
    if (!accessToken || !organizationId || !clientId) return;
    setIsDeleting(true);
    try {
      await deleteOrganizationClient(accessToken, organizationId, clientId);
      showSuccess("Client deleted");
      router.push(listPath);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete client");
    } finally {
      setIsDeleting(false);
      setClientDeleteTarget(false);
    }
  }

  async function confirmDeleteEntity() {
    if (!accessToken || !organizationId || !clientId || !entityDeleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteClientEntity(accessToken, organizationId, clientId, entityDeleteTarget.id);
      showSuccess("Entity deleted");
      setEntityDeleteTarget(null);
      resetEntityForm();
      await loadPage();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete entity");
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

  if (!organizationId) {
    return (
      <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
        <p className="text-sm text-muted-foreground">No organization available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4">
          <Link
            href={listPath}
            className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All clients
          </Link>

          {isPageLoading && !client ? (
            <LoadingSkeleton variant="card" lines={2} />
          ) : loadError || !client ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client not found</CardTitle>
                <CardDescription>{loadError ?? "This client may have been removed."}</CardDescription>
              </CardHeader>
              <CardContent>
                <SecondaryButton asChild>
                  <Link href={listPath}>Back to clients</Link>
                </SecondaryButton>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      {client.name}
                    </h1>
                    <Badge variant="outline">{CLIENT_TYPE_LABELS[client.client_type]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Client ID: {client.id}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      setClientName(client.name);
                      setClientType(client.client_type);
                      setClientModalOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 size-4" aria-hidden />
                    Edit client
                  </SecondaryButton>
                  <PrimaryButton type="button" onClick={openNewEntityModal}>
                    <Plus className="mr-1 size-4" aria-hidden />
                    New entity
                  </PrimaryButton>
                  <DangerButton type="button" onClick={() => setClientDeleteTarget(true)}>
                    <Trash2 className="mr-1 size-4" aria-hidden />
                    Delete client
                  </DangerButton>
                </div>
              </div>

              <section>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Entities</CardTitle>
                    <CardDescription>
                      People or profiles linked to this client (household members, plans, etc.).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-border">
                      {isPageLoading ? (
                        <LoadingSkeleton variant="card" lines={3} className="m-4" />
                      ) : entities.length === 0 ? (
                        <EmptyState
                          compact
                          description="No entities yet. Add one to capture roles, risk, and preferences."
                          className="m-4"
                        />
                      ) : (
                        <DataTable tableClassName="w-full">
                          <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableHead>Entity</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Risk</TableHead>
                              <TableHead>Horizon</TableHead>
                              <TableHead>Objectives</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entities.map((entity) => (
                              <TableRow key={entity.id}>
                                <TableCell className="font-medium text-foreground">
                                  {entity.display_name}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {entity.relationship_role
                                    ? RELATIONSHIP_ROLE_LABELS[entity.relationship_role]
                                    : "Not set"}
                                </TableCell>
                                <TableCell>
                                  {entity.risk_score ? (
                                    <Badge
                                      variant={
                                        entity.risk_score >= 8
                                          ? "destructive"
                                          : entity.risk_score >= 5
                                            ? "secondary"
                                            : "outline"
                                      }
                                    >
                                      {entity.risk_score}/10
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {entity.time_horizon_category
                                    ? TIME_HORIZON_LABELS[entity.time_horizon_category]
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {entity.investment_objectives?.length ?? 0}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                  {entity.notes || "-"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-1">
                                    <GhostButton
                                      type="button"
                                      size="sm"
                                      className="text-primary hover:bg-primary/10 hover:text-primary"
                                      aria-label={`Edit entity ${entity.display_name}`}
                                      onClick={() => {
                                        setEntityForm(entityToForm(entity));
                                        setEditingEntityId(entity.id);
                                        setEntityModalOpen(true);
                                      }}
                                    >
                                      <Pencil className="mr-1 size-4" aria-hidden />
                                      Edit
                                    </GhostButton>
                                    <DangerButton
                                      type="button"
                                      size="sm"
                                      aria-label={`Delete entity ${entity.display_name}`}
                                      onClick={() => setEntityDeleteTarget(entity)}
                                    >
                                      <Trash2 className="mr-1 size-4" aria-hidden />
                                      Delete
                                    </DangerButton>
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
            </>
          )}
        </div>
      </div>

      <Dialog
        open={clientModalOpen}
        onOpenChange={(open) => {
          setClientModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription>Update the client name and type.</DialogDescription>
          </DialogHeader>
          <form id="client-edit-form" className="grid gap-4 py-2" onSubmit={onSubmitClientEdit}>
            <div className="space-y-2">
              <FormLabel htmlFor="client-detail-name">Client name</FormLabel>
              <FormInput
                id="client-detail-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
                autoComplete="organization"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="client-detail-type">Client type</FormLabel>
              <select
                id="client-detail-type"
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
            <SecondaryButton type="button" onClick={() => setClientModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" form="client-edit-form">
              Save changes
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientEntityDialog
        open={entityModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEntityModalOpen(false);
            resetEntityForm();
          }
        }}
        clientDisplayName={client?.name ?? "this client"}
        editingEntityId={editingEntityId}
        entityForm={entityForm}
        setEntityForm={setEntityForm}
        onSubmit={onSubmitEntity}
      />

      <AlertDialog open={clientDeleteTarget} onOpenChange={setClientDeleteTarget}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {client?.name ?? "this client"} and all linked entities.
              This action cannot be undone.
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

      <AlertDialog
        open={Boolean(entityDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setEntityDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {entityDeleteTarget?.display_name ?? "this entity"}. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <DangerButton type="button" onClick={confirmDeleteEntity} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete entity"}
            </DangerButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
