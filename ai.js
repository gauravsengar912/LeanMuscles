async function callAI(prompt) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    }
  );

  const result = await response.json();
  return result[0]?.generated_text || "AI error";
}
