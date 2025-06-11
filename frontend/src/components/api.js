// Add timeout-enabled fetch
const fetchWithTimeout = async (url, options, timeout = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Use local server during dev, internal IP in deployment
const isLocalhost =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_BASE = isLocalhost
  ? "http://127.0.0.1:5000"
  : "http://192.168.1.4:5000";

// Chat text messages (to phi3)
export const fetchChatResponse = async (message) => {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch chat response");
    }

    return await res.json();
  } catch (error) {
    console.error("Chat fetch error:", error);
    return { error: error.message.includes("aborted") ? "Request timed out" : error.message };
  }
};

// Image/video upload for face recognition (handled by DeepFace)
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetchWithTimeout(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to upload file");
    }

    return await res.json();
  } catch (error) {
    console.error("Upload file error:", error);
    return { error: error.message.includes("aborted") ? "Upload timed out" : error.message };
  }
};
