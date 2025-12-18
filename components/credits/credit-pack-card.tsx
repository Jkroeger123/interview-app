"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2 } from "lucide-react";
import type { CreditPack } from "@/lib/stripe-config";

interface CreditPackCardProps {
  pack: CreditPack;
}

export function CreditPackCard({ pack }: CreditPackCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      // Call checkout endpoint
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId: pack.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert(error instanceof Error ? error.message : "Failed to start checkout");
      setIsLoading(false);
    }
  };

  const priceInDollars = (pack.price / 100).toFixed(2);
  const pricePerCredit = (pack.price / pack.credits / 100).toFixed(2);

  return (
    <Card className={pack.popular ? "border-blue-500 border-2 relative" : ""}>
      {pack.popular && (
        <Badge
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500"
          variant="default"
        >
          Most Popular
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {pack.name}
          {pack.popular && <span className="text-blue-500">⭐</span>}
        </CardTitle>
        <CardDescription>{pack.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Credits */}
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="size-8 text-yellow-500" />
                <span className="text-4xl font-bold">{pack.credits}</span>
              </div>
              <p className="text-sm text-muted-foreground">Credits</p>
            </div>
          </div>

          {/* Price */}
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold">${priceInDollars}</div>
            <p className="text-sm text-muted-foreground">
              ${pricePerCredit} per credit
            </p>
          </div>

          {/* What you get */}
          <div className="space-y-2 text-sm">
            <p className="font-medium">What you get:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• {pack.credits} interview credits</li>
              <li>• AI-powered analysis</li>
              <li>• Video recordings</li>
              <li>• Detailed transcripts</li>
              <li>• Never expires</li>
            </ul>
          </div>

          {/* Purchase button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePurchase}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Buy {pack.credits} Credits
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



