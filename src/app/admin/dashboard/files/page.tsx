"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { uploadHedgeFundsCsv } from "@/lib/api";
import { PrimaryButton } from "@/components/ui-kit/buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormLabel } from "@/components/ui-kit/forms";

export default function FilesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAuth();
  const { showSuccess, showError } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !accessToken) return;

    setIsSubmitting(true);
    try {
      const result = await uploadHedgeFundsCsv(file, accessToken);
      showSuccess(`Successfully processed ${result.processed} rows`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      showError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-0 px-4 py-8 sm:px-8 md:px-10 lg:px-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">
          Upload 13F fund performance CSV files
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload</CardTitle>
              <CardDescription>13F fund performance CSV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormLabel htmlFor="csv-file">13F Fund Performance CSV</FormLabel>
                <input
                  ref={fileInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                />
                {file && (
                  <p className="text-sm text-muted-foreground">Selected: {file.name}</p>
                )}
              </div>

              <PrimaryButton type="submit" disabled={!file || isSubmitting || !accessToken}>
                {isSubmitting ? "Uploading…" : "Upload CSV"}
              </PrimaryButton>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expected CSV structure</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Columns: filer_id, Filer, Business Phone, WhaleScore 1 Yr Equal-Wt,
              WhaleScore 1 Yr Mgr-Wt, Fund Size, Holdings, 13F AUM, Turnover, % in
              Top 10, and more. See form_13f_performance CSV format.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
