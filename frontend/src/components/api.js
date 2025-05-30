export const fetchChatResponse = async (message) => {
    const response = await fetch("http://10.0.0.4:5000/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
    });
    return response.json();
};

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("http://10.0.0.4:5000/upload", {
        method: "POST",
        body: formData,
    });

    return response.json();
};