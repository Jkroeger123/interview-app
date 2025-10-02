import { useCallback, useEffect, useState } from "react";
import { decodeJwt } from "jose";
import type { ConnectionDetails, LiveKitConfig } from "@/lib/types/livekit";

const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;

export function useConnectionDetails(config: LiveKitConfig) {
  const [connectionDetails, setConnectionDetails] =
    useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(async () => {
    setConnectionDetails(null);
    const url = new URL(
      "/api/livekit/connection-details",
      window.location.origin
    );

    let data: ConnectionDetails;
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
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      data = await res.json();
    } catch (error) {
      console.error("Error fetching connection details:", error);
      throw new Error("Error fetching connection details!");
    }

    setConnectionDetails(data);
    return data;
  }, [config.agentName]);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

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

  const existingOrRefreshConnectionDetails = useCallback(async () => {
    if (isConnectionDetailsExpired() || !connectionDetails) {
      return fetchConnectionDetails();
    } else {
      return connectionDetails;
    }
  }, [connectionDetails, fetchConnectionDetails, isConnectionDetailsExpired]);

  return {
    connectionDetails,
    refreshConnectionDetails: fetchConnectionDetails,
    existingOrRefreshConnectionDetails,
  };
}
