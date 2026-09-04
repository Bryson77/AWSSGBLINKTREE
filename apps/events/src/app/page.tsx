"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { supabase, EventItem, Organization } from "@awssbg/shared";
import { StaffScannerView } from "../components/StaffScannerView";
import { SponsorScannerView } from "../components/SponsorScannerView";
import { AdminEventOpsDesk } from "../components/AdminEventOpsDesk";

export default function EventsHomePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "event_staff" | "sponsor" | "unauthorized">("unauthorized");
  const [sponsorCompanyName, setSponsorCompanyName] = useState<string>("");

  // Event Context
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin View Preview Override
  const [overrideView, setOverrideView] = useState<"admin" | "staff" | "sponsor">("admin");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");

  const loadSessionAndRole = useCallback(async (session: any) => {
    const user = session.user;
    setCurrentUserEmail(user.email || "");
    setCurrentUserId(user.id);
    setSessionToken(session.access_token);

    // 1. Check if user is Superadmin or Admin
    const { data: adminProfile } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", user.id)
      .single();

    const isSuper =
      adminProfile?.is_super_admin === true ||
      adminProfile?.role === "superadmin" ||
      user.email === "lethabomabilo33@gmail.com";

    setIsSuperAdmin(isSuper);

    // 2. Fetch available events
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .order("start_time", { ascending: false });

    const loadedEvents = (eventsData as EventItem[]) || [];
    setEvents(loadedEvents);
    const activeEv = loadedEvents[0] || null;
    setCurrentEvent(activeEv);

    if (isSuper || adminProfile?.role === "leader") {
      setUserRole("admin");
      setCurrentUserName(adminProfile?.name || user.email?.split("@")[0] || "Admin");
      setAuthed(true);
      setLoading(false);
      return;
    }

    // 3. Check if user is assigned Event Staff or Sponsor
    const { data: eventUserProfile } = await supabase
      .from("event_users")
      .select("id, event_id, role, name, sponsor_company_id, sponsor_companies(name)")
      .eq("id", user.id)
      .single();

    if (eventUserProfile) {
      setCurrentUserName(eventUserProfile.name || user.email?.split("@")[0] || "User");
      if (eventUserProfile.role === "event_staff") {
        setUserRole("event_staff");
      } else if (eventUserProfile.role === "sponsor") {
        setUserRole("sponsor");
        const company = (eventUserProfile as any).sponsor_companies?.name || "Official Sponsor";
        setSponsorCompanyName(company);
      }
      setAuthed(true);
      setLoading(false);
      return;
    }

    // Unauthorized
    setUserRole("unauthorized");
    setAuthed(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadSessionAndRole(session);
      } else {
        setAuthed(false);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadSessionAndRole(session);
      } else {
        setAuthed(false);
        setUserRole("unauthorized");
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSessionAndRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Authenticated Successfully");
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Magic Link Sent", { description: "Check your email for passwordless sign-in." });
      }
    } catch (err: any) {
      toast.error("Authentication Failed", { description: err.message || "Invalid credentials." });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
    setUserRole("unauthorized");
  };

  if (loading || authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F5]">
        <div className="h-8 w-8 animate-spin border-3 border-black border-t-[#7C3AED]" />
      </div>
    );
  }

  // ── SCREEN 1: LOGIN SCREEN ──
  if (!authed) {
    return (
      <div className="brutal-grid-bg flex min-h-screen items-center justify-center bg-[#F4F4F5] p-4 sm:p-6">
        <div className="w-full max-w-sm border-[3px] border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border-2 border-black bg-white p-2 shadow-[3px_3px_0px_#000000]">
              <Image src="/logo.png" alt="AWS SBG Logo" width={48} height={48} className="h-full w-full object-contain" priority />
            </div>
            <div className="mb-1 inline-block border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_#7C3AED]">
              // EVENTS_PORTAL
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              Event Operations
            </h1>
            <p className="mt-1 font-mono text-xs font-semibold text-zinc-600">
              Check-In Desk &bull; Sponsor Leads &bull; Operations
            </p>
          </div>

          <div className="mb-5 flex border-2 border-black bg-zinc-100 p-0.5">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 py-1 font-mono text-[10px] font-black uppercase transition-all cursor-pointer ${
                mode === "password" ? "bg-black text-white shadow-[1px_1px_0px_#000000]" : "text-zinc-600 hover:text-black"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("magic")}
              className={`flex-1 py-1 font-mono text-[10px] font-black uppercase transition-all cursor-pointer ${
                mode === "magic" ? "bg-black text-white shadow-[1px_1px_0px_#000000]" : "text-zinc-600 hover:text-black"
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs font-black uppercase text-black">Email</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
              />
            </div>

            {mode === "password" && (
              <div>
                <label className="mb-1 block font-mono text-xs font-black uppercase text-black">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs text-black outline-none focus:shadow-[2px_2px_0px_#7C3AED]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full border-2 border-black bg-black py-2.5 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#7C3AED] hover:bg-accent-purple transition-all cursor-pointer disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              {loginLoading ? "Authenticating..." : mode === "password" ? "Sign In & Enter Console →" : "Send Magic Link →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── SCREEN 2: UNAUTHORIZED ACCOUNT ──
  if (userRole === "unauthorized") {
    return (
      <div className="brutal-grid-bg flex min-h-screen items-center justify-center bg-[#F4F4F5] p-4">
        <div className="w-full max-w-md border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_#000000] text-center">
          <div className="mb-2 inline-block border border-black bg-amber-400 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black">
            // NO_EVENT_ROLE_ASSIGNED
          </div>
          <h2 className="text-xl font-black uppercase text-black">
            Access Pending Assignment
          </h2>
          <p className="mt-2 font-mono text-xs text-zinc-600">
            Account: <strong>{currentUserEmail}</strong>
          </p>
          <p className="mt-2 font-mono text-xs text-zinc-600">
            You do not currently have Staff or Sponsor access assigned for upcoming events. Please ask your AWS SBG event organizer to invite your account.
          </p>
          <button
            onClick={handleSignOut}
            className="mt-6 border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple cursor-pointer"
          >
            Sign Out &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN 3: ROLE-GATED VIEWS ──

  // Staff Volunteer View
  if (userRole === "event_staff" || (userRole === "admin" && overrideView === "staff")) {
    return (
      <div>
        {userRole === "admin" && (
          <div className="bg-amber-400 border-b-2 border-black px-4 py-1 flex items-center justify-between font-mono text-[10px] font-black text-black">
            <span>// PREVIEWING STAFF SCANNER AS ADMIN</span>
            <button onClick={() => setOverrideView("admin")} className="underline cursor-pointer">
              Exit Preview &rarr;
            </button>
          </div>
        )}
        <StaffScannerView
          eventId={currentEvent?.id || ""}
          token={sessionToken}
          scannerName={currentUserName}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  // Sponsor Representative View
  if (userRole === "sponsor" || (userRole === "admin" && overrideView === "sponsor")) {
    return (
      <div>
        {userRole === "admin" && (
          <div className="bg-accent-purple text-white border-b-2 border-black px-4 py-1 flex items-center justify-between font-mono text-[10px] font-black">
            <span>// PREVIEWING SPONSOR DASHBOARD AS ADMIN</span>
            <button onClick={() => setOverrideView("admin")} className="underline cursor-pointer">
              Exit Preview &rarr;
            </button>
          </div>
        )}
        <SponsorScannerView
          eventId={currentEvent?.id || ""}
          token={sessionToken}
          companyName={sponsorCompanyName || "Event Sponsor"}
          repName={currentUserName}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  // Core Team / Superadmin Command Desk
  return (
    <AdminEventOpsDesk
      events={events}
      currentEvent={currentEvent}
      onSelectEvent={(ev) => setCurrentEvent(ev)}
      token={sessionToken}
      isSuperAdmin={isSuperAdmin}
      userEmail={currentUserEmail}
      onSignOut={handleSignOut}
      onSwitchToStaffView={() => setOverrideView("staff")}
      onSwitchToSponsorView={() => setOverrideView("sponsor")}
    />
  );
}
