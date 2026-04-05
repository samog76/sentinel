'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/splash');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold">Profile Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Name</label>
              <input
                type="text"
                defaultValue={user.name}
                className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
                readOnly
              />
            </div>

            {/* Staff ID */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Staff ID</label>
              <input
                type="text"
                defaultValue={user.staffId}
                className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
                readOnly
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Department</label>
              <input
                type="text"
                defaultValue={user.department}
                className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
                readOnly
              />
            </div>

            {/* Hospital */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Hospital</label>
              <input
                type="text"
                defaultValue={user.hospital}
                className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
                readOnly
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Role</label>
              <input
                type="text"
                defaultValue={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                className="w-full px-4 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Baseline Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold">Baseline Assessment</h2>
          <p className="text-muted-foreground">
            Your cognitive baseline was established during onboarding. You can reset it at any time to recalibrate.
          </p>
          <button className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-popover transition-smooth font-medium">
            Reset Baseline
          </button>
        </div>

        {/* Notifications Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold">Alerts & Notifications</h2>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-5 h-5 bg-input border border-border rounded cursor-pointer"
              />
              <span className="text-foreground font-medium">Critical fatigue alerts</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-5 h-5 bg-input border border-border rounded cursor-pointer"
              />
              <span className="text-foreground font-medium">Daily performance summary</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={false}
                className="w-5 h-5 bg-input border border-border rounded cursor-pointer"
              />
              <span className="text-foreground font-medium">Weekly trend report</span>
            </label>
          </div>
        </div>

        {/* Privacy & Data Section */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold">Privacy & Data</h2>
          <p className="text-sm text-muted-foreground">
            All your cognitive performance data is encrypted and stored securely. Only you and authorized supervisors can access your data.
          </p>
          <button className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-popover transition-smooth font-medium">
            View Privacy Policy
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
