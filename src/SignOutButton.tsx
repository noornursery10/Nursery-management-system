"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { api } from "../convex/_generated/api";

/**
 * PROTECTED TEMPLATE COMPONENT
 *
 * Account dropdown for signed-in users. Renders an avatar/email button that
 * opens a menu with: identity, admin badge (when applicable), inline
 * change-password form, and sign-out.
 *
 * Despite the name, this component covers the full authenticated-user UI —
 * place it once in your app header and the user automatically gets account
 * management without needing a separate Settings page. Returns null when no
 * user is signed in.
 */
export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "password">("menu");
  const [menuPos, setMenuPos] = useState<{
    top: number;
    right: number;
    maxHeight: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Place the (portaled, position:fixed) menu so it is always ON SCREEN.
   *
   * This used to be `top: rect.bottom + 8` unconditionally — always downward,
   * with no check for whether there was room. Because the panel is `fixed`, it
   * is measured against the viewport and does NOT move when the page scrolls,
   * so any trigger low on the screen (the classic one: a profile control at the
   * foot of a dashboard sidebar, or any header on a short/mobile viewport) put
   * the menu below the fold permanently — invisible, and unreachable by
   * scrolling.
   *
   * Now: open downward when it fits, flip upward when it does not and there is
   * more room above, clamp to the viewport either way, and cap the height so a
   * panel taller than the screen scrolls internally instead of overflowing.
   */
  const positionMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const GAP = 8; // breathing room between trigger and panel
    const EDGE = 8; // never touch the window edge

    // Real measurement once the panel is mounted; the fallback only ever
    // applies if it is called before the first layout pass.
    const menuH = menuRef.current?.offsetHeight ?? 320;
    const menuW = menuRef.current?.offsetWidth ?? 288; // w-72

    const spaceBelow = window.innerHeight - rect.bottom - GAP - EDGE;
    const spaceAbove = rect.top - GAP - EDGE;

    // Flip up only when below genuinely cannot hold it AND above is roomier —
    // so the default stays downward, which is what people expect.
    const openUp = spaceBelow < menuH && spaceAbove > spaceBelow;

    const maxHeight = Math.max(160, openUp ? spaceAbove : spaceBelow);
    const height = Math.min(menuH, maxHeight);

    let top = openUp ? rect.top - GAP - height : rect.bottom + GAP;
    top = Math.min(Math.max(EDGE, top), Math.max(EDGE, window.innerHeight - height - EDGE));

    // Right-aligned to the trigger, but never pushed off the opposite edge —
    // which is what happened in RTL apps, where the trigger sits near the left.
    let right = window.innerWidth - rect.right;
    right = Math.min(Math.max(EDGE, right), Math.max(EDGE, window.innerWidth - menuW - EDGE));

    setMenuPos({ top, right, maxHeight });
  };

  /**
   * Measure and place BEFORE paint, so the panel never appears in the wrong
   * spot for a frame. `view` is a dependency because switching to the inline
   * change-password form changes the panel's height, which can change whether
   * it still fits below.
   */
  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    positionMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
        setView("menu");
      }
    };
    const onReposition = () => positionMenu();
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  if (!isAuthenticated) {
    return null;
  }

  const email = user?.email ?? "Account";
  const initials = email.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setView("menu");
        }}
        className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-semibold">
          {initials}
        </span>
        <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[10rem] truncate">
          {email}
        </span>
        {user?.isAdmin && (
          <span className="hidden sm:inline px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            Admin
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gray-400"
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>

      {open &&
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          /* Rendered as soon as it opens (not gated on menuPos) so the layout
             effect above can measure its real height before paint. Hidden for
             that one pass so it is never seen at the unpositioned spot. */
          style={{
            position: "fixed",
            top: menuPos?.top ?? 0,
            right: menuPos?.right ?? 0,
            visibility: menuPos ? "visible" : "hidden",
            maxHeight: menuPos?.maxHeight,
            overflowY: "auto",
          }}
          className="w-72 rounded-xl bg-white shadow-xl border border-gray-200 z-[1000] overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Signed in as
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">
                {email}
              </span>
              {user?.isAdmin && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  Admin
                </span>
              )}
            </div>
          </div>

          {view === "menu" ? (
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => setView("password")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Change password
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <ChangePasswordPanel onDone={() => setView("menu")} />
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

function ChangePasswordPanel({ onDone }: { onDone: () => void }) {
  const changePassword = useAction(api.auth.changePassword);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ newPassword });
      toast.success("Password changed.");
      setNewPassword("");
      setConfirmPassword("");
      onDone();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not change password.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-900">Change password</h4>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={submitting || !newPassword || !confirmPassword}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {submitting ? "Changing…" : "Save new password"}
        </button>
      </form>
      <button
        type="button"
        onClick={onDone}
        className="mt-3 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back
      </button>
    </div>
  );
}
