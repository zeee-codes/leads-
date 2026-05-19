"use client";

import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

interface ProviderStats {
  id: number;
  name: string;
  leadsCount: number;
  maxQuota: number;
  lastAssignedAt: string;
  isFrozen: boolean;
  services: string[];
}

interface Assignment {
  id: number;
  leadId: number;
  leadName: string;
  leadPhone: string;
  serviceName: string;
  providerId: number;
  providerName: string;
  isMandatory: boolean;
  createdAt: string;
}

export default function ProviderDashboardPage() {
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flashingProviders, setFlashingProviders] = useState<Record<number, boolean>>({});
  
  // Keep refs to compare poll data
  const prevAssignmentsRef = useRef<Assignment[]>([]);
  const isInitialFetch = useRef(true);

  useEffect(() => {
    const fetchData = async (silent = false) => {
      try {
        const response = await fetch("/api/leads");
        const resJson = await response.json();

        if (!response.ok || !resJson.success) {
          throw new Error(resJson.message || "Failed to fetch dashboard data.");
        }

        const newProviders: ProviderStats[] = resJson.data.providers;
        const newAssignments: Assignment[] = resJson.data.assignments;

        setProviders(newProviders);
        setAssignments(newAssignments);

        // Compare assignments to trigger flashes and toasts (skip on initial load)
        if (!isInitialFetch.current) {
          const prevIds = new Set(prevAssignmentsRef.current.map((a) => a.id));
          const newlyAdded = newAssignments.filter((a) => !prevIds.has(a.id));

          if (newlyAdded.length > 0) {
            // Process newly added assignments (from oldest to newest)
            const sortedNew = [...newlyAdded].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            const newFlashes: Record<number, boolean> = {};

            sortedNew.forEach((asg) => {
              // Trigger toast
              toast.success(`🎉 New Lead Assigned to ${asg.providerName}!`, {
                icon: "🔔",
                id: `asg-${asg.id}`, // prevent duplicate toasts for same assignment
              });

              // Mark provider for green flash animation
              newFlashes[asg.providerId] = true;
            });

            // Trigger green flash class
            setFlashingProviders((prev) => ({ ...prev, ...newFlashes }));

            // Remove flash animation class after animation completes (1.8s)
            setTimeout(() => {
              setFlashingProviders((prev) => {
                const updated = { ...prev };
                Object.keys(newFlashes).forEach((id) => {
                  delete updated[Number(id)];
                });
                return updated;
              });
            }, 1800);
          }
        } else {
          isInitialFetch.current = false;
        }

        prevAssignmentsRef.current = newAssignments;
      } catch (err: any) {
        console.error("Polling error:", err);
        if (!silent) {
          toast.error(err.message || "Could not retrieve live metrics.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // First fetch
    fetchData();

    // 2-second short polling interval
    const interval = setInterval(() => {
      fetchData(true);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-slate-400 text-sm font-semibold">Loading Live Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Title & Meta Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-indigo-300 via-slate-200 to-emerald-300 bg-clip-text text-transparent">
            Service Provider Dashboard
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Live monitoring of lead quotas and round-robin allocations. Polling active.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 uppercase tracking-wider">Short Polling (2s)</span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Providers Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span>Registered Providers</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
              {providers.length} Total
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => {
              const isFlashing = flashingProviders[provider.id];
              const isFull = provider.isFrozen;
              const percent = Math.min((provider.leadsCount / provider.maxQuota) * 100, 100);
              
              return (
                <div
                  key={provider.id}
                  className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all flex flex-col justify-between h-48 border border-white/5 ${
                    isFlashing ? "animate-flash-green" : ""
                  }`}
                >
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">{provider.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {provider.services.map((svc) => (
                          <span
                            key={svc}
                            className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isFull ? (
                        <span className="text-[10px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Frozen (Cap)
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="my-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Quota Usage:</span>
                      <span className={`font-semibold ${isFull ? "text-red-400" : "text-slate-200"}`}>
                        {provider.leadsCount} / {provider.maxQuota} Leads
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? "bg-red-500"
                            : percent >= 80
                            ? "bg-amber-500"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Bottom Stats inside Card */}
                  <div className="border-t border-white/5 pt-3 mt-auto flex items-center justify-between text-[11px] text-slate-500">
                    <span>ID: #{provider.id}</span>
                    <span>
                      Last Assigned:{" "}
                      {provider.leadsCount > 0
                        ? new Date(provider.lastAssignedAt).toLocaleTimeString()
                        : "Never"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Recent Assignments Feed */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span>Allocation Feed</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
              Live
            </span>
          </h2>

          <div className="glass-panel p-5 rounded-2xl h-[530px] flex flex-col">
            <div className="overflow-y-auto pr-1 flex-1 space-y-4">
              {assignments.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center py-20 text-slate-500">
                  <svg className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-semibold">No allocations yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Submit a request to see the live feed populate.</p>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-3 bg-slate-950/40 border border-white/5 rounded-xl space-y-2 hover:border-white/10 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {new Date(assignment.createdAt).toLocaleTimeString()}
                      </span>
                      {assignment.isMandatory ? (
                        <span className="text-[9px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                          Mandatory VIP
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-md">
                          Pool Rotation
                        </span>
                      )}
                    </div>

                    {/* Assignment Body */}
                    <div className="text-xs">
                      <p className="text-slate-300">
                        Lead <span className="font-semibold text-slate-200">#{assignment.leadId}</span> (
                        {assignment.leadName}) for <span className="text-slate-200 font-semibold">{assignment.serviceName}</span>
                      </p>
                      <p className="text-slate-400 mt-1 flex items-center gap-1">
                        Assigned to:
                        <span className="font-bold text-emerald-400">{assignment.providerName}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
