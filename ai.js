const GEMINI_API_KEY="AIzaSyC47T3TDK5RhWn1r15kjJPHVAHcNTGiwUk";

async function callGemini(prompt){
const r=await fetch(
`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
contents:[{parts:[{text:prompt}]}],
generationConfig:{maxOutputTokens:350,temperature:.4}
})
}
);
const d=await r.json();
return d.candidates[0].content.parts[0].text.trim();
}

function streamText(el,text){
el.textContent="";
let i=0;
const t=setInterval(()=>{
el.textContent+=text[i++];
if(i>=text.length)clearInterval(t);
},15);
}

async function handleAIChat(m){
return callGemini(`You are a gym coach. Reply short. User:${m}`);
}

async function generateWorkoutPlan(u){
return callGemini(`Create 4-day workout. Format Day X: Exercise - sets x reps. User:${JSON.stringify(u)}`);
}