"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitPolicyholderDetails, type PolicyholderDriver, type Automobile } from "@/lib/api";

export default function RegistrationDetailsPage() {
  const search = useSearchParams();
  const router = useRouter();
  const userId = useMemo(() => search.get("user_id") ?? "", [search]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pd, setPd] = useState<PolicyholderDriver>({});
  const [auto, setAuto] = useState<Automobile>({});

  function handleChange<K extends keyof PolicyholderDriver>(key: K, value: PolicyholderDriver[K]) {
    setPd((prev) => ({ ...prev, [key]: value }));
  }

  function handleAutoChange<K extends keyof Automobile>(key: K, value: Automobile[K]) {
    setAuto((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!userId) {
      setError("Missing user ID. Please start from the registration page.");
      return;
    }
    setLoading(true);
    try {
      await submitPolicyholderDetails(userId, pd, auto);
      setSuccess("Details saved.");
      router.push("/login");
    } catch (err: any) {
      setError(err?.message ?? "Failed to save details");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-1">Registration - Policyholder Details</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Provide the policyholder, driver, and automobile information.</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">{error}</div>
        )}
        {success && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <h2 className="text-lg font-medium mb-4">1. Policyholder and Driver</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Policy Number</label>
                <input className="input" value={pd.policy_number ?? ""} onChange={(e) => handleChange("policy_number", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Occupation</label>
                <input className="input" value={pd.occupation ?? ""} onChange={(e) => handleChange("occupation", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Policyholder SSN</label>
                <input className="input" value={pd.policyholder_ssn ?? ""} onChange={(e) => handleChange("policyholder_ssn", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium">Policyholder First Name</label>
                <input className="input" value={pd.name_of_policyholder_full_first ?? ""} onChange={(e) => handleChange("name_of_policyholder_full_first", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Policyholder Middle Name</label>
                <input className="input" value={pd.name_of_policyholder_full_middle ?? ""} onChange={(e) => handleChange("name_of_policyholder_full_middle", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Policyholder Last Name</label>
                <input className="input" value={pd.name_of_policyholder_last ?? ""} onChange={(e) => handleChange("name_of_policyholder_last", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium">Complete Home Address</label>
                <input className="input" value={pd.home_address ?? ""} onChange={(e) => handleChange("home_address", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Home Email</label>
                <input type="email" className="input" value={pd.home_email ?? ""} onChange={(e) => handleChange("home_email", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Home Phone</label>
                <input type="tel" className="input" value={pd.home_phone ?? ""} onChange={(e) => handleChange("home_phone", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Business Address</label>
                <input className="input" value={pd.business_address ?? ""} onChange={(e) => handleChange("business_address", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Business Phone</label>
                <input type="tel" className="input" value={pd.business_phone ?? ""} onChange={(e) => handleChange("business_phone", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium">Driver First Name</label>
                <input className="input" value={pd.driver_full_first ?? ""} onChange={(e) => handleChange("driver_full_first", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Driver Middle Name</label>
                <input className="input" value={pd.driver_full_middle ?? ""} onChange={(e) => handleChange("driver_full_middle", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Driver Last Name</label>
                <input className="input" value={pd.driver_last ?? ""} onChange={(e) => handleChange("driver_last", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Driver Address</label>
                <input className="input" value={pd.driver_address ?? ""} onChange={(e) => handleChange("driver_address", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Driver License No.</label>
                <input className="input" value={pd.driver_license_no ?? ""} onChange={(e) => handleChange("driver_license_no", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">State License Issued</label>
                <input className="input" value={pd.driver_state_license_issued ?? ""} onChange={(e) => handleChange("driver_state_license_issued", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Driver SSN</label>
                <input className="input" value={pd.driver_ssn ?? ""} onChange={(e) => handleChange("driver_ssn", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Driver Age</label>
                <input type="number" className="input" value={pd.driver_age ?? ""} onChange={(e) => handleChange("driver_age", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium">Date of Birth</label>
                <input type="date" className="input" value={pd.driver_dob ?? ""} onChange={(e) => handleChange("driver_dob", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Years of Driving Experience</label>
                <input type="number" className="input" value={pd.driver_years_experience ?? ""} onChange={(e) => handleChange("driver_years_experience", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium">Relation to Policyholder</label>
                <input className="input" value={pd.driver_relation_to_policyholder ?? ""} onChange={(e) => handleChange("driver_relation_to_policyholder", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Who authorized him to drive?</label>
                <input className="input" value={pd.driver_authorized_by ?? ""} onChange={(e) => handleChange("driver_authorized_by", e.target.value)} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium">Name Occupants of Policyholder's Car</label>
                <input className="input" value={pd.policyholder_car_occupants ?? ""} onChange={(e) => handleChange("policyholder_car_occupants", e.target.value)} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 dark:border-neutral-800 p-4">
            <h2 className="text-lg font-medium mb-4">2. Policyholder's Automobile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Make</label>
                <input className="input" value={auto.make ?? ""} onChange={(e) => handleAutoChange("make", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Year</label>
                <input type="number" className="input" value={auto.year ?? ""} onChange={(e) => handleAutoChange("year", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium">Body Type</label>
                <input className="input" value={auto.body_type ?? ""} onChange={(e) => handleAutoChange("body_type", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Model</label>
                <input className="input" value={auto.model ?? ""} onChange={(e) => handleAutoChange("model", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">License Plate No. and State</label>
                <input className="input" value={auto.license_plate_and_state ?? ""} onChange={(e) => handleAutoChange("license_plate_and_state", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Identification #</label>
                <input className="input" value={auto.identification_number ?? ""} onChange={(e) => handleAutoChange("identification_number", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Name of Holder of Title, if not Policyholder</label>
                <input className="input" value={auto.holder_of_title_if_not_policyholder ?? ""} onChange={(e) => handleAutoChange("holder_of_title_if_not_policyholder", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Name of Owner if other than Policyholder</label>
                <input className="input" value={auto.owner_if_other_than_policyholder ?? ""} onChange={(e) => handleAutoChange("owner_if_other_than_policyholder", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Owner Address</label>
                <input className="input" value={auto.owner_address ?? ""} onChange={(e) => handleAutoChange("owner_address", e.target.value)} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium">Car Permanently Garaged at</label>
                <input className="input" value={auto.car_permanently_garaged_at ?? ""} onChange={(e) => handleAutoChange("car_permanently_garaged_at", e.target.value)} />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-4 py-2"
            >
              {loading ? "Saving…" : "Save and Continue"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 dark:border-neutral-700 px-4 py-2"
            >
              Back
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input { @apply w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500; }
      `}</style>
    </main>
  );
}
