import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Star,
  EyeOff,
  Eye,
  Trash2,
  ShieldCheck,
  Loader2,
  Users,
  CalendarDays,
  BadgeCheck,
  Ban,
  RotateCcw,
  UserCog,
  XCircle,
  MessageSquare,
  MessageSquareWarning,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  History,
} from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — JaxStay" }] }),
  component: AdminPage,
});

type Role = "admin" | "moderator" | "user";
type AdminTab =
  | "overview"
  | "users"
  | "bookings"
  | "reviews"
  | "support"
  | "moderators";

type Review = {
  id: string;
  sitter_id: string;
  author_id: string;
  rating: number;
  body: string | null;
  hidden: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  is_sitter: boolean | null;
  inactive: boolean | null;
  sitter_test_passed_at: string | null;
  verification_status: string | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
  banned_at: string | null;
  ban_reason: string | null;
  verification_badge_at: string | null;
  created_at: string | null;
};

type Booking = {
  id: string;
  owner_id: string;
  sitter_id: string;
  service: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  payment_status: string | null;
  amount_cents: number | null;
  platform_fee_cents: number | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  payout_released: boolean | null;
  canceled_at: string | null;
  canceled_by: string | null;
  cancellation_reason: string | null;
  refund_status: string | null;
  refund_amount_cents: number | null;
  admin_notes: string | null;
  client_completed_at: string | null;
  sitter_completed_at: string | null;
  payout_released_at: string | null;
  updated_at: string | null;
  created_at: string;
};

type SupportCase = {
  id: string;
  created_by: string | null;
  assigned_to: string | null;
  related_user_id: string | null;
  related_booking_id: string | null;
  type: string | null;
  status: string | null;
  priority: string | null;
  subject: string | null;
  body: string | null;
  resolution_notes: string | null;
  created_at: string;
  assigned_at: string | null;
  escalated_at: string | null;
  closed_at: string | null;
};

type SupportCaseEvent = {
  id: string;
  case_id: string;
  actor_id: string | null;
  action: string;
  note: string | null;
  created_at: string;
};

type UserRole = {
  user_id: string;
  role: Role;
};

type ModeratorPermissions = {
  user_id: string;
  can_view_users: boolean | null;
  can_message_users: boolean | null;
  can_view_support_cases: boolean | null;
  can_take_support_cases: boolean | null;
  can_close_support_cases: boolean | null;
  can_escalate_support_cases: boolean | null;
  can_manage_reviews: boolean | null;
  can_review_background_checks: boolean | null;
  can_approve_background_badges: boolean | null;
  can_view_bookings: boolean | null;
  can_edit_bookings: boolean | null;
  can_ban_users: boolean | null;
  can_unlist_sitters: boolean | null;
  updated_at: string | null;
};

type EffectivePermissions = Omit<
  ModeratorPermissions,
  "user_id" | "updated_at"
>;

const FULL_PERMISSIONS: EffectivePermissions = {
  can_view_users: true,
  can_message_users: true,
  can_view_support_cases: true,
  can_take_support_cases: true,
  can_close_support_cases: true,
  can_escalate_support_cases: true,
  can_manage_reviews: true,
  can_review_background_checks: true,
  can_approve_background_badges: true,
  can_view_bookings: true,
  can_edit_bookings: true,
  can_ban_users: true,
  can_unlist_sitters: true,
};

const DEFAULT_MODERATOR_PERMISSIONS: EffectivePermissions = {
  can_view_users: true,
  can_message_users: true,
  can_view_support_cases: true,
  can_take_support_cases: true,
  can_close_support_cases: false,
  can_escalate_support_cases: true,
  can_manage_reviews: true,
  can_review_background_checks: true,
  can_approve_background_badges: false,
  can_view_bookings: true,
  can_edit_bookings: false,
  can_ban_users: false,
  can_unlist_sitters: false,
};

function getEffectivePermissions(
  role: Role | null,
  row?: ModeratorPermissions,
): EffectivePermissions {
  if (role === "admin") return FULL_PERMISSIONS;
  if (role !== "moderator") {
    return Object.fromEntries(
      Object.keys(FULL_PERMISSIONS).map((key) => [key, false]),
    ) as EffectivePermissions;
  }

  return {
    can_view_users:
      row?.can_view_users ?? DEFAULT_MODERATOR_PERMISSIONS.can_view_users,
    can_message_users:
      row?.can_message_users ?? DEFAULT_MODERATOR_PERMISSIONS.can_message_users,
    can_view_support_cases:
      row?.can_view_support_cases ??
      DEFAULT_MODERATOR_PERMISSIONS.can_view_support_cases,
    can_take_support_cases:
      row?.can_take_support_cases ??
      DEFAULT_MODERATOR_PERMISSIONS.can_take_support_cases,
    can_close_support_cases:
      row?.can_close_support_cases ??
      DEFAULT_MODERATOR_PERMISSIONS.can_close_support_cases,
    can_escalate_support_cases:
      row?.can_escalate_support_cases ??
      DEFAULT_MODERATOR_PERMISSIONS.can_escalate_support_cases,
    can_manage_reviews:
      row?.can_manage_reviews ??
      DEFAULT_MODERATOR_PERMISSIONS.can_manage_reviews,
    can_review_background_checks:
      row?.can_review_background_checks ??
      DEFAULT_MODERATOR_PERMISSIONS.can_review_background_checks,
    can_approve_background_badges:
      row?.can_approve_background_badges ??
      DEFAULT_MODERATOR_PERMISSIONS.can_approve_background_badges,
    can_view_bookings:
      row?.can_view_bookings ?? DEFAULT_MODERATOR_PERMISSIONS.can_view_bookings,
    can_edit_bookings:
      row?.can_edit_bookings ?? DEFAULT_MODERATOR_PERMISSIONS.can_edit_bookings,
    can_ban_users:
      row?.can_ban_users ?? DEFAULT_MODERATOR_PERMISSIONS.can_ban_users,
    can_unlist_sitters:
      row?.can_unlist_sitters ??
      DEFAULT_MODERATOR_PERMISSIONS.can_unlist_sitters,
  };
}

