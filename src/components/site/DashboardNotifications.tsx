import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  related_booking_id: string | null;
  related_support_case_id: string | null;
  read_at: string | null;
  created_at: string;
};

function niceTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function safeLink(n: NotificationRow) {
  if (n.link) return n.link;
  if (n.related_booking_id) return "/bookings";
  if (n.related_support_case_id) return "/admin";
  return "/dashboard";
}

export function DashboardNotifications({ userId }: { userId: string }) {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read_at).length,
    [items],
  );

  const load = async () => {
    try {
      setErrorText(null);

      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, user_id, type, title, body, link, related_booking_id, related_support_case_id, read_at, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        setErrorText(error.message);
        setItems([]);
        return;
      }

      setItems((data as NotificationRow[]) ?? []);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Notifications failed to load.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  const markOneRead = async (id: string) => {
    setBusy(id);

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() } as never)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
        ),
      );
    } finally {
      setBusy(null);
    }
  };

  const markAllRead = async () => {
    setBusy("all");

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() } as never)
        .eq("user_id", userId)
        .is("read_at", null);

      if (error) {
        toast.error(error.message);
        return;
      }

      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
      toast.success("Notifications marked read");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-700">
            <Bell className="h-5 w-5 text-primary" /> Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-700 text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Booking, payment, payout, support, and account alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-700 hover:bg-muted disabled:opacity-50"
          >
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={busy === "all"}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-700 text-primary-foreground disabled:opacity-50"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
        </div>
      ) : errorText ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Notifications are unavailable right now: {errorText}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          No notifications yet.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item) => {
            const unread = !item.read_at;
            const link = safeLink(item);

            return (
              <div
                key={item.id}
                className={`rounded-2xl border border-border p-3 ${unread ? "bg-primary/5" : "bg-background"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link to={link as never} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                      <p className="font-700">{item.title}</p>
                    </div>
                    {item.body && (
                      <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{niceTime(item.created_at)}</p>
                  </Link>

                  {unread && (
                    <button
                      type="button"
                      onClick={() => markOneRead(item.id)}
                      disabled={busy === item.id}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-700 hover:bg-muted disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
