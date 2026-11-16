"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function JoinViaLinkPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast, success } = useToast();

  const inviteCode = (params.inviteCode as string)?.toUpperCase();
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/join/${inviteCode}`);
    } else if (status === "authenticated" && inviteCode) {
      joinGroup();
    }
  }, [status, inviteCode]);

  const joinGroup = async () => {
    setIsJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      success(data.message || `Joined ${data.group.name}!`);
      router.push(`/groups/${data.group.id}`);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to join group" });
      router.push("/dashboard");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center animate-bounce">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Joining Group...
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Connecting you to the shared expense group with code{" "}
          <strong className="font-mono text-emerald-600 dark:text-emerald-400">
            {inviteCode}
          </strong>
        </p>
      </div>
    </div>
  );
}
