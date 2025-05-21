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
  });
});

// Send user message
sendMessageButton.addEventListener("click", () => {
  const message = userMessageInput.value.trim();
  if (!message) return;

  appendMessage(message, "user");
  generateBotReply(message); // Bot replies based on user input
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

// Simple bot response generator
function generateBotReply(userText) {
  let reply = "🤖 Interesting... Tell me more!";
  
  if (userText.toLowerCase().includes("hello")) reply = "👋 Hi! How can I assist you today?";
  if (userText.toLowerCase().includes("face")) reply = "🧠 I can analyze faces in images and videos!";
  if (userText.toLowerCase().includes("how are you")) reply = "I'm just a bot, but thanks for asking! 🚀";

  setTimeout(() => {
    appendMessage(reply, "bot");
  }, 1000);
}