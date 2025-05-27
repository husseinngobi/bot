const uploadInput = document.getElementById('upload');
const chatBox = document.getElementById('chat-box');
const resultsDiv = document.getElementById('results');
const userMessageInput = document.getElementById("userMessage");
const sendMessageButton = document.getElementById("sendMessage");

// Upload and process image/video
uploadInput.addEventListener('change', () => {
  const file = uploadInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append(file.type.includes("video") ? "video" : "image", file);

  appendMessage("📤 Uploading and analyzing...", "bot");

  fetch("/api/recognize", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      resultsDiv.innerHTML = "";
      const imgs = data.frames || [data.image];
      imgs.forEach(img => {
        const tag = document.createElement("img");
        tag.src = `data:image/jpeg;base64,${img}`;
        resultsDiv.appendChild(tag);
      });
      appendMessage("✅ Analysis complete. See the results above.", "bot");
    } else {
      appendMessage(`❌ ${data.message}`, "bot");
    }
  })
  .catch(error => {
    appendMessage("❌ Error processing the file.", "bot");
    console.error("Upload Error:", error);
  });
});

// Send user message
sendMessageButton.addEventListener("click", () => {
  const message = userMessageInput.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  generateBotReply(message); // Send message to backend
  userMessageInput.value = ""; // Clear input after sending
});

// Function to append messages in chat box
function appendMessage(text, type = "bot") {
  const msg = document.createElement("div");
  msg.className = `${type}-msg`;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Connect frontend to Flask backend
function generateBotReply(userText) {
  appendMessage("🤖 Thinking...", "bot");

  fetch("http://10.0.0.4:5000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userText })
  })
  .then(response => response.json())
  .then(data => {
    appendMessage(data.response, "bot");
  })
  .catch(error => {
    appendMessage("❌ Oops! Something went wrong.", "bot");
    console.error("Chatbot Error:", error);
  });
}