"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoggedIn(false);
          setLoading(false);
          return;
        }
        const response = await fetch('http://localhost:8000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser({
            email: userData.email,
            emergencyContacts: userData.emergency_contacts.map((phone: string, index: number) => ({ id: index.toString(), phone })) || []
          });
          setIsLoggedIn(true);
        } else {
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
    localStorage.removeItem('authToken');
    window.location.href = '/';
  }

  async function handleAddContact() {
    if (!newContact.trim()) return;
    setAddingContact(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/api/auth/add-contact', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newContact.trim() })
      });
      if (response.ok) {
        const userData = await fetch('http://localhost:8000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (userData.ok) {
          const data = await userData.json();
          setUser({
            email: data.email,
            emergencyContacts: data.emergency_contacts.map((phone: string, index: number) => ({ id: index.toString(), phone }))
          });
        }
        setNewContact("");
        setShowAddForm(false);
      } else {
        alert('Failed to add contact');
      }
    } catch (error) {
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
          <Link href="/login" className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 transition-colors">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">Crashly AI Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground">Manage your emergency contacts and account.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted-foreground">{user.email}</span>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      {/* Live Stream */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Live Stream</CardTitle>
          <p className="text-sm text-muted-foreground">Real-time feed integrated from YouTube.</p>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-hidden rounded-md border pt-[56.25%]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/F_JwmmbBA6I?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1"
              title="Crashly AI Live Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Emergency Contacts</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Contacts notified automatically in case of a crash.</p>
          </div>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button>Add Contact</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Emergency Contact</DialogTitle>
                <DialogDescription>Enter a phone number in international format.</DialogDescription>
              </DialogHeader>
              <div className="flex gap-3">
                <Input type="tel" value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="e.g., +1 555 123 4567" />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button onClick={handleAddContact} disabled={addingContact || !newContact.trim()}>{addingContact ? "Adding..." : "Add"}</Button>
                <Button variant="ghost" onClick={() => { setShowAddForm(false); setNewContact(""); }}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {user.emergencyContacts.length > 0 ? (
            <div className="divide-y rounded-md border">
              {user.emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4">
                  <p className="font-mono font-semibold">{contact.phone}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Call</Button>
                    <Button variant="outline" size="sm">Text</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium mb-2">No Emergency Contacts</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Add emergency contacts to be notified automatically when a crash is detected.</p>
              <Button onClick={() => setShowAddForm(true)}>Add Your First Contact</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
