"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { submitMarketingContact } from "@/lib/api";

type ContactFormProps = {
  submitLabel?: string;
  /** Pre-fill / placeholder copy for the message textarea. */
  messagePlaceholder?: string;
};

const ROLE_OPTIONS = [
  "Portfolio Manager",
  "Research Analyst",
  "Investment Analyst",
  "Director of Research / Head of Research",
  "Chief Investment Officer",
  "Founder / Managing Partner",
  "Financial Advisor / RIA Principal",
  "Wealth Manager",
  "Compliance / Legal",
  "Operations / COO",
  "Client Service / Relationship Manager",
  "Trader",
  "Data / Quant",
  "Student / Other",
] as const;

const INITIAL_VALUES = {
  name: "",
  firm: "",
  email: "",
  role: "",
  message: "",
};

export function ContactForm({
  submitLabel = "Send Message",
  messagePlaceholder = "How can we help?",
}: ContactFormProps) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const update = <K extends keyof typeof INITIAL_VALUES>(key: K) =>
    (value: string) =>
      setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      name: values.name.trim(),
      firm: values.firm.trim(),
      email: values.email.trim(),
      role: values.role,
      message: values.message.trim(),
    };

    if (!payload.name || !payload.firm || !payload.email || !payload.role || !payload.message) {
      setErrorMessage("Please fill in every field before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMarketingContact(payload);
      setIsSubmitted(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Thank you for reaching out
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll be in touch within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            value={values.name}
            onChange={(e) => update("name")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="firm">Firm</Label>
          <Input
            id="firm"
            name="firm"
            type="text"
            required
            autoComplete="organization"
            placeholder="Your firm or company"
            value={values.firm}
            onChange={(e) => update("firm")(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => update("email")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={values.role} onValueChange={update("role")}>
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder={messagePlaceholder}
          value={values.message}
          onChange={(e) => update("message")(e.target.value)}
        />
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Spinner className="mr-2 size-4" />
            Sending...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
