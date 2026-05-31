import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Notification = {
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

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.max(0, Math.round(diff / 60000));

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationLink(n: Notification) {
  if (n.link) return n.link;
  if (n.related_booking_id) return "/bookings";
  if (n.related_support_case_id) return "/admin";
  return "/dashboard";
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications],
  );

  const load = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, type, title, body, link, related_booking_id, related_support_case_id, read_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Could not load notifications");
      return;
    }

    setNotifications((data as Notification[]) ?? []);
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    load();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const next = payload.new as Notification;
          setNotifications((current) => [next, ...current].slice(0, 20));
          toast.info(next.title, {
            description: next.body ?? undefined,
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((current) =>
            current.map((n) => (n.id === updated.id ? updated : n)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current) return;
      if (event.target instanceof Node && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      toast.error(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((n) => ({
        ...n,
        read_at: n.read_at ?? new Date().toISOString(),
      })),
    );
  };

  const markOneRead = async (id: string) => {
    const existing = notifications.find((n) => n.id === id);
    if (!existing || existing.read_at) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setNotifications((current) =>
      current.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
  };

  if (!user) return null;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-foreground hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-800 leading-none text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-border bg-card shadow-warm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-display text-base font-700">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-700 hover:bg-muted disabled:opacity-50"
            >
              <CheckCheck className="h-3 w-3" /> Mark read
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((n) => (
                  <a
                    key={n.id}
                    href={notificationLink(n)}
                    onClick={() => {
                      markOneRead(n.id);
                      setOpen(false);
                    }}
                    className={`block rounded-2xl px-3 py-3 text-sm hover:bg-muted ${
                      n.read_at ? "opacity-70" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-700">{n.title}</p>
                      {!n.read_at && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    {n.body && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
