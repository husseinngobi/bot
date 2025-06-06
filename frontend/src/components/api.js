const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_BASE = isLocalhost 
  ? "http://127.0.0.1:5000"         // Use localhost when testing on same machine
  : "http://192.168.1.4:5000";      // Use LAN IP when accessing from other devices

export const fetchChatResponse = async (message) => {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });
  return await res.json();
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData
  });

  return await res.json();
};
