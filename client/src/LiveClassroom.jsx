
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";

import "@livekit/components-styles";

const LIVE_CLASS_API_URL = "http://localhost:5000/api/live-classes";

export default function LiveClassroom({
  liveClassId,
  liveClassTitle,
  onExit,
}) {
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);
  const [connected, setConnected] = useState(true);
  const [classEnded, setClassEnded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const joinClassroom = async () => {
      try {
        setLoading(true);
        setError("");

        if (!liveClassId) {
          throw new Error("Live class ID is missing.");
        }

        const authToken = localStorage.getItem("lmsToken");

        if (!authToken) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        const response = await fetch(
          `${LIVE_CLASS_API_URL}/${encodeURIComponent(liveClassId)}/token`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to join the live classroom."
          );
        }

        if (!data.token || !data.serverUrl || !data.userRole) {
          throw new Error("LiveKit connection details are incomplete.");
        }

        if (isMounted) {
          setToken(data.token);
          setServerUrl(data.serverUrl);
          setUserRole(data.userRole);
          setConnected(true);
        }
      } catch (err) {
        console.error("Live classroom error:", err);

        if (isMounted) {
          setError(err.message || "Unable to connect to the classroom.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    joinClassroom();

    return () => {
      isMounted = false;
    };
  }, [liveClassId]);

  // Instructor ends the complete class
  const handleEndClass = async () => {
    const confirmEnd = window.confirm(
      "Are you sure you want to end this class for everyone?"
    );

    if (!confirmEnd) return;

    try {
      setEnding(true);
      setError("");

      const authToken = localStorage.getItem("lmsToken");

      const response = await fetch(
        `${LIVE_CLASS_API_URL}/${encodeURIComponent(liveClassId)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to end the class.");
      }

      // Disconnect instructor after backend closes the room
      setClassEnded(true);
      setConnected(false);
    } catch (err) {
      console.error("End class error:", err);
      setError(err.message || "Unable to end the class.");
    } finally {
      setEnding(false);
    }
  };

  // LiveKit calls this when the room is disconnected.
  // Deleting the room from the backend disconnects all students.
  const handleDisconnected = () => {
    setConnected(false);
    setClassEnded(true);
  };

  if (loading) {
    return (
      <div style={styles.messagePage}>
        <div style={styles.messageCard}>
          <h2>Connecting to Live Classroom...</h2>
          <p>Please wait while we prepare your video session.</p>
        </div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div style={styles.messagePage}>
        <div style={styles.messageCard}>
          <h2>Unable to Join Classroom</h2>
          <p style={styles.error}>{error}</p>

          <button style={styles.exitButton} onClick={onExit}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (classEnded || !connected) {
    return (
      <div style={styles.messagePage}>
        <div style={styles.messageCard}>
          <h2>Live Class Ended</h2>
          <p>
            The instructor has ended this live class.
            Thank you for joining LearnSpace!
          </p>

          <button style={styles.exitButton} onClick={onExit}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.classroom}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>LearnSpace Live Classroom</h2>
          <p style={styles.subtitle}>
            {liveClassTitle || "Live Learning Session"}
          </p>
        </div>

        <div style={styles.headerActions}>
          {userRole === "instructor" ? (
            <button
              style={styles.endButton}
              onClick={handleEndClass}
              disabled={ending}
            >
              {ending ? "Ending Class..." : "End Class"}
            </button>
          ) : (
            <button style={styles.exitButton} onClick={onExit}>
              Leave Classroom
            </button>
          )}
        </div>
      </header>

      {error && <p style={styles.errorBanner}>{error}</p>}

      <div style={styles.videoArea} data-lk-theme="default">
        <LiveKitRoom
          serverUrl={serverUrl}
          token={token}
          connect={connected}
          video={true}
          audio={true}
          onDisconnected={handleDisconnected}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    </div>
  );
}

const styles = {
  messagePage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f5f6fb",
  },

  messageCard: {
    width: "100%",
    maxWidth: "480px",
    padding: "32px",
    borderRadius: "16px",
    background: "#ffffff",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  },

  classroom: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#111827",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    padding: "16px 24px",
    background: "#ffffff",
  },

  title: {
    margin: 0,
    color: "#1f2937",
    fontSize: "20px",
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
  },

  exitButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },

  endButton: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },

  error: {
    color: "#c0392b",
  },

  errorBanner: {
    padding: "10px 20px",
    margin: 0,
    background: "#fee2e2",
    color: "#991b1b",
  },

  videoArea: {
    flex: 1,
    minHeight: "calc(100vh - 85px)",
  },
};
