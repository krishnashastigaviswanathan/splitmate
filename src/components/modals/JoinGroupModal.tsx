"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, KeyRound, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinedGroup?: (group: any) => void;
}

export function JoinGroupModal({
  isOpen,
  onClose,
  onJoinedGroup,
}: JoinGroupModalProps) {
  const router = useRouter();
  const { toast, success } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast({ type: "error", message: "Please enter an invite code" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join group");
      }

      success(data.message || `Joined group successfully!`);
      if (onJoinedGroup) {
        onJoinedGroup(data.group);
      }
      onClose();
      router.push(`/groups/${data.group.id}`);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to join group" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Join Existing Group</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enter the 6-character invite code provided by your roommate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              6-Character Invite Code
            </label>
            <input
              type="text"
              maxLength={8}
              autoFocus
              placeholder="e.g. APT4B9"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full mt-1 px-4 py-3 text-center text-xl font-mono font-bold tracking-widest rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || inviteCode.trim().length < 4}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <span>{isSubmitting ? "Joining..." : "Join Group"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