const PERMISSION_LABELS: Array<{
  key: keyof EffectivePermissions;
  label: string;
}> = [
  { key: "can_view_users", label: "View users" },
  { key: "can_message_users", label: "Message users" },
  { key: "can_view_support_cases", label: "View support cases" },
  { key: "can_take_support_cases", label: "Take support cases" },
  { key: "can_close_support_cases", label: "Close support cases" },
  { key: "can_escalate_support_cases", label: "Escalate support cases" },
  { key: "can_manage_reviews", label: "Manage reviews" },
  { key: "can_review_background_checks", label: "Review background checks" },
  { key: "can_approve_background_badges", label: "Approve background badges" },
  { key: "can_view_bookings", label: "View bookings" },
  { key: "can_edit_bookings", label: "Edit bookings" },
  { key: "can_ban_users", label: "Ban users" },
  { key: "can_unlist_sitters", label: "Unlist sitters" },
];

function money(cents?: number | null) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function niceDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function shortStripeId(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function copyText(value?: string | null) {
  if (!value) return;
  navigator.clipboard?.writeText(value).catch(() => undefined);
  toast.success("Copied");
}

function statusClass(status?: string | null) {
  const s = (status ?? "").toLowerCase();

  if (
    [
      "paid",
      "confirmed",
      "completed",
      "approved",
      "closed",
      "resolved",
    ].includes(s)
  ) {
    return "bg-green-500/15 text-green-700";
  }

  if (
    [
      "pending",
      "awaiting_payment",
      "open",
      "normal",
      "needs_details",
      "in_review",
    ].includes(s)
  ) {
    return "bg-amber-500/15 text-amber-700";
  }

  if (
    [
      "cancelled",
      "canceled",
      "declined",
      "refunded",
      "banned",
      "escalated",
    ].includes(s)
  ) {
    return "bg-red-500/15 text-red-700";
  }

  return "bg-muted text-muted-foreground";
}

function elapsed(from?: string | null, to?: string | null) {
  if (!from) return "—";
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - start) / 60000));

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function extractBackgroundDocPath(body?: string | null) {
  if (!body) return null;

  const match = body.match(/Document path:\s*(.+)/i);
  if (!match?.[1]) return null;

  let path = match[1].trim();

  // Remove surrounding punctuation or quotes if copied into the case body.
  path = path.replace(/^['"]|['"]$/g, "").trim();

  // If the path includes the bucket name, strip it so Storage gets only the object path.
  path = path.replace(/^background-checks\//, "");

  if (!path || path.toLowerCase().includes("no document path")) return null;

  return path;
}

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-700 ${className}`}
    >
      {children}
    </span>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger" | "primary";
}) {
  const cls =
    tone === "danger"
      ? "border-destructive text-destructive hover:bg-destructive/10"
      : tone === "primary"
        ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
        : "border-border hover:bg-muted";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-700 disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-border bg-card p-5 shadow-soft ${className}`}
    >
      <h2 className="font-display text-xl font-700">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function AdminPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [moderatorPermissions, setModeratorPermissions] = useState<
    ModeratorPermissions[]
  >([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [caseEvents, setCaseEvents] = useState<SupportCaseEvent[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const names = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name || p.email || "JaxStay user"]),
      ),
    [profiles],
  );

  const roleMap = useMemo(() => {
    const map: Record<string, Role[]> = {};
    roles.forEach((r) => {
      map[r.user_id] = map[r.user_id] ?? [];
      map[r.user_id].push(r.role);
    });
    return map;
  }, [roles]);

  const permissionMap = useMemo(() => {
    return Object.fromEntries(moderatorPermissions.map((p) => [p.user_id, p]));
  }, [moderatorPermissions]);

  const permissions = useMemo(
    () =>
      getEffectivePermissions(role, user ? permissionMap[user.id] : undefined),
    [role, user, permissionMap],
  );

  const caseEventsByCase = useMemo(() => {
    const map: Record<string, SupportCaseEvent[]> = {};

    caseEvents.forEach((event) => {
      map[event.case_id] = map[event.case_id] ?? [];
      map[event.case_id].push(event);
    });

    Object.values(map).forEach((events) => {
      events.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    });

    return map;
  }, [caseEvents]);

  const isAdmin = role === "admin";
  const canModerate = role === "admin" || role === "moderator";

  const checkRole = async () => {
    if (!user) return;

    setCheckingRole(true);

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"]);

    if (error) {
      console.error(error);
      setRole(null);
      setCheckingRole(false);
      return;
    }

    const found = (data ?? []).map((r) => r.role as Role);
    setRole(
      found.includes("admin")
        ? "admin"
        : found.includes("moderator")
          ? "moderator"
          : null,
    );
    setCheckingRole(false);
  };

  const load = async () => {
    setLoading(true);

    const [
      profilesRes,
      rolesRes,
      reviewsRes,
      bookingsRes,
      casesRes,
      caseEventsRes,
      moderatorPermissionsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, email, full_name, city, state, avatar_url, is_sitter, inactive, sitter_test_passed_at, verification_status, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, banned_at, ban_reason, verification_badge_at, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select(
          "id, owner_id, sitter_id, service, start_date, end_date, status, payment_status, amount_cents, platform_fee_cents, stripe_checkout_session_id, stripe_payment_intent_id, stripe_transfer_id, payout_released, payout_released_at, canceled_at, canceled_by, cancellation_reason, refund_status, refund_amount_cents, admin_notes, client_completed_at, sitter_completed_at, updated_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("support_cases")
        .select(
          "id, created_by, assigned_to, related_user_id, related_booking_id, type, status, priority, subject, body, resolution_notes, created_at, assigned_at, escalated_at, closed_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("support_case_events")
        .select("id, case_id, actor_id, action, note, created_at")
        .order("created_at", { ascending: true })
        .limit(500),
      supabase.from("moderator_permissions").select("*"),
    ]);

    if (profilesRes.error) toast.error(profilesRes.error.message);
    if (rolesRes.error) console.error(rolesRes.error);
    if (reviewsRes.error) console.error(reviewsRes.error);
    if (bookingsRes.error) console.error(bookingsRes.error);
    if (casesRes.error) console.error(casesRes.error);
    if (caseEventsRes.error) console.error(caseEventsRes.error);
    if (moderatorPermissionsRes.error)
      console.error(moderatorPermissionsRes.error);

    setProfiles((profilesRes.data as Profile[]) ?? []);
    setRoles((rolesRes.data as UserRole[]) ?? []);
    setReviews((reviewsRes.data as Review[]) ?? []);
    setBookings((bookingsRes.data as Booking[]) ?? []);
    setCases((casesRes.data as SupportCase[]) ?? []);
    setCaseEvents((caseEventsRes.data as SupportCaseEvent[]) ?? []);
    setModeratorPermissions(
      (moderatorPermissionsRes.data as ModeratorPermissions[]) ?? [],
    );
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;

    (async () => {
      await checkRole();
      await load();
    })();
  }, [user]);

  const run = async (
    key: string,
    fn: () => Promise<{ error?: { message: string } | null } | void>,
  ) => {
    setBusy(key);

    try {
      const result = await fn();

      if (result && "error" in result && result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Updated");
      await checkRole();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const toggleHidden = async (r: Review) => {
    await run(`review-${r.id}`, () =>
      supabase
        .from("reviews")
        .update({ hidden: !r.hidden } as never)
        .eq("id", r.id),
    );
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete review permanently?")) return;

    await run(`delete-review-${id}`, () =>
      supabase.from("reviews").delete().eq("id", id),
    );
  };

  const unlistSitter = async (id: string, current: boolean | null) => {
    await run(`sitter-${id}`, () =>
      supabase
        .from("profiles")
        .update({ is_sitter: !current } as never)
        .eq("id", id),
    );
  };

  const approveBadge = async (id: string, approved: boolean) => {
    await run(`badge-${id}`, () =>
      supabase
        .from("profiles")
        .update({
          verification_status: approved ? "approved" : "pending",
          verification_badge_at: approved ? new Date().toISOString() : null,
          verification_badge_by: approved ? user?.id : null,
        } as never)
        .eq("id", id),
    );
  };

  const banUser = async (id: string, isBanned: boolean) => {
    if (isBanned) {
      await run(`ban-${id}`, () =>
        supabase
          .from("profiles")
          .update({
            banned_at: null,
            banned_by: null,
            ban_reason: null,
          } as never)
          .eq("id", id),
      );
      return;
    }

    const reason =
      prompt("Why are you banning this account?") ?? "Admin action";

    await run(`ban-${id}`, () =>
      supabase
        .from("profiles")
        .update({
          banned_at: new Date().toISOString(),
          banned_by: user?.id,
          ban_reason: reason,
        } as never)
        .eq("id", id),
    );
  };

  const makeModerator = async (id: string) => {
    await run(`mod-${id}`, () =>
      supabase
        .from("user_roles")
        .insert({ user_id: id, role: "moderator" } as never),
    );
  };

  const removeModerator = async (id: string) => {
    await run(`remove-mod-${id}`, () =>
      supabase
        .from("user_roles")
        .delete()
        .eq("user_id", id)
        .eq("role", "moderator"),
    );
  };

  const recordCaseEvent = async (
    caseId: string,
    action: string,
    note?: string,
  ) => {
    if (!user) return;

    const { error } = await supabase.from("support_case_events").insert({
      case_id: caseId,
      actor_id: user.id,
      action,
      note: note ?? null,
    } as never);

    if (error) {
      console.error(error);
      toast.error(`Case event was not logged: ${error.message}`);
    }
  };

  const openBackgroundDocument = async (body?: string | null) => {
    const path = extractBackgroundDocPath(body);

    if (!path) {
      toast.error("No background-check document path found on this case.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("background-checks")
      .createSignedUrl(path, 60 * 10);

    if (error || !data?.signedUrl) {
      toast.error(
        error?.message ?? "Could not open background-check document.",
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const assignCaseToMe = async (id: string) => {
    const now = new Date().toISOString();
    const existing = cases.find((c) => c.id === id);

    await run(`case-${id}`, async () => {
      const result = await supabase
        .from("support_cases")
        .update({
          assigned_to: user?.id,
          status: "in_review",
          assigned_at: existing?.assigned_at ?? now,
          first_response_at: now,
          last_admin_action_at: now,
        } as never)
        .eq("id", id);

      if (!result.error) {
        await recordCaseEvent(
          id,
          existing?.assigned_to ? "case_reassigned" : "case_taken",
          existing?.assigned_to
            ? "Case reassigned to current admin/moderator."
            : "Case taken by admin/moderator.",
        );
      }

      return result;
    });
  };

  const closeCase = async (id: string) => {
    const notes = prompt("Resolution notes") ?? "Closed by admin/moderator";
    const now = new Date().toISOString();

    await run(`case-close-${id}`, async () => {
      const result = await supabase
        .from("support_cases")
        .update({
          status: "closed",
          resolution_notes: notes,
          closed_at: now,
          last_admin_action_at: now,
        } as never)
        .eq("id", id);

      if (!result.error) {
        await recordCaseEvent(id, "case_closed", notes);
      }

      return result;
    });
  };

  const escalateCase = async (id: string) => {
    const note =
      prompt("Why are you escalating this case?") ?? "Escalated to admin.";
    const now = new Date().toISOString();

    await run(`case-escalate-${id}`, async () => {
      const result = await supabase
        .from("support_cases")
        .update({
          status: "escalated",
          escalated_to: user?.id,
          escalated_at: now,
          last_admin_action_at: now,
        } as never)
        .eq("id", id);

      if (!result.error) {
        await recordCaseEvent(id, "case_escalated", note);
      }

      return result;
    });
  };

  const addBookingNote = async (booking: Booking) => {
    const note = prompt(
      "Admin note for this booking",
      booking.admin_notes ?? "",
    );

    if (note == null) return;

    await run(`booking-note-${booking.id}`, () =>
      supabase
        .from("bookings")
        .update({
          admin_notes: note,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", booking.id),
    );
  };

  const rescheduleBooking = async (booking: Booking) => {
    const start = prompt(
      "New start date (YYYY-MM-DD)",
      booking.start_date ?? "",
    );
    if (start == null) return;

    const end = prompt("New end date (YYYY-MM-DD)", booking.end_date ?? start);
    if (end == null) return;

    await run(`booking-reschedule-${booking.id}`, () =>
      supabase
        .from("bookings")
        .update({
          start_date: start || null,
          end_date: end || null,
          admin_notes: `${booking.admin_notes ?? ""}
Admin rescheduled booking to ${start || "—"} → ${end || "—"}`.trim(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", booking.id),
    );
  };

  const changeBookingStatus = async (booking: Booking) => {
    const status = prompt(
      "Booking status (pending, accepted, confirmed, completed, canceled, declined)",
      booking.status ?? "pending",
    );

    if (status == null) return;

    await run(`booking-status-${booking.id}`, () =>
      supabase
        .from("bookings")
        .update({
          status,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", booking.id),
    );
  };

  const cancelBookingAsAdmin = async (booking: Booking) => {
    const reason = prompt(
      "Cancellation reason",
      booking.cancellation_reason ?? "Admin cancellation",
    );

    if (reason == null) return;

    await run(`booking-cancel-${booking.id}`, () =>
      supabase
        .from("bookings")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
          canceled_by: user?.id,
          cancellation_reason: reason,
          admin_review_status: "needs_review",
          admin_notes: `${booking.admin_notes ?? ""}
Admin canceled booking: ${reason}`.trim(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", booking.id),
    );
  };

  const deleteBookingAsAdmin = async (booking: Booking) => {
    if (
      !confirm(
        "Delete this booking from the database? This is permanent. For real bookings, canceling is usually safer than deleting.",
      )
    ) {
      return;
    }

    await run(`booking-delete-${booking.id}`, () =>
      supabase.from("bookings").delete().eq("id", booking.id),
    );
  };

  const ensureModeratorPermissionRow = async (id: string) => {
    const existing = moderatorPermissions.find((p) => p.user_id === id);
    if (existing) return existing;

    const { data, error } = await supabase
      .from("moderator_permissions")
      .insert({ user_id: id, ...DEFAULT_MODERATOR_PERMISSIONS } as never)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as ModeratorPermissions;
  };

  const toggleModeratorPermission = async (
    id: string,
    key: keyof EffectivePermissions,
    current: boolean,
  ) => {
    await run(`perm-${id}-${key}`, async () => {
      await ensureModeratorPermissionRow(id);

      return supabase
        .from("moderator_permissions")
        .update({
          [key]: !current,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("user_id", id);
    });
  };

  if (checkingRole || loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (!canModerate) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-700">
            Admin access required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({user?.email}) does not have the admin or moderator
            role.
          </p>
        </div>
      </SiteLayout>
    );
  }

  const openCases = cases.filter((c) => c.status !== "closed").length;
  const paidBookings = bookings.filter(
    (b) => b.payment_status === "paid",
  ).length;
  const sitterCount = profiles.filter((p) => p.is_sitter).length;
  const bannedCount = profiles.filter((p) => p.banned_at).length;

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-700 uppercase tracking-wider text-accent">
              JaxStay Command Center
            </p>
            <h1 className="mt-2 font-display text-4xl font-700">Admin Panel</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user?.email} · role:{" "}
              <span className="font-700">{role}</span>
            </p>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-700 hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
          >
            Overview
          </TabButton>
          {permissions.can_view_users && (
            <TabButton active={tab === "users"} onClick={() => setTab("users")}>
              Users
            </TabButton>
          )}
          {permissions.can_view_bookings && (
            <TabButton
              active={tab === "bookings"}
              onClick={() => setTab("bookings")}
            >
              Bookings
            </TabButton>
          )}
          {permissions.can_manage_reviews && (
            <TabButton
              active={tab === "reviews"}
              onClick={() => setTab("reviews")}
            >
              Reviews
            </TabButton>
          )}
          {permissions.can_view_support_cases && (
            <TabButton
              active={tab === "support"}
              onClick={() => setTab("support")}
            >
              Support cases
            </TabButton>
          )}
          {isAdmin && (
            <TabButton
              active={tab === "moderators"}
              onClick={() => setTab("moderators")}
            >
              Moderator settings
            </TabButton>
          )}
        </div>

        {tab === "overview" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label="Users" value={profiles.length} />
            <Stat icon={ShieldCheck} label="Sitters" value={sitterCount} />
            <Stat
              icon={CalendarDays}
              label="Bookings"
              value={bookings.length}
            />
            <Stat
              icon={MessageSquareWarning}
              label="Open cases"
              value={openCases}
            />
            <Stat
              icon={CheckCircle2}
              label="Paid bookings"
              value={paidBookings}
            />
            <Stat
              icon={AlertTriangle}
              label="Banned users"
              value={bannedCount}
            />
          </div>
        )}

        {tab === "users" && permissions.can_view_users && (
          <Panel title={`Users (${profiles.length})`} className="mt-6">
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No profile rows found yet. Run the profile backfill SQL so all
                auth users appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Sitter</th>
                      <th className="p-3">Stripe</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => {
                      const userRoles = roleMap[p.id] ?? [];
                      const isMod = userRoles.includes("moderator");
                      const isUserAdmin = userRoles.includes("admin");
                      const isBanned = !!p.banned_at;

                      return (
                        <tr
                          key={p.id}
                          className="border-t border-border align-top"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                                {p.avatar_url ? (
                                  <img
                                    src={p.avatar_url}
                                    className="h-full w-full object-cover"
                                    alt=""
                                  />
                                ) : null}
                              </div>
                              <div>
                                <p className="font-700">
                                  {p.full_name || "Unnamed"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.city}
                                  {p.state ? `, ${p.state}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {userRoles.length ? (
                                userRoles.map((r) => (
                                  <Pill
                                    key={r}
                                    className="bg-primary/15 text-primary"
                                  >
                                    {r}
                                  </Pill>
                                ))
                              ) : (
                                <Pill className="bg-muted text-muted-foreground">
                                  user
                                </Pill>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="space-y-1">
                              {p.is_sitter ? (
                                <Pill className="bg-green-500/15 text-green-700">
                                  listed
                                </Pill>
                              ) : (
                                <Pill className="bg-muted text-muted-foreground">
                                  client
                                </Pill>
                              )}
                              {p.sitter_test_passed_at ? (
                                <Pill className="bg-accent/20 text-accent-foreground">
                                  test passed
                                </Pill>
                              ) : null}
                              {p.verification_status === "approved" ? (
                                <Pill className="bg-blue-500/15 text-blue-700">
                                  verified
                                </Pill>
                              ) : null}
                            </div>
                          </td>

                          <td className="p-3">
                            {p.stripe_charges_enabled &&
                            p.stripe_payouts_enabled ? (
                              <Pill className="bg-green-500/15 text-green-700">
                                ready
                              </Pill>
                            ) : p.stripe_account_id ? (
                              <Pill className="bg-amber-500/15 text-amber-700">
                                connected
                              </Pill>
                            ) : (
                              <Pill className="bg-muted text-muted-foreground">
                                none
                              </Pill>
                            )}
                          </td>

                          <td className="p-3">
                            {isBanned ? (
                              <Pill className="bg-red-500/15 text-red-700">
                                banned
                              </Pill>
                            ) : (
                              <Pill className="bg-green-500/15 text-green-700">
                                active
                              </Pill>
                            )}
                            {p.ban_reason && (
                              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                                {p.ban_reason}
                              </p>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex max-w-sm flex-wrap gap-2">
                              {permissions.can_message_users && (
                                <Link
                                  to="/messages"
                                  search={{ peer: p.id }}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-700 hover:bg-muted"
                                >
                                  <MessageSquare className="h-3 w-3" /> Message
                                </Link>
                              )}

                              {(isAdmin ||
                                permissions.can_ban_users ||
                                permissions.can_approve_background_badges ||
                                permissions.can_unlist_sitters) && (
                                <>
                                  {(isAdmin || permissions.can_ban_users) && (
                                    <SmallButton
                                      onClick={() => banUser(p.id, isBanned)}
                                      disabled={busy === `ban-${p.id}`}
                                      tone={isBanned ? "neutral" : "danger"}
                                    >
                                      {isBanned ? (
                                        <RotateCcw className="h-3 w-3" />
                                      ) : (
                                        <Ban className="h-3 w-3" />
                                      )}
                                      {isBanned ? "Unban" : "Ban"}
                                    </SmallButton>
                                  )}

                                  {p.is_sitter &&
                                    (isAdmin ||
                                      permissions.can_approve_background_badges) && (
                                      <SmallButton
                                        onClick={() =>
                                          approveBadge(
                                            p.id,
                                            p.verification_status !==
                                              "approved",
                                          )
                                        }
                                        disabled={busy === `badge-${p.id}`}
                                      >
                                        <BadgeCheck className="h-3 w-3" />{" "}
                                        {p.verification_status === "approved"
                                          ? "Remove badge"
                                          : "Approve badge"}
                                      </SmallButton>
                                    )}

                                  {!isUserAdmin &&
                                    (isMod ? (
                                      <SmallButton
                                        onClick={() => removeModerator(p.id)}
                                        disabled={busy === `remove-mod-${p.id}`}
                                      >
                                        <XCircle className="h-3 w-3" /> Remove
                                        mod
                                      </SmallButton>
                                    ) : (
                                      <SmallButton
                                        onClick={() => makeModerator(p.id)}
                                        disabled={busy === `mod-${p.id}`}
                                      >
                                        <UserCog className="h-3 w-3" /> Make mod
                                      </SmallButton>
                                    ))}

                                  {p.sitter_test_passed_at &&
                                    (isAdmin ||
                                      permissions.can_unlist_sitters) && (
                                      <SmallButton
                                        onClick={() =>
                                          unlistSitter(p.id, !!p.is_sitter)
                                        }
                                        disabled={busy === `sitter-${p.id}`}
                                      >
                                        {p.is_sitter ? "Unlist" : "Relist"}
                                      </SmallButton>
                                    )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {tab === "bookings" && permissions.can_view_bookings && (
          <Panel title={`Bookings (${bookings.length})`} className="mt-6">
            <div className="space-y-3">
              {bookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  names={names}
                  isAdmin={isAdmin}
                  permissions={permissions}
                  busy={busy}
                  onMessage={(userId) => userId}
                  onNote={() => addBookingNote(b)}
                  onReschedule={() => rescheduleBooking(b)}
                  onStatus={() => changeBookingStatus(b)}
                  onCancel={() => cancelBookingAsAdmin(b)}
                  onDelete={() => deleteBookingAsAdmin(b)}
                />
              ))}
            </div>
          </Panel>
        )}

        {tab === "reviews" && permissions.can_manage_reviews && (
          <Panel title={`Reviews (${reviews.length})`} className="mt-6">
            <ul className="space-y-2">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className={`rounded-2xl border border-border p-4 ${r.hidden ? "opacity-60" : ""} bg-background`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <span className="font-600">
                          {names[r.author_id] ?? r.author_id}
                        </span>
                        <span className="text-muted-foreground">
                          → {names[r.sitter_id] ?? r.sitter_id}
                        </span>
                      </div>
                      {r.body && <p className="mt-1 text-sm">{r.body}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {niceDateTime(r.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <SmallButton
                        onClick={() => toggleHidden(r)}
                        disabled={busy === `review-${r.id}`}
                      >
                        {r.hidden ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}{" "}
                        {r.hidden ? "Unhide" : "Hide"}
                      </SmallButton>
                      {isAdmin && (
                        <SmallButton
                          onClick={() => deleteReview(r.id)}
                          disabled={busy === `delete-review-${r.id}`}
                          tone="danger"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </SmallButton>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {tab === "support" && permissions.can_view_support_cases && (
          <Panel title={`Support cases (${cases.length})`} className="mt-6">
            {cases.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No support cases yet.
              </p>
            ) : (
              <div className="space-y-4">
                {cases.map((c) => {
                  const createdBy = c.created_by
                    ? (names[c.created_by] ?? c.created_by)
                    : "Guest/unknown";
                  const assignedTo = c.assigned_to
                    ? (names[c.assigned_to] ?? c.assigned_to)
                    : "Unassigned";
                  const isClosed = c.status === "closed";
                  const docPath = extractBackgroundDocPath(c.body);
                  const events = caseEventsByCase[c.id] ?? [];

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill className={statusClass(c.status)}>
                              {c.status ?? "open"}
                            </Pill>
                            <Pill className={statusClass(c.priority)}>
                              {c.priority ?? "normal"}
                            </Pill>
                            <span className="text-xs text-muted-foreground">
                              Created {niceDateTime(c.created_at)}
                            </span>
                          </div>

                          <h3 className="mt-3 font-display text-lg font-700">
                            {c.subject ?? c.type ?? "Support case"}
                          </h3>

                          <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <p>
                              From:{" "}
                              <span className="font-700 text-foreground">
                                {createdBy}
                              </span>
                            </p>
                            <p>
                              Assigned:{" "}
                              <span className="font-700 text-foreground">
                                {assignedTo}
                              </span>
                            </p>
                            <p>Assigned at: {niceDateTime(c.assigned_at)}</p>
                            <p>Closed at: {niceDateTime(c.closed_at)}</p>
                            <p>
                              Time to assign:{" "}
                              {elapsed(c.created_at, c.assigned_at)}
                            </p>
                            <p>
                              Time open: {elapsed(c.created_at, c.closed_at)}
                            </p>
                          </div>

                          {c.body && (
                            <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
                              {c.body}
                            </div>
                          )}

                          {c.resolution_notes && (
                            <div className="mt-3 rounded-2xl bg-muted p-3 text-sm">
                              <span className="font-700">
                                Resolution notes:
                              </span>{" "}
                              {c.resolution_notes}
                            </div>
                          )}

                          {events.length > 0 && (
                            <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                              <div className="flex items-center gap-2 text-sm font-700">
                                <History className="h-4 w-4 text-primary" />{" "}
                                Case history
                              </div>
                              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                                {events.map((event) => (
                                  <li
                                    key={event.id}
                                    className="border-l-2 border-border pl-3"
                                  >
                                    <p>
                                      <span className="font-700 text-foreground">
                                        {event.action.replaceAll("_", " ")}
                                      </span>
                                      {event.actor_id
                                        ? ` by ${names[event.actor_id] ?? event.actor_id}`
                                        : ""}
                                    </p>
                                    <p>{niceDateTime(event.created_at)}</p>
                                    {event.note && (
                                      <p className="mt-1 text-foreground/80">
                                        {event.note}
                                      </p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-3">
                          <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
                            Case actions
                          </p>
                          <div className="mt-3 flex flex-col gap-2">
                            {docPath &&
                              permissions.can_review_background_checks && (
                                <SmallButton
                                  onClick={() => openBackgroundDocument(c.body)}
                                  tone="primary"
                                >
                                  <FileText className="h-3 w-3" /> Open document{" "}
                                  <ExternalLink className="h-3 w-3" />
                                </SmallButton>
                              )}

                            {c.created_by && permissions.can_message_users && (
                              <Link
                                to="/messages"
                                search={{ peer: c.created_by }}
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-700 hover:bg-muted"
                              >
                                <MessageSquare className="h-3 w-3" /> Message
                                user
                              </Link>
                            )}

                            {!c.assigned_to &&
                              !isClosed &&
                              permissions.can_take_support_cases && (
                                <SmallButton
                                  onClick={() => assignCaseToMe(c.id)}
                                  disabled={busy === `case-${c.id}`}
                                  tone="primary"
                                >
                                  Take case
                                </SmallButton>
                              )}

                            {c.assigned_to &&
                              !isClosed &&
                              permissions.can_take_support_cases && (
                                <SmallButton
                                  onClick={() => assignCaseToMe(c.id)}
                                  disabled={busy === `case-${c.id}`}
                                >
                                  Reassign to me
                                </SmallButton>
                              )}

                            {!isClosed &&
                              role === "moderator" &&
                              permissions.can_escalate_support_cases && (
                                <SmallButton
                                  onClick={() => escalateCase(c.id)}
                                  disabled={busy === `case-escalate-${c.id}`}
                                  tone="danger"
                                >
                                  Escalate to admin
                                </SmallButton>
                              )}

                            {!isClosed &&
                              permissions.can_close_support_cases && (
                                <SmallButton
                                  onClick={() => closeCase(c.id)}
                                  disabled={busy === `case-close-${c.id}`}
                                >
                                  Close case
                                </SmallButton>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {tab === "moderators" && isAdmin && (
          <Panel title="Moderator settings" className="mt-6">
            <p className="text-sm text-muted-foreground">
              Turn moderator powers on or off. Admin accounts always keep full
              access.
            </p>
            <div className="mt-4 space-y-4">
              {profiles
                .filter((p) => (roleMap[p.id] ?? []).includes("moderator"))
                .map((p) => {
                  const row = permissionMap[p.id];
                  const effective = getEffectivePermissions("moderator", row);

                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-700">
                            {p.full_name || p.email || "Moderator"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.email}
                          </p>
                        </div>
                        <Pill className="bg-primary/15 text-primary">
                          moderator
                        </Pill>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {PERMISSION_LABELS.map(({ key, label }) => {
                          const enabled = Boolean(effective[key]);

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                toggleModeratorPermission(p.id, key, enabled)
                              }
                              disabled={busy === `perm-${p.id}-${key}`}
                              className={`rounded-2xl border px-3 py-2 text-left text-xs font-700 transition ${
                                enabled
                                  ? "border-green-500/30 bg-green-500/10 text-green-700"
                                  : "border-border bg-card text-muted-foreground"
                              }`}
                            >
                              {enabled ? "ON" : "OFF"} · {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {profiles.filter((p) =>
                (roleMap[p.id] ?? []).includes("moderator"),
              ).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No moderators yet. Go to Users and click Make mod.
                </p>
              )}
            </div>
          </Panel>
        )}
      </section>
    </SiteLayout>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-700 ${active ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-3xl font-700">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function BookingCard({
  booking,
  names,
  isAdmin,
  permissions,
  busy,
  onNote,
  onReschedule,
  onStatus,
  onCancel,
  onDelete,
}: {
  booking: Booking;
  names: Record<string, string>;
  isAdmin: boolean;
  permissions: EffectivePermissions;
  busy: string | null;
  onMessage: (userId: string) => string;
  onNote: () => void;
  onReschedule: () => void;
  onStatus: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const isCanceled = !!booking.canceled_at || booking.status === "canceled";
  const isPaid = booking.payment_status === "paid";
  const sitterPayoutCents =
    booking.amount_cents == null
      ? null
      : booking.amount_cents - (booking.platform_fee_cents ?? 0);

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Pill className={statusClass(booking.status)}>
              {booking.status ?? "unknown"}
            </Pill>
            <Pill className={statusClass(booking.payment_status)}>
              {booking.payment_status ?? "unpaid"}
            </Pill>
            {booking.payout_released ? (
              <Pill className="bg-green-500/15 text-green-700">
                payout released
              </Pill>
            ) : null}
            {isCanceled ? (
              <Pill className="bg-red-500/15 text-red-700">canceled</Pill>
            ) : null}
          </div>

          <p className="mt-2 font-700">{booking.service ?? "Booking"}</p>

          <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              Owner:{" "}
              <span className="font-700 text-foreground">
                {names[booking.owner_id] ?? booking.owner_id}
              </span>
            </p>
            <p>
              Sitter:{" "}
              <span className="font-700 text-foreground">
                {names[booking.sitter_id] ?? booking.sitter_id}
              </span>
            </p>
            <p>
              Dates: {booking.start_date ?? "—"} → {booking.end_date ?? "—"}
            </p>
            <p>Created: {niceDateTime(booking.created_at)}</p>
            <p>Client completed: {niceDateTime(booking.client_completed_at)}</p>
            <p>Sitter completed: {niceDateTime(booking.sitter_completed_at)}</p>
            <p>Payout released: {niceDateTime(booking.payout_released_at)}</p>
            <p>Last updated: {niceDateTime(booking.updated_at)}</p>
          </div>

          {booking.cancellation_reason && (
            <div className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span className="font-700">Cancel reason:</span>{" "}
              {booking.cancellation_reason}
            </div>
          )}

          {booking.admin_notes && (
            <div className="mt-3 whitespace-pre-wrap rounded-2xl border border-border bg-card p-3 text-sm">
              <span className="font-700">Admin notes:</span>{" "}
              {booking.admin_notes}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
            Booking controls
          </p>

          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
                Payment breakdown
              </p>

              <div className="mt-3 space-y-2">
                <p className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Booking total</span>
                  <span className="font-700">{money(booking.amount_cents)}</span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-muted-foreground">JaxStay fee</span>
                  <span className="font-700">{money(booking.platform_fee_cents)}</span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Sitter payout</span>
                  <span className="font-700">{money(sitterPayoutCents)}</span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
                Stripe records
              </p>

              <div className="mt-3 space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => copyText(booking.stripe_checkout_session_id)}
                  className="block w-full rounded-xl border border-border px-2 py-2 text-left hover:bg-muted"
                >
                  <span className="block font-700 text-foreground">Checkout</span>
                  <span className="font-mono text-muted-foreground">
                    {shortStripeId(booking.stripe_checkout_session_id)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => copyText(booking.stripe_payment_intent_id)}
                  className="block w-full rounded-xl border border-border px-2 py-2 text-left hover:bg-muted"
                >
                  <span className="block font-700 text-foreground">Payment intent</span>
                  <span className="font-mono text-muted-foreground">
                    {shortStripeId(booking.stripe_payment_intent_id)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => copyText(booking.stripe_transfer_id)}
                  className="block w-full rounded-xl border border-border px-2 py-2 text-left hover:bg-muted"
                >
                  <span className="block font-700 text-foreground">Transfer</span>
                  <span className="font-mono text-muted-foreground">
                    {shortStripeId(booking.stripe_transfer_id)}
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3">
              <p className="text-xs font-700 uppercase tracking-wider text-muted-foreground">
                Refund / cancellation
              </p>

              <div className="mt-3 space-y-2">
                <p className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Refund amount</span>
                  <span className="font-700">
                    {money(booking.refund_amount_cents)}
                  </span>
                </p>
                <p className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Refund status</span>
                  <span className="font-700">
                    {booking.refund_status ?? "none"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {permissions.can_message_users && (
              <Link
                to="/messages"
                search={{ peer: booking.owner_id }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-700 hover:bg-muted"
              >
                <MessageSquare className="h-3 w-3" /> Message owner
              </Link>
            )}

            {permissions.can_message_users && (
              <Link
                to="/messages"
                search={{ peer: booking.sitter_id }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-700 hover:bg-muted"
              >
                <MessageSquare className="h-3 w-3" /> Message sitter
              </Link>
            )}

            {(isAdmin || permissions.can_edit_bookings) && (
              <>
                <SmallButton
                  onClick={onNote}
                  disabled={busy === `booking-note-${booking.id}`}
                >
                  Add note
                </SmallButton>

                <SmallButton
                  onClick={onReschedule}
                  disabled={
                    busy === `booking-reschedule-${booking.id}` || isPaid
                  }
                >
                  Reschedule
                </SmallButton>

                <SmallButton
                  onClick={onStatus}
                  disabled={busy === `booking-status-${booking.id}`}
                >
                  Change status
                </SmallButton>

                <SmallButton
                  onClick={onCancel}
                  disabled={
                    busy === `booking-cancel-${booking.id}` || isCanceled
                  }
                  tone="danger"
                >
                  Cancel booking
                </SmallButton>

                {isAdmin && (
                  <SmallButton
                    onClick={onDelete}
                    disabled={busy === `booking-delete-${booking.id}` || isPaid}
                    tone="danger"
                  >
                    <Trash2 className="h-3 w-3" /> Delete unpaid booking
                  </SmallButton>
                )}
              </>
            )}
          </div>

          {isPaid && (
            <p className="mt-3 text-xs text-muted-foreground">
              Paid bookings should usually be refunded or canceled through the
              refund workflow, not deleted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
