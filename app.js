const app = document.getElementById("app");

const profile = JSON.parse(localStorage.getItem("profile"));

if (!profile) renderProfile();
else renderHome();

function renderProfile() {
  app.innerHTML = `
    <h1>🏋️ SweatItOut</h1>
    <div class="card">
      <h2>Set up your profile</h2>
      <input id="age" placeholder="Age">
      <input id="height" placeholder="Height (cm)">
      <input id="weight" placeholder="Weight (kg)">
      <select id="goal">
        <option>Lean muscle</option>
        <option>Fat loss</option>
        <option>Bulk</option>
      </select>
      <select id="diet">
        <option>Non-veg</option>
        <option>Veg</option>
      </select>
      <button onclick="saveProfile()">Continue</button>
    </div>
  `;
}

function saveProfile() {
  const p = {
    age: age.value,
    height: height.value,
    weight: weight.value,
    goal: goal.value,
    diet: diet.value
  };
  localStorage.setItem("profile", JSON.stringify(p));
  location.reload();
}

async function renderHome() {
  app.innerHTML = `<h1>🏋️ SweatItOut</h1>`;

  const workout = await generateWorkout(profile);
  const diet = await generateDiet(profile);

  app.innerHTML += `
    <div class="card">
      <h2>Today's Workout</h2>
      <p>${workout.replace(/\n/g, "<br>")}</p>
      <a class="link" href="#">▶ Start Workout</a>
    </div>

    <div class="card">
      <h2>Today's Diet</h2>
      <p>${diet.replace(/\n/g, "<br>")}</p>
    </div>

    <div class="card">
      <h2>AI Coach</h2>
      <input id="coachInput" placeholder="Ask something">
      <button onclick="askCoach()">Ask</button>
      <p id="coachReply" class="small"></p>
    </div>
  `;
}

async function askCoach() {
  coachReply.textContent = "Thinking...";
  const reply = await coachReply(coachInput.value);
  coachReply.textContent = reply;
}
