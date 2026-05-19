"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { LeadSuccessResponse } from "@/types";

export default function LeadIntakePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LeadSuccessResponse["data"] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/request-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          serviceId: Number(serviceId),
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.message || resData.code || "Failed to submit request.");
      }

      setResult(resData.data);
      toast.success("Request allocated successfully!");
      // Reset form on success
      setName("");
      setPhone("");
    } catch (err: any) {
      toast.error(err.message || "Failed to process request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full my-auto flex flex-col justify-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-indigo-300 via-slate-200 to-emerald-300 bg-clip-text text-transparent">
          Request Service Allocation
        </h1>
        <p className="mt-3 text-base text-slate-400 max-w-md mx-auto">
          Submit your request below. The engine will instantly assign it to 3 unique providers based on fairness rules.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selector */}
          <div>
            <label htmlFor="service" className="block text-sm font-semibold text-slate-300 mb-2">
              Select Service Category
            </label>
            <select
              id="service"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="1">Service 1 (Mandatory: Provider 1)</option>
              <option value="2">Service 2 (Mandatory: Provider 5)</option>
              <option value="3">Service 3 (Mandatory: Provider 1 & 4)</option>
            </select>
            <p className="mt-2 text-xs text-indigo-400/80">
              * Note: Mandatory VIP providers will be prioritised if they have remaining quota.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-300 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. +1 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#080a10] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing Allocation...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </form>

        {/* Allocation Result Output */}
        {result && (
          <div className="mt-8 border-t border-white/5 pt-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              Allocation Complete
            </h3>
            
            <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 space-y-3">
              <div className="grid grid-cols-2 text-xs gap-y-1 text-slate-400">
                <span>Request ID:</span>
                <span className="font-semibold text-slate-200"># {result.leadId}</span>
                <span>Customer:</span>
                <span className="font-semibold text-slate-200">{result.name}</span>
                <span>Phone:</span>
                <span className="font-semibold text-slate-200">{result.phone}</span>
                <span>Service Category:</span>
                <span className="font-semibold text-slate-200">Service {result.serviceId}</span>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold text-indigo-400 mb-2">Assigned Providers (Exactly 3):</p>
                <div className="grid grid-cols-1 gap-2">
                  {result.assignments.map((assignment, index) => (
                    <div
                      key={assignment.providerId}
                      className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border border-white/5 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-xs">Slot {index + 1}:</span>
                        <span className="font-semibold text-slate-200">{assignment.providerName}</span>
                      </div>
                      <div>
                        {assignment.isMandatory ? (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                            Mandatory VIP
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                            Pool Rotation
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
