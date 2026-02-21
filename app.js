async function generatePlan() {
  const output = document.getElementById("planOutput");
  output.innerHTML = "⏳ Generating plan...";

  const height = document.getElementById("height").value;
  const weight = document.getElementById("weight").value;
  const age = document.getElementById("age").value;
  const sex = document.getElementById("sex").value;
  const days = document.getElementById("days").value;

  if (!height || !weight || !age || !sex || !days) {
    alert("Please fill all details");
    return;
  }

  const prompt = `
Create a ${days}-day gym workout and diet plan.

User:
Height: ${height} cm
Weight: ${weight} kg
Age: ${age}
Sex: ${sex}

Requirements:
- Lean muscle focus
- Beginner friendly
- Include YouTube Shorts links for each exercise
- Include diet with calories
`;

  try {
    const plan = await callAI(prompt);
    localStorage.setItem("plan", plan);

    output.innerHTML = plan + embedVideos(plan);
    document.getElementById("planSection").classList.remove("hidden");
  } catch (e) {
    output.innerHTML = "❌ Failed to generate plan";
    console.error(e);
  }
}

async function modifyPlan() {
  const instruction = prompt("What would you like to change?");
  if (!instruction) return;

  const currentPlan = localStorage.getItem("plan");

  const prompt = `
Modify the following workout & diet plan:

${currentPlan}

User instruction:
${instruction}
`;

  const newPlan = await callAI(prompt);
  localStorage.setItem("plan", newPlan);

  document.getElementById("planOutput").innerHTML =
    newPlan + embedVideos(newPlan);
}

async function calculateCalories() {
  const food = document.getElementById("foodInput").value;
  const output = document.getElementById("calorieOutput");

  if (!food) return;

  output.innerHTML = "⏳ Calculating...";

  const prompt = `
Calculate calories, protein, carbs and fats for:
${food}
`;

  try {
    output.innerText = await callAI(prompt);
  } catch {
    output.innerText = "❌ Failed to calculate calories";
  }
}

function embedVideos(text) {
  const regex = /https:\/\/www\.youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/g;
  let match, html = "";

  while ((match = regex.exec(text)) !== null) {
    html += `
      <iframe
        src="https://www.youtube.com/embed/${match[1]}"
        allowfullscreen>
      </iframe>`;
  }
  return html;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}