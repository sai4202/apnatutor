"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

/**
 * Shows an identity or education document — M5-06.3.
 *
 * <h2>Why this is not an img tag</h2>
 *
 * <p>The only route to these files is {@code GET /admin/files/**}, which is guarded by
 * {@code @PreAuthorize("hasRole('ADMIN')")} and therefore needs the bearer token. A browser will
 * not attach that to an {@code <img src>}, and the access token deliberately lives in memory rather
 * than a cookie, so there is nothing for the browser to send on its own. The document is fetched
 * with the same {@code authFetch} as everything else and handed to the DOM as a blob URL.
 *
 * <p>The blob URL is revoked on unmount. Object URLs pin their blob in memory for the life of the
 * document otherwise, and this is a screen an admin scrolls through — leaking an Aadhaar scan per
 * card into the tab's memory for the rest of the session is exactly the wrong thing to do with
 * these particular bytes.
 *
 * <h2>Why it does not load on its own</h2>
 *
 * <p>Nothing is fetched until the reviewer asks. Opening a queue of twenty should not pull twenty
 * identity documents into the browser, most of which will never be looked at: each one is a
 * government ID, and the fewer copies that exist the better. It also keeps the queue itself fast.
 */
export function DocumentViewer({ storageKey }: { storageKey: string }) {
  const { authFetch } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  // Revoke on unmount, and whenever a previous document is replaced.
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  async function reveal() {
    setState("loading");
    try {
      const res = await authFetch(`/admin/files/${storageKey}`);
      if (!res.ok) {
        setState("error");
        return;
      }
      const blob = await res.blob();
      setContentType(blob.type);
      setBlobUrl(URL.createObjectURL(blob));
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (state === "error") {
    return (
      <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700 ring-1 ring-danger-600/20">
        That document could not be loaded. It may have been removed from storage.
      </p>
    );
  }

  if (!blobUrl) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-ink-50 px-3 py-2.5 ring-1 ring-ink-200">
        <Button size="sm" variant="secondary" disabled={state === "loading"} onClick={() => void reveal()}>
          {state === "loading" ? "Opening…" : "View document"}
        </Button>
        <p className="text-xs text-ink-500">
          Not loaded until asked for — these are identity documents, and the fewer copies in a
          browser the better.
        </p>
      </div>
    );
  }

  return (
    <figure className="mt-3">
      {contentType === "application/pdf" ? (
        <object
          data={blobUrl}
          type="application/pdf"
          aria-label="Submitted document"
          className="h-[28rem] w-full rounded-lg ring-1 ring-ink-200"
        >
          {/* An older browser with no inline PDF viewer still gets a way through. */}
          <a href={blobUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
            Open the PDF in a new tab
          </a>
        </object>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element --
           next/image cannot render a blob: URL: it rewrites the src through the optimizer,
           which needs a fetchable remote or local path. There is also nothing to optimise —
           the bytes are already in memory, are looked at once, and must never be cached. */
        <img
          src={blobUrl}
          alt="Submitted verification document"
          className="max-h-[28rem] w-auto rounded-lg ring-1 ring-ink-200"
        />
      )}
      <figcaption className="mt-1.5 flex items-center gap-3 text-xs text-ink-500">
        <a href={blobUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
          Open full size
        </a>
        <button
          type="button"
          className="text-ink-500 underline"
          onClick={() => {
            URL.revokeObjectURL(blobUrl);
            setBlobUrl(null);
          }}
        >
          Close
        </button>
      </figcaption>
    </figure>
  );
}
