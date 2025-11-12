import { useCallback, useState } from "react";
import { decodeJwt } from "jose";
import type { ConnectionDetails, LiveKitConfig } from "@/lib/types/livekit";
import type { AgentConfig } from "@/lib/agent-config-builder";

const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;

export function useConnectionDetails(config: LiveKitConfig, agentConfig?: AgentConfig) {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);
  
  // Generate a stable session ID that persists for this hook instance
  // Useful for debugging room names
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  const fetchConnectionDetails = useCallback(async () => {
    console.log("🟢 Fetching connection details from API", { sessionId });
    
    const url = new URL(
      "/api/livekit/connection-details",
      window.location.origin
    );

    try {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room_config: config.agentName
            ? {
                agents: [{ agent_name: config.agentName }],
              }
            : undefined,
          agent_config: agentConfig, // Pass agent configuration
          session_id: sessionId, // Pass session ID for stable room naming
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Got connection details", {
        roomName: data.roomName,
        serverUrl: data.serverUrl,
        sessionId,
      });

      setConnectionDetails(data);
      return data;
    } catch (error) {
      console.error("❌ Failed to fetch connection details", {
        error,
        sessionId,
      });
      throw new Error("Error fetching connection details!");
    }
  }, [config.agentName, agentConfig, sessionId]);

  // Don't fetch on mount - let the component fetch when needed
  // This prevents React Strict Mode from creating duplicate rooms

  const isConnectionDetailsExpired = useCallback(() => {
    const token = connectionDetails?.participantToken;
    if (!token) {
      return true;
    }

    const jwtPayload = decodeJwt(token);
    if (!jwtPayload.exp) {
      return true;
    }
    const expiresAt = new Date(
      jwtPayload.exp * 1000 - ONE_MINUTE_IN_MILLISECONDS
    );

    const now = new Date();
    return expiresAt <= now;
  }, [connectionDetails?.participantToken]);

  // Simplified: always fetch if we don't have details or they're expired
  // Since we create fresh rooms now, no need for complex caching
  const existingOrRefreshConnectionDetails = useCallback(async () => {
    if (!connectionDetails || isConnectionDetailsExpired()) {
      return fetchConnectionDetails();
    }
    return connectionDetails;
  }, [connectionDetails, fetchConnectionDetails, isConnectionDetailsExpired]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
    existingOrRefreshConnectionDetails,
  };
}
