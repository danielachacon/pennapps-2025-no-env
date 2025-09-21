"use client";

import AuthForm from "@/components/AuthForm";
import { login } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin({ email, password }: { email: string; password: string }) {
    try {
      const response = await login(email, password);
      console.log('Login response:', response);
      
      if (response.success && response.access_token) {
        // Store the real auth token
        localStorage.setItem('authToken', response.access_token);
        router.push("/dashboard");
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Don't auto-login on error
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <AuthForm mode="login" onSubmit={handleLogin} />
    </main>
  );
}
