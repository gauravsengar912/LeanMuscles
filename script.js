let lastPlan="";

// WORKOUT
async function generatePlan(){
planCards.innerHTML="Generating...";
lastPlan=await generateWorkoutPlan({
age:age.value,weight:weight.value,goal:goal.value,experience:experience.value
});
renderWorkoutCards(lastPlan);
}

function renderWorkoutCards(t){
planCards.innerHTML="";
t.split("Day").slice(1).forEach(d=>{
const div=document.createElement("div");
div.className="workout-day";
const ex=d.split(":")[1];
const link=`https://youtube.com/results?search_query=${encodeURIComponent(ex)}`;
div.innerHTML=`<h3>Day ${d[0]}</h3><p>${ex}</p><a href="${link}" target="_blank">▶ Watch</a>`;
planCards.appendChild(div);
});
}

function savePlan(){
localStorage.setItem("workout",lastPlan);
alert("Saved");
}

// MACROS
function calculateMacros(){
const w=+calWeight.value,h=+calHeight.value,a=+calAge.value;
let c=10*w+6.25*h-5*a+5;
if(calGoal.value==="cut")c-=400;
if(calGoal.value==="bulk")c+=400;
macroOutput.textContent=
`Calories: ${c}
Protein: ${Math.round(w*2)}g
Carbs: ${Math.round((c-(w*2*4+w*.8*9))/4)}g
Fats: ${Math.round(w*.8)}g`;
}

// PROGRESS + CHARTS
function saveProgress(){
const p=JSON.parse(localStorage.getItem("progress")||"[]");
p.push({date:new Date().toLocaleDateString(),w:+progWeight.value,x:+progWorkouts.value});
localStorage.setItem("progress",JSON.stringify(p));
drawCharts();
}

function drawCharts(){
const p=JSON.parse(localStorage.getItem("progress")||"[]");
drawLine(weightChart,p.map(x=>x.w));
drawBar(workoutChart,p.map(x=>x.x));
}

function drawLine(c,data){
const ctx=c.getContext("2d");
ctx.clearRect(0,0,c.width,c.height);
ctx.strokeStyle="#22c55e";
ctx.beginPath();
data.forEach((v,i)=>{
ctx.lineTo(i*60+20,c.height-(v*3));
});
ctx.stroke();
}

function drawBar(c,data){
const ctx=c.getContext("2d");
ctx.clearRect(0,0,c.width,c.height);
data.forEach((v,i)=>{
ctx.fillStyle="#38bdf8";
ctx.fillRect(i*60+20,c.height-v*10,30,v*10);
});
}

drawCharts();

// CHAT
async function sendChat(){
chatOutput.textContent="...";
const r=await handleAIChat(chatInput.value);
streamText(chatOutput,r);
}