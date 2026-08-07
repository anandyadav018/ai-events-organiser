"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function UpgradeModal({ isOpen, onClose, trigger = "limit" }) {
  const getReasonText = () => {
    switch (trigger) {
      case "color":
        return "Unlock custom theme colors to make your events stand out.";
      case "limit":
      default:
        return "You've reached the limit of free events. Upgrade to create unlimited events.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <div className="h-[90vh] overflow-y-auto">
          <div className="p-6 md:p-10 space-y-4">
            <DialogHeader className="text-center">
              <DialogTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                Upgrade to Spott Pro
              </DialogTitle>
              <DialogDescription className="text-lg">
                {getReasonText()}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 text-center text-xl p-8 border rounded-lg bg-muted/50">
              Pricing options will be available soon. Please contact support to upgrade.
            </div>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={onClose} 
                className="w-full py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}