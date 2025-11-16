import { useCallback, useEffect, useRef } from "react";
import { atom, useAtom } from "jotai";

// User activity state atoms
export const lastActivityTimeAtom = atom(Date.now());
export const isUserActiveAtom = atom(true);
export const showStaleDataPopupAtom = atom(false);

// Configuration constants
const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes of inactivity
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

/**
 * Hook to track user activity and manage data staleness
 * Returns functions to check activity status and refresh data
 */
export const useUserActivity = () => {
  const [lastActivityTime, setLastActivityTime] = useAtom(lastActivityTimeAtom);
  const [isUserActive, setIsUserActive] = useAtom(isUserActiveAtom);
  const [showStaleDataPopup, setShowStaleDataPopup] = useAtom(showStaleDataPopupAtom);
  
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  // Update last activity time and reset inactive state
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);
    setIsUserActive(true);
    setShowStaleDataPopup(false);
  }, [setLastActivityTime, setIsUserActive, setShowStaleDataPopup]);

  // Check if user is inactive and show popup if needed
  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;
    
    if (timeSinceLastActivity >= INACTIVE_THRESHOLD) {
      setIsUserActive(false);
      setShowStaleDataPopup(true);
    }
  }, [lastActivityTime, setIsUserActive, setShowStaleDataPopup]);

  // Activity event handlers
  const handleActivity = useCallback((event: Event) => {
    // Ignore certain events that shouldn't count as activity
    if (event.type === 'scroll' && event.target === document) {
      return; // Ignore document scroll
    }
    updateActivity();
  }, [updateActivity]);

  useEffect(() => {
    // Events that count as user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start checking for inactivity
    checkIntervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL);

    // Initial activity update
    updateActivity();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [handleActivity, checkInactivity, updateActivity]);

  // Function to manually refresh data (called when user clicks refresh on popup)
  const refreshData = useCallback(() => {
    updateActivity();
    // This will trigger refetch in query atoms that use shouldRefetch
    setLastActivityTime(Date.now());
  }, [updateActivity, setLastActivityTime]);

  // Function to check if data should be refetched based on activity
  const shouldRefetch = useCallback(() => {
    return isUserActive;
  }, [isUserActive]);

  return {
    isUserActive,
    showStaleDataPopup,
    lastActivityTime,
    refreshData,
    shouldRefetch,
    timeSinceLastActivity: Date.now() - lastActivityTime,
  };
};