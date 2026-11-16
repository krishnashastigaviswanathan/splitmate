"use client";

import React, { useState, useEffect } from "react";
import { Send, MessageSquare, Coffee, Pizza, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/components/ui/Toast";

interface RoommateMessage {
  id: string;
  content: string;
  emoji: string;
  tag: string;
  createdAt: string | Date;
  user: { id: string; name: string };
  group: { id: string; name: string; emoji: string };
}

interface RoommateChatShoutboxProps {
  groups: Array<{ id: string; name: string; emoji: string }>;
  currentUserId?: string;
}

const TAG_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  CHAT: { label: "General", emoji: "💬", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  FOOD: { label: "Food Call", emoji: "🍕", color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  CHAI: { label: "Chai Alert", emoji: "☕", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  NUDGE: { label: "Bill Nudge", emoji: "💸", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  CHORE: { label: "Chore Patrol", emoji: "🧹", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  SHOUTOUT: { label: "Shoutout", emoji: "🎉", color: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300" },
};

export function RoommateChatShoutbox({ groups, currentUserId }: RoommateChatShoutboxProps) {
  const { toast, success } = useToast();
  const [messages, setMessages] = useState<RoommateMessage[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "");
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("CHAT");
  const [selectedEmoji, setSelectedEmoji] = useState("💬");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const fetchMessages = async () => {
    if (!selectedGroupId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages?groupId=${selectedGroupId}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedGroupId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedGroupId) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          content: content.trim(),
          emoji: selectedEmoji,
          tag: selectedTag,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post message");
      }

      setMessages((prev) => [data.message, ...prev]);
      setContent("");
      success("Message sent to roommates! 🚀");
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Failed to send message" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectQuickTag = (tag: string, emoji: string) => {
    setSelectedTag(tag);
    setSelectedEmoji(emoji);
  };

  const currentGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];

  return (
    <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 text-xl">
            💬
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <span>Roommate Message Board</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Live Shoutbox
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send messages, food orders, chore reminders, or chai invites to all flatmates.
            </p>
          </div>
        </div>

        {/* Group Selector if multiple */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {groups.length > 1 && (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchMessages}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        {/* Quick Vibe Tag Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Vibe:
          </span>
          {Object.entries(TAG_CONFIG).map(([tagKey, conf]) => (
            <button
              type="button"
              key={tagKey}
              onClick={() => handleSelectQuickTag(tagKey, conf.emoji)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedTag === tagKey
                  ? "bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>{conf.emoji}</span>
              <span>{conf.label}</span>
            </button>
          ))}
        </div>

        {/* Text Input + Send */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            placeholder={`Say something to ${currentGroup?.name || "roommates"}... (e.g. Swiggy order arriving, or who's making chai?)`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={isSending || !content.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>{isSending ? "Sending..." : "Send"}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Messages Feed */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <p className="text-xs font-medium">No messages in this group yet.</p>
            <p className="text-[11px] text-slate-500">
              Be the first to say hi or drop a food invitation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUserId;
            const tagInfo = TAG_CONFIG[msg.tag] || TAG_CONFIG.CHAT;

            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  isMe
                    ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50"
                    : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800"
                }`}
              >
                <UserAvatar name={msg.user.name} size="xs" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {msg.user.name}
                        {isMe && (
                          <span className="ml-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                            (You)
                          </span>
                        )}
                      </span>

                      {/* Tag pill */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tagInfo.color}`}>
                        <span>{msg.emoji || tagInfo.emoji}</span>
                        <span>{tagInfo.label}</span>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
