// ============================================================
// AI Integration (Cerebras API)
// ============================================================

async function callCerebras(messages, systemPrompt, stream = false) {
  const response = await fetch(`${CONFIG.CEREBRAS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: CONFIG.CEREBRAS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 4096,
      temperature: 0.7,
      stream,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  if (stream) return response;

  const data = await response.json();
  return data.choices[0].message.content;
}

// ---- Workout Plan Generation ----
async function generateWorkoutPlan(profile) {
  const regen_notes = profile.regen_notes || '';
  const system = `You are a certified strength and conditioning specialist (NSCA-CSCS) and Brad Schoenfeld-inspired evidence-based trainer. Create highly structured, periodized workout plans as valid JSON only. No markdown, no explanation.`;

  const userMsg = `Create a ${profile.training_days}-day/week workout plan for:
- Age: ${profile.age}, Gender: ${profile.gender}
- Goal: ${profile.goal}
- Experience: ${profile.experience}
- Split: ${profile.split}
- Equipment: ${profile.equipment}
- Notes: ${profile.notes || 'none'} ${regen_notes ? '| Custom: ' + regen_notes : ''}

Return JSON with this exact structure:
{
  "split": "PPL/Upper-Lower/etc",
  "days": [
    {
      "day": 1,
      "name": "Push Day A",
      "type": "training|rest",
      "focus": "Chest, Shoulders, Triceps",
      "warmup": "5 min light cardio, dynamic stretches",
      "deload_note": null,
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "muscle": "Chest (Primary), Triceps, Anterior Deltoid",
          "sets": 4,
          "reps": "6-8",
          "rir": 2,
          "tempo": "3-0-1-0",
          "rest_seconds": 120,
          "notes": "Control the eccentric",
          "youtube_id": "rT7DgCr-3pg",
          "alternatives": []
        }
      ]
    }
  ],
  "weekly_volume": {
    "chest": 16, "back": 18, "shoulders": 12, "legs": 20, "biceps": 10, "triceps": 10, "core": 8
  },
  "deload_protocol": "Week 4: reduce weight by 40%, volume by 50%"
}

Include ${profile.training_days} training days + rest days to fill 7 days. Include 4-6 exercises per day with real YouTube IDs where known.`;

  const result = await callCerebras([{ role: 'user', content: userMsg }], system);
  return JSON.parse(cleanJSON(result));
}

// ---- Diet Plan Generation ----
async function generateDietPlan(profile) {
  const tdee = calcTDEE(profile);
  const regen_notes = profile.regen_notes || '';
  const system = `You are a registered dietitian specializing in Indian cuisine and sports nutrition. Create detailed meal plans as valid JSON only. No markdown, no explanation.`;

  const goalCalories = {
    fat_loss: tdee - 400,
    muscle_gain: tdee + 300,
    recomp: tdee,
    strength: tdee + 200,
    endurance: tdee + 150,
    health: tdee,
  };
  const calories = goalCalories[profile.goal] || tdee;
  const protein = Math.round(profile.weight_kg * 2.0); // 2g/kg
  const carbs_training = Math.round((calories * 0.5) / 4);
  const carbs_rest = Math.round((calories * 0.35) / 4);
  const fat = Math.round((calories * 0.25) / 9);

  const userMsg = `Create a 7-day Indian ${profile.diet_preference} meal plan:
- TDEE: ${tdee} kcal, Goal calories: ${calories} kcal
- Protein: ${protein}g, Carbs (training): ${carbs_training}g, Carbs (rest): ${carbs_rest}g, Fat: ${fat}g
- Carb periodisation: higher carbs on training days
- Preference: ${profile.diet_preference}
${regen_notes ? '- Custom: ' + regen_notes : ''}

Return JSON:
{
  "tdee": ${tdee},
  "goal_calories": ${calories},
  "macro_targets": { "protein": ${protein}, "carbs_training": ${carbs_training}, "carbs_rest": ${carbs_rest}, "fat": ${fat} },
  "days": [
    {
      "day": 1,
      "day_name": "Monday",
      "is_training": true,
      "total_calories": 2400,
      "macros": { "protein": 160, "carbs": 280, "fat": 65 },
      "meals": [
        {
          "name": "Breakfast",
          "time": "7:30 AM",
          "total_calories": 450,
          "macros": { "protein": 30, "carbs": 55, "fat": 12 },
          "items": [
            { "name": "Moong Dal Chilla", "portion": "3 pieces (180g)", "calories": 220, "macros": { "protein": 14, "carbs": 28, "fat": 5 } },
            { "name": "Greek Yogurt", "portion": "150g", "calories": 130, "macros": { "protein": 15, "carbs": 8, "fat": 3 } }
          ]
        }
      ]
    }
  ],
  "weekly_swaps": [
    { "original": "White Rice", "swap": "Brown Rice / Quinoa", "reason": "Higher fiber, lower GI" }
  ]
}`;

  const result = await callCerebras([{ role: 'user', content: userMsg }], system);
  return JSON.parse(cleanJSON(result));
}

// ---- Exercise Substitution ----
async function getExerciseSubstitutions(exerciseName, profile) {
  const system = `You are a certified personal trainer. Return 3 exercise substitutions as JSON only.`;
  const msg = `Suggest 3 substitutions for "${exerciseName}" for someone with: equipment=${profile?.equipment || 'full_gym'}, notes=${profile?.notes || 'none'}.

