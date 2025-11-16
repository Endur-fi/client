"use client";

import React from "react";
import { useAtom } from "jotai";
import { AlertCircle, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showStaleDataPopupAtom } from "@/hooks/useUserActivity";
import { useUserActivity } from "@/hooks/useUserActivity";

/**
 * Popup component that shows when user has been inactive and data is stale
 * Provides option to refresh data or dismiss the popup
 */
const StaleDataPopup: React.FC = () => {
  const [showStaleDataPopup, setShowStaleDataPopup] = useAtom(showStaleDataPopupAtom);
  const { refreshData, timeSinceLastActivity } = useUserActivity();

  const handleRefreshData = () => {
    refreshData();
    setShowStaleDataPopup(false);
  };

  const handleDismiss = () => {
    setShowStaleDataPopup(false);
  };

  const formatInactiveTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    if (minutes < 1) return "less than a minute";
    if (minutes === 1) return "1 minute";
    return `${minutes} minutes`;
  };

  return (
    <Dialog open={showStaleDataPopup} onOpenChange={setShowStaleDataPopup}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Data May Be Stale
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              You've been inactive for {formatInactiveTime(timeSinceLastActivity)}.
              Data refreshing has been paused to save resources.
            </p>
            <p className="text-sm text-muted-foreground">
              Click "Refresh Data" to get the latest information, or continue 
              browsing with the current data.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Continue with Current Data
          </Button>
          <Button
            onClick={handleRefreshData}
            className="flex items-center gap-2 bg-[#17876D] hover:bg-[#145A4F]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaleDataPopup;