import { useState } from "react";

export default function Chatbot() {
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const apiKey = ""; // Replace with your actual API key

  const fetchResponse = async () => {
    setResponse("Loading...");
    const payload = {
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [{ role: "user", content: userInput }],
      max_tokens: 200,
      stream: false,
    };

    try {
      const res = await fetch("https://router.huggingface.co/together/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.choices?.[0]?.message?.content || "No response received");
    } catch (error) {
      console.error("Error fetching response:", error);
      setResponse("Error fetching response");
    }
  };

  return (
    <div>
      <textarea
        className="text-black"
        rows={4}
        cols={50}
        placeholder="Type your query..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
      />
      <br />
      <button onClick={fetchResponse}>Get Response</button>
      <p>{response}</p>
    </div>
  );
}