Return JSON:
[
  { "name": "Alternative Exercise", "muscle": "Same muscle group", "reason": "Good for..." },
  { "name": "Another Option", "muscle": "...", "reason": "..." },
  { "name": "Third Option", "muscle": "...", "reason": "..." }
]`;

  const result = await callCerebras([{ role: 'user', content: msg }], system);
  return JSON.parse(cleanJSON(result));
}

// ---- AI Food Estimate ----
async function getAIFoodEstimate(foodName) {
  const cacheKey = `ai_food_${foodName.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const system = `You are a nutrition database. Return macros for foods as JSON only.`;
  const msg = `Macros per 100g for "${foodName}" (Indian/common food):
Return JSON: { "name": "${foodName}", "calories": 150, "protein": 5, "carbs": 25, "fat": 3, "fiber": 2, "per": "100g" }`;

  const result = await callCerebras([{ role: 'user', content: msg }], system);
  const parsed = JSON.parse(cleanJSON(result));
  cacheSet(cacheKey, parsed);
  return parsed;
}

// ---- AI Chat (streaming) ----
async function sendAIChat(message, context, historyMessages) {
  const contexts = {
    workout: `You are a personal trainer AI assistant helping the user with their workout plan. Current plan: ${JSON.stringify(STATE.workoutPlan?.days?.slice(0,2) || [])}`,
    diet: `You are a sports nutritionist AI helping with the user's diet plan. Profile: age=${STATE.profile?.age}, weight=${STATE.profile?.weight_kg}kg, goal=${STATE.profile?.goal}`,
    foodlog: `You are a nutrition coach helping the user track food. Today's log calories: ${getTodayTotalCals()}. Daily target: ${calcTDEE(STATE.profile)}`,
  };

  const messages = [
    ...historyMessages,
    { role: 'user', content: message }
  ];

  const response = await callCerebras(messages, contexts[context] || contexts.workout, true);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  return {
    async *[Symbol.asyncIterator]() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const raw = line.replace('data: ', '');
          if (raw === '[DONE]') return;
          try {
            const obj = JSON.parse(raw);
            const delta = obj.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              yield delta;
            }
          } catch {}
        }
      }
    },
    get fullText() { return fullText; }
  };
}

// ---- Biweekly Review ----
async function generateBiweeklyReview() {
  const system = `You are a fitness coach AI. Generate a brief encouraging biweekly progress review in 3-4 sentences.`;
  const profile = STATE.profile;
  const totalSessions = STATE.workoutLogs?.length || 0;
  const avgCals = getAvgDailyCals();

  const msg = `User stats:
- Sessions last 2 weeks: ${totalSessions}
- Goal: ${profile?.goal}
- Current streak: ${STATE.streak} days
- Avg daily calories: ${avgCals} kcal (target: ${calcTDEE(profile)})
Write a motivating progress review with specific insights and 1 key recommendation.`;

  return await callCerebras([{ role: 'user', content: msg }], system);
}

// ---- AI Chat Modal ----
let currentChatContext = 'workout';

function openChat(context) {
  currentChatContext = context;
  document.querySelector('#ai-chat-modal h3').textContent = `🤖 ${context.charAt(0).toUpperCase() + context.slice(1)} AI`;
  const messages = document.getElementById('chat-msgs');
  messages.innerHTML = '';

  // Welcome message
  if (STATE.aiChatHistory[context]?.length === 0) {
    addChatMessage('ai', getWelcomeMsg(context));
  } else {
    STATE.aiChatHistory[context].forEach(msg => {
      addChatMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
    });
  }

  $('ai-chat-modal').style.display='flex';
}

function getWelcomeMsg(context) {
  const msgs = {
    workout: "Hi! I'm your workout AI. Ask me about your exercises, form, substitutions, or training advice! 💪",
    diet: "Hi! I'm your nutrition AI. Ask about your meals, macros, Indian food options, or meal timing! 🥗",
    foodlog: "Hi! I can help you track food, estimate macros, or give meal advice based on your log! 🍛",
  };
  return msgs[context] || msgs.workout;
}

function addChatMessage(role, content) {
  const messages = document.getElementById('chat-msgs');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = content;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function initAIChat() {
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-in');

  const send = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addChatMessage('user', text);

    // Add to history
    STATE.aiChatHistory[currentChatContext].push({ role: 'user', content: text });

    // Thinking indicator
    const thinking = document.createElement('div');
    thinking.className = 'chat-msg ai thinking';
    thinking.innerHTML = '<div class="think-dot"></div><div class="think-dot"></div><div class="think-dot"></div>';
    document.getElementById('chat-msgs').appendChild(thinking);
    document.getElementById('chat-msgs').scrollTop = 99999;

    try {
      const historyMsgs = STATE.aiChatHistory[currentChatContext].slice(-10);
      const stream = await sendAIChat(text, currentChatContext, historyMsgs.slice(0, -1));

      thinking.remove();
      const aiDiv = addChatMessage('ai', '');

      for await (const chunk of stream) {
        aiDiv.textContent += chunk;
        document.getElementById('chat-msgs').scrollTop = 99999;
      }

      STATE.aiChatHistory[currentChatContext].push({ role: 'assistant', content: aiDiv.textContent });
    } catch(e) {
      thinking.remove();
      addChatMessage('ai', 'Sorry, I had trouble connecting. Please try again! ' + e.message);
    }
  };

  sendBtn?.addEventListener('click', send);
  input?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
}

// ---- Helpers ----
function cleanJSON(str) {
  // Remove markdown code blocks if present
  return str.replace(/^```json\n?|^```\n?|\n?```$/gm, '').trim();
}

function getTodayTotalCals() {
  const log = getTodayFoodLog();
  let total = 0;
  Object.values(log).forEach(meal => {
    meal.forEach(item => total += item.calories || 0);
  });
  return total;
}

function getAvgDailyCals() {
  const logs = Object.values(STATE.foodLog);
  if (!logs.length) return 0;
  let total = 0;
  logs.forEach(log => {
    Object.values(log).forEach(meal => meal.forEach(item => total += item.calories || 0));
  });
  return Math.round(total / logs.length);
}
