"use client";

import Link from "next/link";
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
    <main className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-4">🚗 CrashGuard AI</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Advanced AI-powered crash detection system with real-time emergency response
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Real-time Detection</CardTitle>
          </CardHeader>
          <CardContent>
            Instant crash detection using advanced computer vision and AI models
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Emergency Response</CardTitle>
          </CardHeader>
          <CardContent>
            Automatic 911 assessment and emergency contact notification
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            Multi-model AI analysis with YOLO, Cerebras, and Gemini
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Powered by YOLO, OpenCV, Cerebras, and Gemini AI
      </p>
    </main>
  )
}
