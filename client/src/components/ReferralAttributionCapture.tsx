import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useRef } from "react";

const TOKEN_STORAGE_KEY = "rafiq_partner_referral_visitor";
const CAPTURE_STORAGE_KEY = "rafiq_partner_referral_captured";

function getOrCreateVisitorToken() {
  const existing = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (existing && /^[A-Za-z0-9-]{32,128}$/.test(existing)) return existing;
  const token = typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

export function ReferralAttributionCapture() {
  const { user, isAuthenticated } = useAuth();
  const capture = trpc.partners.captureReferral.useMutation();
  const claim = trpc.partners.claimCapturedReferral.useMutation();
  const attemptedCapture = useRef(false);
  const attemptedClaim = useRef(false);
  const referralCode = useMemo(() => {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase() ?? "";
    return /^[A-Z0-9-]{3,80}$/.test(code) ? code : null;
  }, []);

  useEffect(() => {
    if (!referralCode || attemptedCapture.current) return;
    attemptedCapture.current = true;
    const visitorToken = getOrCreateVisitorToken();
    capture.mutate({ code: referralCode, visitorToken, landingPage: window.location.pathname }, {
      onSuccess: result => {
        if (result.captured || result.reason === "first_capture_already_exists") {
          window.localStorage.setItem(CAPTURE_STORAGE_KEY, visitorToken);
        }
      },
    });
  }, [capture, referralCode]);

  useEffect(() => {
    if (!isAuthenticated || !user || attemptedClaim.current) return;
    const visitorToken = window.localStorage.getItem(CAPTURE_STORAGE_KEY);
    if (!visitorToken || !/^[A-Za-z0-9-]{32,128}$/.test(visitorToken)) return;
    attemptedClaim.current = true;
    claim.mutate({ visitorToken }, { onSuccess: () => window.localStorage.removeItem(CAPTURE_STORAGE_KEY) });
  }, [capture.data, claim, isAuthenticated, user]);

  return null;
}
