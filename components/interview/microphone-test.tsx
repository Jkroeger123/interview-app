"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, CheckCircle2, AlertCircle } from "lucide-react";

interface MicrophoneTestProps {
  onTestComplete?: (passed: boolean) => void;
}

export function MicrophoneTest({ onTestComplete }: MicrophoneTestProps) {
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [volume, setVolume] = useState(0);
  const [micStatus, setMicStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [goodVolumeCount, setGoodVolumeCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Test sentences for user to read
  const testSentences = [
    "My name is on my passport and I am ready for my interview.",
    "I am applying for a visa to study in the United States.",
    "I can hear you clearly and my microphone is working well.",
  ];
  const [currentSentence] = useState(
    testSentences[Math.floor(Math.random() * testSentences.length)]
  );

  const startMicTest = async () => {
    try {
      setIsTestingMic(true);
      setMicStatus("testing");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;

      // Create audio context and analyser
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start monitoring volume
      monitorVolume();
    } catch (error) {
      console.error("Microphone access error:", error);
      setMicStatus("error");
      setIsTestingMic(false);
    }
  };

  const monitorVolume = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let consecutiveGoodVolume = 0;

    const updateVolume = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedVolume = Math.min(100, (average / 255) * 100);

      setVolume(normalizedVolume);

      // Check if mic is working (volume above threshold of 15 for better detection)
      if (normalizedVolume > 15 && micStatus === "testing") {
        consecutiveGoodVolume++;
        setGoodVolumeCount((prev) => prev + 1);
        
        // After 30 consecutive frames (~0.5 seconds) of good volume, mark as success
        if (consecutiveGoodVolume >= 30) {
          setMicStatus("success");
          if (onTestComplete) {
            onTestComplete(true);
          }
        }
      } else if (normalizedVolume <= 15) {
        consecutiveGoodVolume = 0;
      }

      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };

    updateVolume();
  };

  const stopMicTest = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    analyserRef.current = null;
    setIsTestingMic(false);
    setVolume(0);
    setGoodVolumeCount(0);

    if (micStatus !== "success") {
      setMicStatus("idle");
    }
  };

  const retryTest = () => {
    setMicStatus("idle");
    setGoodVolumeCount(0);
    if (onTestComplete) {
      onTestComplete(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div
          className={`flex items-center justify-center rounded-lg p-3 transition-colors ${
            micStatus === "success"
              ? "bg-green-500/10"
              : micStatus === "error"
              ? "bg-red-500/10"
              : "bg-orange-500/10"
          }`}
        >
          {micStatus === "success" ? (
            <CheckCircle2 className="size-5 text-green-600" />
          ) : micStatus === "error" ? (
            <AlertCircle className="size-5 text-red-600" />
          ) : isTestingMic ? (
            <Mic className="size-5 text-orange-600" />
          ) : (
            <MicOff className="size-5 text-orange-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Microphone Test</p>
            {isTestingMic ? (
              <Button
                size="sm"
                variant="outline"
                onClick={stopMicTest}
                className="h-7 text-xs"
              >
                Stop Test
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={startMicTest}
                className="h-7 text-xs"
              >
                Test Microphone
              </Button>
            )}
          </div>

          {micStatus === "idle" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-600">
                ⚠️ Microphone test required before starting interview
              </p>
              <p className="text-sm text-muted-foreground">
                Click "Test Microphone" to verify your audio setup
              </p>
            </div>
          )}

          {micStatus === "testing" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-600 mb-2">
                🎤 Please read this sentence out loud:
              </p>
              <p className="text-base font-medium bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                "{currentSentence}"
              </p>
            </div>
          )}

          {micStatus === "success" && (
            <div className="space-y-2">
              <p className="text-sm text-green-600 font-medium">
                ✓ Microphone test passed! You're ready to begin.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={retryTest}
                className="h-7 text-xs"
              >
                Test Again
              </Button>
            </div>
          )}

          {micStatus === "error" && (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">
                ✗ Could not access microphone. Please check your browser permissions.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={startMicTest}
                className="h-7 text-xs"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Volume Meter */}
          {isTestingMic && (
            <div className="mt-3">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    volume > 50
                      ? "bg-green-500"
                      : volume > 20
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${volume}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Low</span>
                <span className="text-xs text-muted-foreground">High</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}



