const GEMINI_API_KEY = "AIzaSyC47T3TDK5RhWn1r15kjJPHVAHcNTGiwUk";

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 350
        }
      })
    }
  );
  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

function generateWorkout(profile) {
  return callGemini(`
Create today's gym workout.
User:
${JSON.stringify(profile)}
Format:
Workout: Push/Pull/Legs
Exercises:
- Exercise – sets x reps
`);
}

function generateDiet(profile) {
  return callGemini(`
Create today's Indian gym diet.
User:
${JSON.stringify(profile)}
Include calories and protein.
Format meals clearly.
`);
}

function coachReply(msg) {
  return callGemini(`You are a fitness coach. Reply briefly. User: ${msg}`);
}
