const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function callAI(prompt) {
  const apiKey = document.getElementById("apiKey").value;

  if (!apiKey) {
    alert("Please enter your Gemini API key");
    throw new Error("Missing API key");
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("Gemini API error");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}