"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";

export default function InterviewCompletePage() {
  const router = useRouter();

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="w-full">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="flex size-20 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="size-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Interview Complete</CardTitle>
              <CardDescription className="text-lg mt-2">
                Thank you for completing your visa interview session
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 pb-6">
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  What happens next?
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Your interview responses have been recorded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Review your performance and get feedback on your answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Practice as many times as you need to feel confident</span>
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                onClick={() => router.push("/configure-interview")}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <RefreshCw className="mr-2 size-4" />
                Practice Again
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Home className="mr-2 size-4" />
                Return Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}

