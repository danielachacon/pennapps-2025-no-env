"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-6">
          🚗 <span className="text-blue-600">CrashGuard AI</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl">
          Advanced AI-powered crash detection system with real-time emergency response
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-900 dark:text-white font-medium px-6 py-3 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
        <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 dark:text-blue-400 text-xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Real-time Detection</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Instant crash detection using advanced computer vision and AI models
          </p>
        </div>

        <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 dark:text-green-400 text-xl">🚨</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Emergency Response</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatic 911 assessment and emergency contact notification
          </p>
        </div>

        <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-purple-600 dark:text-purple-400 text-xl">🧠</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Multi-model AI analysis with YOLO, Cerebras, and Gemini
          </p>
        </div>
      </div>

      <div className="mt-16 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Powered by YOLO, OpenCV, Cerebras, and Gemini AI
        </p>
      </div>
    </main>
  )
}
