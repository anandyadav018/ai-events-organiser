"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import OnboardingModal from "./onboarding-modal";
import React, { useState } from "react";
import SearchLocationBar from "./search-location-bar";
import { useAuth } from "../hooks/use-auth";
import UpgradeModal from "./upgrade-modal";
import { useOnboarding } from "../hooks/use-onboarding";
import { BarLoader } from "react-spinners";
import { Building, Crown, Plus, Ticket, LogOut } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

const Header = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { showOnboarding, handleOnboardingComplete, handleOnboardingSkip } =
    useOnboarding();
    
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  // Custom auth won't have hasPro natively in the same way, using a mock for now
  // or you could add a 'plan' field to the user model
  const hasPro = false; // Replace with user?.plan === "pro" if implemented

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl z-20 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href={"/"} className="flex items-center">
            <Image
              src="/spott.png"
              alt="Spott logo"
              width={500}
              height={500}
              className="w-full h-11"
              priority
            />

            {hasPro && (
              <Badge className="bg-linear-to-r from-pink-500 to-orange-500 gap-1 text-white ml-3">
                <Crown className="w-3 h-3" />
                Pro
              </Badge>
            )}
          </Link>

          {/* Search & Location - Desktop Only */}
          <div className="hidden md:flex flex-1 justify-center">
            <SearchLocationBar />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center">
            {/* Show Pro badge or Upgrade button */}
            {!hasPro && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
              >
                Pricing
              </Button>
            )}

            <Button variant={"ghost"} size="sm" asChild className={"mr-2"}>
              <Link href="/explore">Explore</Link>
            </Button>
            
            {isAuthenticated ? (
              <>
                <Button size="sm" asChild className="flex gap-2 mr-2">
                  <Link href="/create-event">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Event</span>
                  </Link>
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full w-8 h-8 p-0">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48 p-2 flex flex-col gap-1">
                      <Link href="/my-tickets" className="flex items-center hover:bg-muted p-2 rounded-md cursor-pointer text-sm">
                        <Ticket className="mr-2 h-4 w-4" />
                        <span>My Tickets</span>
                      </Link>
                      <Link href="/my-events" className="flex items-center hover:bg-muted p-2 rounded-md cursor-pointer text-sm">
                        <Building className="mr-2 h-4 w-4" />
                        <span>My Events</span>
                      </Link>
                    <button onClick={logout} className="flex items-center text-red-500 hover:bg-red-500/10 p-2 rounded-md cursor-pointer text-sm w-full text-left">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search & Location - Below Header */}
        <div className="md:hidden border-t px-3 py-3">
          <SearchLocationBar />
        </div>

        {/* Loader */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 w-full">
            <BarLoader width={"100%"} color="#a855f7" />
          </div>
        )}
      </nav>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingSkip}
        onComplete={handleOnboardingComplete}
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="header"
      />
    </>
  );
};
export default Header;
