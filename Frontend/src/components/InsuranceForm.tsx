"use client";

import { useState } from "react";
import { InsuranceInfo } from "@/lib/api";

type Props = {
  onSubmit: (insuranceInfo: InsuranceInfo) => void;
  loading?: boolean;
  error?: string | null;
};

export default function InsuranceForm({ onSubmit, loading, error }: Props) {
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo>(() => ({
    policyholder: {
      name: "",
      policy_number: "",
      occupation: "",
      social_security_no: "",
      home_address: "",
      email: "",
      phone: "",
      business_address: "",
      business_phone: "",
      name_occupants_car: "",
    },
    driver: {
      name: "",
      address: "",
      phone: "",
      license_no: "",
      state_license_issued: "",
      social_security_no: "",
      driver_age: 0,
      date_of_birth: "",
      years_driving_experience: 0,
      relation_to_policyholder: "",
      who_authorized_to_drive: "",
    },
    automobile: {
      make: "",
      year: 0,
      body_type: "",
      model: "",
      license_plate_state: "",
      identification_number: "",
      name_holder_title: "",
      name_owner_if_other: "",
      address: "",
      car_permanently_garaged_at: "",
    },
  }));

  const updatePolicyholder = (field: keyof InsuranceInfo['policyholder'], value: string) => {
    setInsuranceInfo(prev => ({
      ...prev,
      policyholder: {
        ...prev.policyholder,
        [field]: value
      }
    }));
  };

  const updateDriver = (field: keyof InsuranceInfo['driver'], value: string | number) => {
    setInsuranceInfo(prev => ({
      ...prev,
      driver: {
        ...prev.driver,
        [field]: value
      }
    }));
  };

  const updateAutomobile = (field: keyof InsuranceInfo['automobile'], value: string | number) => {
    setInsuranceInfo(prev => ({
      ...prev,
      automobile: {
        ...prev.automobile,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(insuranceInfo);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Insurance Information</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Please provide your policyholder, driver, and automobile information.
      </p>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Policyholder Information */}
        <section className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-6">
          <h2 className="text-lg font-medium mb-4">1. Policyholder Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={insuranceInfo.policyholder.name}
                onChange={(e) => updatePolicyholder("name", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="First Middle Last"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Policy Number</label>
              <input
                type="text"
                required
                value={insuranceInfo.policyholder.policy_number}
                onChange={(e) => updatePolicyholder("policy_number", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Occupation</label>
              <input
                type="text"
                required
                value={insuranceInfo.policyholder.occupation}
                onChange={(e) => updatePolicyholder("occupation", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Social Security No.</label>
              <input
                type="text"
                required
                value={insuranceInfo.policyholder.social_security_no}
                onChange={(e) => updatePolicyholder("social_security_no", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XXX-XX-XXXX"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Complete Home Address</label>
              <input
                type="text"
                required
                value={insuranceInfo.policyholder.home_address}
                onChange={(e) => updatePolicyholder("home_address", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={insuranceInfo.policyholder.email}
                onChange={(e) => updatePolicyholder("email", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                required
                value={insuranceInfo.policyholder.phone}
                onChange={(e) => updatePolicyholder("phone", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Business Address</label>
              <input
                type="text"
                value={insuranceInfo.policyholder.business_address}
                onChange={(e) => updatePolicyholder("business_address", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Business Phone</label>
              <input
                type="tel"
                value={insuranceInfo.policyholder.business_phone}
                onChange={(e) => updatePolicyholder("business_phone", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Name Occupants of Policyholder&apos;s Car</label>
              <input
                type="text"
                value={insuranceInfo.policyholder.name_occupants_car}
                onChange={(e) => updatePolicyholder("name_occupants_car", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Driver Information */}
        <section className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-6">
          <h2 className="text-lg font-medium mb-4">2. Driver Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Driver&apos;s Name</label>
              <input
                type="text"
                required
                value={insuranceInfo.driver.name}
                onChange={(e) => updateDriver("name", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="First Middle Last"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                required
                value={insuranceInfo.driver.address}
                onChange={(e) => updateDriver("address", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                required
                value={insuranceInfo.driver.phone}
                onChange={(e) => updateDriver("phone", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver&apos;s License No.</label>
              <input
                type="text"
                required
                value={insuranceInfo.driver.license_no}
                onChange={(e) => updateDriver("license_no", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State License Issued</label>
              <input
                type="text"
                required
                value={insuranceInfo.driver.state_license_issued}
                onChange={(e) => updateDriver("state_license_issued", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Social Security No.</label>
              <input
                type="text"
                required
                value={insuranceInfo.driver.social_security_no}
                onChange={(e) => updateDriver("social_security_no", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="XXX-XX-XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Driver&apos;s Age</label>
              <input
                type="number"
                required
                min="16"
                max="100"
                value={insuranceInfo.driver.driver_age || ""}
                onChange={(e) => updateDriver("driver_age", parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={insuranceInfo.driver.date_of_birth}
                onChange={(e) => updateDriver("date_of_birth", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Years of Driving Experience</label>
              <input
                type="number"
                required
                min="0"
                max="80"
                value={insuranceInfo.driver.years_driving_experience || ""}
                onChange={(e) => updateDriver("years_driving_experience", parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Relation to Policyholder</label>
              <input
                type="text"
                required
                value={insuranceInfo.driver.relation_to_policyholder}
                onChange={(e) => updateDriver("relation_to_policyholder", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Self, Spouse, Child"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Who authorized him to drive?</label>
              <input
                type="text"
                required
                value={insuranceInfo.driver.who_authorized_to_drive}
                onChange={(e) => updateDriver("who_authorized_to_drive", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Automobile Information */}
        <section className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-6">
          <h2 className="text-lg font-medium mb-4">3. Policyholder&apos;s Automobile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <input
                type="text"
                required
                value={insuranceInfo.automobile.make}
                onChange={(e) => updateAutomobile("make", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Toyota, Honda, Ford"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="number"
                required
                min="1900"
                max="2030"
                value={insuranceInfo.automobile.year || ""}
                onChange={(e) => updateAutomobile("year", parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body Type</label>
              <input
                type="text"
                required
                value={insuranceInfo.automobile.body_type}
                onChange={(e) => updateAutomobile("body_type", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Sedan, SUV, Coupe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input
                type="text"
                required
                value={insuranceInfo.automobile.model}
                onChange={(e) => updateAutomobile("model", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Camry, Civic, F-150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">License Plate No. and State</label>
              <input
                type="text"
                required
                value={insuranceInfo.automobile.license_plate_state}
                onChange={(e) => updateAutomobile("license_plate_state", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ABC123 CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Identification #</label>
              <input
                type="text"
                required
                value={insuranceInfo.automobile.identification_number}
                onChange={(e) => updateAutomobile("identification_number", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="VIN Number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Name of Holder of Title, if not Policyholder</label>
              <input
                type="text"
                value={insuranceInfo.automobile.name_holder_title}
                onChange={(e) => updateAutomobile("name_holder_title", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Name of Owner if other than Policyholder</label>
              <input
                type="text"
                value={insuranceInfo.automobile.name_owner_if_other}
                onChange={(e) => updateAutomobile("name_owner_if_other", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Owner Address</label>
              <input
                type="text"
                value={insuranceInfo.automobile.address}
                onChange={(e) => updateAutomobile("address", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">Car Permanently Garaged at</label>
              <input
                type="text"
                required
                value={insuranceInfo.automobile.car_permanently_garaged_at}
                onChange={(e) => updateAutomobile("car_permanently_garaged_at", e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-6 py-3 transition-colors"
          >
            {loading ? "Saving..." : "Complete Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}
