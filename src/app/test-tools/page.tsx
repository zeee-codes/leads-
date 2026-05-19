"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface ProviderSnapshot {
  id: number;
  name: string;
  leadsCount: number;
  maxQuota: number;
  isFrozen: boolean;
}

export default function TestToolsPage() {
  const [generateCount, setGenerateCount] = useState(10);
  const [serviceId, setServiceId] = useState("1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[System] Admin Terminal Ready.",
    "[System] Awaiting stress testing logs...",
  ]);

  // Webhook form states
  const [webhookProviderId, setWebhookProviderId] = useState("1");
  const [webhookEventId, setWebhookEventId] = useState("");
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // Snapshot states
  const [providerSnapshots, setProviderSnapshots] = useState<ProviderSnapshot[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Fetch provider snapshot to display current quotas
  const fetchSnapshot = async () => {
    try {
      const response = await fetch("/api/leads");
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setProviderSnapshots(resJson.data.providers);
      }
    } catch (err) {
      console.error("Error fetching snapshot:", err);
    } finally {
      setSnapshotLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
    // Auto-refresh snapshot every 5 seconds on this tab
    const interval = setInterval(fetchSnapshot, 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate unique eventId for Webhook testing
  const generateRandomEventId = () => {
    const randomHex = Math.random().toString(16).substring(2, 10);
    setWebhookEventId(`evt_pay_${randomHex}`);
  };

  useEffect(() => {
    generateRandomEventId();
  }, []);

  const handleGenerateLeads = async () => {
    setIsGenerating(true);
    setTerminalLogs((prev) => [
      ...prev,
      `[System] Starting generation of ${generateCount} leads for Service ${serviceId} sequentially...`,
    ]);

    try {
      const response = await fetch("/api/test/generate-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: generateCount,
          serviceId: Number(serviceId),
        }),
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to generate leads.");
      }

      const logs: string[] = resJson.data.logs;
      setTerminalLogs((prev) => [...prev, ...logs, `[System] Generation completed successfully.`]);
      toast.success("Lead generation completed!");
      fetchSnapshot();
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[Error] Lead generation failed: ${err.message || "Unknown error"}`,
      ]);
      toast.error(err.message || "Failed to generate leads.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetSystem = async () => {
    if (!confirm("Are you sure you want to delete all leads, assignments, logs, and reset all quotas?")) {
      return;
    }

    setIsResetting(true);
    setTerminalLogs((prev) => [...prev, "[System] Initiating system database wipe..."]);

    try {
      const response = await fetch("/api/test/reset-system", {
        method: "POST",
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to reset system.");
      }

      setTerminalLogs((prev) => [
        ...prev,
        `[System] Success: ${resJson.message}`,
        `[System] Ready for fresh testing operations.`,
      ]);
      toast.success("System wiped and reset successfully!");
      fetchSnapshot();
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[Error] Reset failed: ${err.message || "Unknown error"}`,
      ]);
      toast.error(err.message || "Failed to reset system.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSendWebhook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!webhookEventId.trim()) {
      toast.error("Please provide or generate a webhook eventId.");
      return;
    }

    setIsSendingWebhook(true);
    const eventIdToSend = webhookEventId.trim();
    const providerIdToSend = Number(webhookProviderId);

    setTerminalLogs((prev) => [
      ...prev,
      `[Webhook Out] Sending POST /api/webhook/payment...`,
      `  EventID: ${eventIdToSend}`,
      `  ProviderID: ${providerIdToSend}`,
      `  Action: RESET_QUOTA`,
    ]);

    try {
      const response = await fetch("/api/webhook/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventIdToSend,
          providerId: providerIdToSend,
          action: "RESET_QUOTA",
        }),
      });

      const resJson = await response.json();

      if (response.ok && resJson.success) {
        if (resJson.code === "ALREADY_PROCESSED") {
          setTerminalLogs((prev) => [
            ...prev,
            `[Webhook In] Responded with 200 OK (Idempotent Reject)`,
            `  Code: ${resJson.code}`,
            `  Message: ${resJson.message}`,
          ]);
          toast.success("Webhook skipped (already processed)!");
        } else {
          setTerminalLogs((prev) => [
            ...prev,
            `[Webhook In] Responded with 200 OK (Processed)`,
            `  Message: ${resJson.message}`,
          ]);
          toast.success("Quota reset via webhook!");
          fetchSnapshot();
        }
      } else {
        setTerminalLogs((prev) => [
          ...prev,
          `[Webhook In] Responded with ${response.status} Error`,
          `  Code: ${resJson.code || "UNKNOWN"}`,
          `  Message: ${resJson.message || "Request failed"}`,
        ]);
        toast.error(resJson.message || "Webhook processing failed.");
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[Error] Webhook delivery exception: ${err.message || "Network error"}`,
      ]);
      toast.error("Webhook network delivery failed.");
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const clearTerminal = () => {
    setTerminalLogs(["[System] Terminal Logs Cleared."]);
  };

  const handleQuickGenerate10 = async () => {
    setIsGenerating(true);
    setTerminalLogs((prev) => [
      ...prev,
      `[System] Starting concurrency stress test: generating 10 leads for Service 1...`,
    ]);
    try {
      const response = await fetch("/api/test/generate-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: 10,
          serviceId: 1,
        }),
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to generate leads.");
      }
      setTerminalLogs((prev) => [...prev, ...resJson.data.logs, `[System] Quick concurrency generation completed.`]);
      toast.success("Generated 10 leads successfully!");
      fetchSnapshot();
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[Error] Quick generation failed: ${err.message}`,
      ]);
      toast.error(err.message || "Failed to generate leads.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickResetQuota = async () => {
    const eventId = `evt_pay_quick_${Math.random().toString(16).substring(2, 10)}`;
    setTerminalLogs((prev) => [
      ...prev,
      `[Webhook Out] Quick Reset Quota request for Provider 1:`,
      `  EventID: ${eventId}`,
      `  ProviderID: 1`,
    ]);
    try {
      const response = await fetch("/api/webhook/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          providerId: 1,
          action: "RESET_QUOTA",
        }),
      });
      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setTerminalLogs((prev) => [
          ...prev,
          `[Webhook In] Quota reset processed successfully for Provider 1.`,
        ]);
        toast.success("Provider 1 quota reset successfully!");
        fetchSnapshot();
      } else {
        throw new Error(resJson.message || "Failed to deliver webhook.");
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[Error] Quick Reset Quota webhook failed: ${err.message}`,
      ]);
      toast.error(err.message || "Webhook delivery failed.");
    }
  };

  const handleQuickTestIdempotency = async () => {
    const eventId = `evt_pay_idem_${Math.random().toString(16).substring(2, 10)}`;
    setTerminalLogs((prev) => [
      ...prev,
      `[Webhook Out] Triggering 3 simultaneous webhooks with duplicate EventID:`,
      `  EventID: ${eventId}`,
      `  ProviderID: 2`,
      `[System] Dispatching concurrent requests...`,
    ]);

    try {
      const requests = Array.from({ length: 3 }).map(async (_, idx) => {
        try {
          const res = await fetch("/api/webhook/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId,
              providerId: 2,
              action: "RESET_QUOTA",
            }),
          });
          const data = await res.json();
          return { index: idx + 1, status: res.status, data };
        } catch (e: any) {
          return { index: idx + 1, status: 500, error: e.message };
        }
      });

      const results = await Promise.all(requests);

      const logsToAdd: string[] = [];
      results.forEach((res) => {
        if (res.error) {
          logsToAdd.push(`  [Request ${res.index}] Exception: ${res.error}`);
        } else if (res.data.success) {
          logsToAdd.push(
            `  [Request ${res.index}] Response ${res.status}: success=${res.data.success}, code=${res.data.code || "SUCCESS"}, msg="${res.data.message}"`
          );
        } else {
          logsToAdd.push(
            `  [Request ${res.index}] Response ${res.status}: success=${res.data.success}, code=${res.data.code}, msg="${res.data.message}"`
          );
        }
      });

      setTerminalLogs((prev) => [...prev, ...logsToAdd, `[System] Idempotency test complete.`]);
      toast.success("Idempotency test delivered!");
      fetchSnapshot();
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[Error] Idempotency test runner failed: ${err.message}`,
      ]);
      toast.error("Runner failed.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-indigo-300 via-slate-200 to-emerald-300 bg-clip-text text-transparent">
          Developer Testing Panel
        </h1>
        <p className="mt-1 text-slate-400 text-sm">
          Simulate concurrency, trigger payment webhooks, check idempotency, and review live allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Tools */}
        <div className="lg:col-span-1 space-y-6">

          {/* Quick Verification Scenarios */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Quick Test Actions
            </h2>
            <div className="space-y-2.5">
              <button
                onClick={handleQuickGenerate10}
                disabled={isGenerating || isResetting}
                className="w-full text-left bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/20 text-indigo-200 font-semibold py-2.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>⚡ Generate 10 Leads Instantly</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono">Concurrency</span>
              </button>

              <button
                onClick={handleQuickResetQuota}
                disabled={isGenerating || isResetting}
                className="w-full text-left bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-200 font-semibold py-2.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>💳 Reset Quota to 10 (Webhook)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">Reset</span>
              </button>

              <button
                onClick={handleQuickTestIdempotency}
                disabled={isGenerating || isResetting}
                className="w-full text-left bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/20 text-amber-200 font-semibold py-2.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>🔄 Call Webhook 3x Simultaneously</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">Idempotency</span>
              </button>
            </div>
          </div>
          
          {/* Section 1: Lead Generator */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              Lead Stress Generator
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Target Service Category
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="1">Service 1 (Mandatory: Prov 1)</option>
                  <option value="2">Service 2 (Mandatory: Prov 5)</option>
                  <option value="3">Service 3 (Mandatory: Prov 1 & 4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Number of Leads to Generate ({generateCount})
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>1 lead</span>
                  <span>15 leads</span>
                  <span>30 leads</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleGenerateLeads}
                  disabled={isGenerating || isResetting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isGenerating ? "Generating..." : "Generate Leads"}
                </button>
                <button
                  onClick={handleResetSystem}
                  disabled={isGenerating || isResetting}
                  className="bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 font-semibold py-2 px-3 rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isResetting ? "Resetting..." : "Reset System"}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Payment Webhook Simulator */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Webhook Simulator (Idempotent)
            </h2>

            <form onSubmit={handleSendWebhook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Select Provider to Reset
                </label>
                <select
                  value={webhookProviderId}
                  onChange={(e) => setWebhookProviderId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Provider {idx + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Event ID (Unique Transaction Key)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. evt_pay_abc123"
                    value={webhookEventId}
                    onChange={(e) => setWebhookEventId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={generateRandomEventId}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Generate New ID"
                  >
                    🎲
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500 leading-normal">
                  * Note: Submitting the same EventID twice will verify the backend idempotency block logic.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSendingWebhook || isGenerating || isResetting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSendingWebhook ? "Sending Webhook..." : "Deliver Webhook"}
              </button>
            </form>
          </div>

          {/* Section 3: Provider Snapshots (at a glance) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                Quotas Snapshot
              </h2>
              <button
                onClick={fetchSnapshot}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {snapshotLoading ? (
              <p className="text-xs text-slate-500">Loading snapshot...</p>
            ) : (
              <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
                <div className="grid grid-cols-3 bg-slate-900 px-3 py-2 text-slate-400 font-semibold border-b border-white/5">
                  <span>Provider</span>
                  <span className="text-center">Quota</span>
                  <span className="text-right">Status</span>
                </div>
                <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                  {providerSnapshots.map((p) => (
                    <div key={p.id} className="grid grid-cols-3 px-3 py-2 items-center">
                      <span className="font-medium text-slate-300">{p.name}</span>
                      <span className="text-center text-slate-400 font-mono">
                        {p.leadsCount} / {p.maxQuota}
                      </span>
                      <span className="text-right">
                        {p.isFrozen ? (
                          <span className="text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Frozen
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: Terminal Output (X-Factor 1) */}
        <div className="lg:col-span-2 flex flex-col h-[650px] glass-panel rounded-2xl overflow-hidden border border-white/5">
          {/* Terminal Header */}
          <div className="bg-slate-900/80 px-4 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              {/* Window controls styling */}
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/70"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/70"></div>
              </div>
              <span className="text-xs font-mono text-slate-400 ml-2">allocation-engine.sh</span>
            </div>
            
            <button
              onClick={clearTerminal}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Terminal Box Body */}
          <div className="flex-1 bg-black/90 p-5 font-mono text-xs text-indigo-300 overflow-y-auto space-y-1.5 select-text">
            {terminalLogs.map((log, idx) => {
              let colorClass = "text-indigo-300";
              if (log.startsWith("[Error]")) {
                colorClass = "text-red-400 font-semibold";
              } else if (log.startsWith("[System]")) {
                colorClass = "text-slate-400 font-semibold";
              } else if (log.startsWith("[Webhook Out]")) {
                colorClass = "text-amber-400 font-semibold";
              } else if (log.startsWith("[Webhook In]")) {
                colorClass = "text-emerald-400 font-semibold";
              } else if (log.includes("Mandatory")) {
                colorClass = "text-slate-200";
              }
              
              return (
                <div key={idx} className={`terminal-line ${colorClass}`}>
                  {log}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
