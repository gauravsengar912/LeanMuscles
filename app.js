async function generatePlan() {

  const height = document.getElementById("height").value;
  const weight = document.getElementById("weight").value;
  const age = document.getElementById("age").value;
  const sex = document.getElementById("sex").value;
  const days = document.getElementById("days").value;

  const prompt = `
  Create a ${days}-day gym workout plan and diet for:
  Height: ${height} cm
  Weight: ${weight} kg
  Age: ${age}
  Sex: ${sex}
  
  Include exercises with YouTube Shorts links.
  `;

  const plan = await callAI(prompt);

  localStorage.setItem("plan", plan);

  document.getElementById("planOutput").innerHTML = 
  plan + embedVideos(plan);

  document.getElementById("planSection").classList.remove("hidden");
}

function embedVideos(text) {
  const regex = /(https:\/\/www\.youtube\.com\/shorts\/[^\s]+)/g;
  const matches = text.match(regex);

  if (!matches) return "";

  return matches.map(link => {
    const videoId = link.split("/shorts/")[1];
    return `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
  }).join("");
}

async function modifyPlan() {
  const instruction = prompt("What would you like to modify?");
  const currentPlan = localStorage.getItem("plan");

  const newPlan = await callAI(
    `Modify this plan: ${currentPlan} 
    Based on this instruction: ${instruction}`
  );

  localStorage.setItem("plan", newPlan);
  document.getElementById("planOutput").innerHTML = newPlan;
}

async function calculateCalories() {
  const food = document.getElementById("foodInput").value;

  const prompt = `
  Calculate calories, protein, carbs and fats for: ${food}.
  Return in structured format.
  `;

  const result = await callAI(prompt);

  document.getElementById("calorieOutput").innerText = result;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}
