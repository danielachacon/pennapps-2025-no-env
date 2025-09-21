"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EmergencyContact {
  id: string;
  phone: string;
  name?: string;
  relationship?: string;
}

interface User {
  email: string;
  emergencyContacts: EmergencyContact[];
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Check if user is logged in by checking for auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }

        // Fetch user data from API
        const response = await fetch('http://localhost:8000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            email: userData.email,
            emergencyContacts: userData.emergency_contacts.map((phone: string, index: number) => ({
              id: index.toString(),
              phone: phone
            })) || []
          });
          setIsLoggedIn(true);
        } else {
          // Token invalid or expired, but for testing, show mock data
          console.log('API not available, using mock data for testing');
          setUser({
            email: "test@example.com",
            emergencyContacts: [
              { id: "1", phone: "+1 555 123 4567" },
              { id: "2", phone: "+1 555 987 6543" },
              { id: "3", phone: "+1 555 456 7890" }
            ]
          });
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Backend not available, show mock data for testing
        console.log('Backend not available, using mock data');
        setUser({
          email: "test@example.com", 
          emergencyContacts: [
            { id: "1", phone: "+1 555 123 4567" },
            { id: "2", phone: "+1 555 987 6543" },
            { id: "3", phone: "+1 555 456 7890" }
          ]
        });
        setIsLoggedIn(true);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  function handleLogout() {
    // Clear auth token from localStorage
    localStorage.removeItem('authToken');
    
    // Redirect to home page
    window.location.href = '/';
  }

  async function handleAddContact() {
    if (!newContact.trim()) return;
    
    setAddingContact(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/auth/add-contact', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: newContact.trim() })
      });

      if (response.ok) {
        // Refresh user data to show new contact
        const userData = await fetch('http://localhost:8000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userData.ok) {
          const data = await userData.json();
          setUser({
            email: data.email,
            emergencyContacts: data.emergency_contacts.map((phone: string, index: number) => ({
              id: index.toString(),
              phone: phone
            }))
          });
        }
        
        setNewContact("");
        setShowAddForm(false);
      } else {
        alert('Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Error adding contact');
    } finally {
      setAddingContact(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-gray-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                🚗 Crash Detection Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {user.email}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Emergency Contacts Section - Main Focus */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="px-6 py-6 border-b border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🚨 Emergency Contacts
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  These contacts will be automatically notified in case of a crash detection
                </p>
              </div>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
              >
                + Add Contact
              </button>
            </div>
          </div>
          <div className="px-6 py-6">
            {user.emergencyContacts.length > 0 ? (
              <div className="space-y-6">
                {user.emergencyContacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex items-center justify-between p-6 bg-gray-50 dark:bg-neutral-700 rounded-xl border border-gray-100 dark:border-neutral-600"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          📱
                        </span>
                      </div>
                      <div>
                        <p className="text-xl font-mono font-semibold text-gray-900 dark:text-white">
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 font-medium px-4 py-2 rounded-lg transition-colors">
                        <span>📞</span>
                        <span>Call</span>
                      </button>
                      <button className="flex items-center space-x-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 font-medium px-4 py-2 rounded-lg transition-colors">
                        <span>💬</span>
                        <span>Text</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-gray-400 text-3xl">📱</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Emergency Contacts
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Add emergency contacts to be notified automatically when a crash is detected by our AI system.
                </p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Add Your First Contact
                </button>
              </div>
            )}

            {/* Add Contact Form */}
            {showAddForm && (
              <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Add Emergency Contact
                </h3>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="Enter phone number (e.g., +1 555 123 4567)"
                    className="flex-1 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddContact}
                    disabled={addingContact || !newContact.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    {addingContact ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewContact("");
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
