'use client';

import { useSupabaseUser } from '@/hooks/useSupabase';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { CTASection } from '@/components/landing/CTASection';
import { FooterSection } from '@/components/landing/FooterSection';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const user = useSupabaseUser();

  useEffect(() => {
    if (user) {
      redirect('/dashboard');
    }
  }, [user]);

  if (user) {
    return null; // Return nothing while redirecting
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <LandingHeader />
      <div className="pt-20"> {/* Add padding to account for fixed header */}
        <HeroSection />
        <FeaturesSection />
        <CTASection />
        <FooterSection />
      </div>
    </main>
  );
}
