"use client";

import Link from "next/link";
import Image from "next/image";
import hero from "@/ChatGPT Image Sep 20, 2025, 11_55_10 PM.png";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by checking for auth token
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Verify token is valid by calling /me endpoint
      fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          // Valid token, redirect to dashboard
          setIsLoggedIn(true);
        } else {
          // Invalid token, remove it
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Token validation error:', error);
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        setLoading(false);
      });
    } else {
      // No token, user not logged in
      setIsLoggedIn(false);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to dashboard if logged in
  if (isLoggedIn) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-3.5rem)] flex items-center">
      <div className="mb-12 grid md:grid-cols-2 items-center gap-8">
        <div>
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                Crashly AI
              </span>
            </h1>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl">
              Real-time crash detection and emergency response powered by modern AI.
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
        <div className="hidden md:block md:relative md:w-[50vw] md:h-[420px] md:mr-0 overflow-hidden">
          <Image
            src={hero}
            alt="Crashly AI preview"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </div>

      
    </main>
  )
}
