"use client";

import React from "react";

import { useUserActivity } from "@/hooks/useUserActivity";
import StaleDataPopup from "./StaleDataPopup";

interface UserActivityProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that sets up user activity tracking and shows stale data popup
 * Should be placed high in the component tree to track all user interactions
 */
const UserActivityProvider: React.FC<UserActivityProviderProps> = ({
  children,
}) => {
  // Initialize user activity tracking
  useUserActivity();

  return (
    <>
      {children}
      <StaleDataPopup />
    </>
  );
};

export default UserActivityProvider;