"use client";

import { useState } from "react";
import AuthForm from "@/components/AuthForm";
import InsuranceForm from "@/components/InsuranceForm";
import { register, InsuranceInfo } from "@/lib/api";
import { useRouter } from "next/navigation";
import { getCurrentLocation } from "@/lib/geolocation";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"auth" | "insurance">("auth");
  const [userCredentials, setUserCredentials] = useState<{
    email: string;
    password: string;
    emergencyContacts?: string[];
  } | null>(null);

  async function handleAuthSubmit({
    email,
    password,
    emergencyContacts,
  }: {
    email: string;
    password: string;
    emergencyContacts?: string[];
  }) {
    // Store credentials and move to insurance step
    setUserCredentials({ email, password, emergencyContacts });
    setStep("insurance");
  }

  async function handleInsuranceSubmit(insuranceInfo: InsuranceInfo) {
    if (!userCredentials) {
      throw new Error("Missing user credentials");
    }

    // Get user's current location (will prompt for permission)
    const location = await getCurrentLocation().catch((err) => {
      // Surface the error to InsuranceForm to display it
      throw err;
    });

    const response = await register(
      userCredentials.email,
      userCredentials.password,
      location,
      userCredentials.emergencyContacts,
      insuranceInfo
    );
    
    if (response.success) {
      // Auto-login after successful registration
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userCredentials.email, 
          password: userCredentials.password 
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.access_token) {
          localStorage.setItem('authToken', loginData.access_token);
          router.push("/dashboard");  // Go directly to dashboard
          return;
        }
      }
    }
    
    // Fallback to login page if auto-login fails
    router.push("/login");
  }

  return (
    <main className="min-h-screen px-4 py-10">
      {step === "auth" ? (
        <AuthForm mode="register" onSubmit={handleAuthSubmit} />
      ) : (
        <InsuranceForm onSubmit={handleInsuranceSubmit} />
      )}
    </main>
  );
}
