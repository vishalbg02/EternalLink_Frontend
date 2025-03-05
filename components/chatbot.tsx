import { useState } from "react";

export default function Chatbot() {
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const apiKey = ""; // Replace with your actual API key

  const fetchResponse = async () => {
    setResponse("Loading...");
    const systemPrompt=`You are an AI assistant capable of providing helpful and accurate responses to user queries. When users ask about EternalLink, the messaging platform, provide responses based on the following details: 
    
    EternalLink is a next-generation messaging platform that integrates quantum-resistant encryption, decentralized storage (IPFS), AI-assisted messaging, and augmented reality (AR) features to offer a secure, user-friendly, and forward-thinking communication solution.

  It prioritizes user privacy and decentralization, making it suitable for both personal and enterprise use. By leveraging emerging technologies, EternalLink ensures long-term security against quantum computing threats and enhances communication through AI-driven features and immersive AR experiences.

  Its decentralized nature aligns with the Web3 movement, giving users greater control over their data. EternalLink is designed to adapt to future advancements in quantum computing and artificial intelligence, making it a reliable, future-proof communication ecosystem.

  If the user asks about EternalLink, provide information based on the above details. Otherwise, respond naturally based on your usual knowledge and reasoning capabilities.`;


    const payload = {
      model: "mistralai/Mistral-7B-Instruct-v0.3",
      messages: [{role : "system", content: systemPrompt},
                    { role: "user", content: userInput }],
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
