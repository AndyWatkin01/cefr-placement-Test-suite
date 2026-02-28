// ==================== GLOBAL STATE ====================
let fullTestData = null;
let currentVersionData = null;
let selectedAudience = null;
let currentLevelIndex = 3; // Starts at B2
let currentAudioIndex = 0;
let currentQuestionIndex = 0;

let studentName = "Guest";
let listeningSessionData = [];
let audioPlayCount = 0;
let questionStartTime = 0;

let isAudioUnlocked = false;
let hasFailedB2 = false;

// ==================== INITIALIZATION ====================
async function initTest() {
  try {
    const response = await fetch("data/questions.json");
    if (!response.ok) throw new Error("Could not find data/questions.json.");
    fullTestData = await response.json();

    fullTestData.versions.forEach((v) => {
      v.levels.forEach((l) => {
        l.audios.forEach((a) => shuffleArray(a.questions));
      });
    });
  } catch (error) {
    console.error("Initialization Failed:", error);
  }
}

document.addEventListener("DOMContentLoaded", initTest);

function selectAudience(audienceKey) {
  if (!fullTestData) return;
  selectedAudience = audienceKey;
  currentVersionData = fullTestData.versions.find((v) =>
    v.audience.toLowerCase().includes(audienceKey),
  );
  if (currentVersionData) showScreen("confirmScreen");
}

function startAssessment() {
  const nameInput = document.getElementById("studentName");
  if (nameInput && nameInput.value.trim() !== "")
    studentName = nameInput.value.trim();
  showScreen("testScreen");
  loadAudio();
}

function showScreen(screenId) {
  // 1. Hide all screens
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.style.setProperty("display", "none", "important"));

  // 2. Show the target screen
  const target = document.getElementById(screenId);
  if (target) target.style.setProperty("display", "flex", "important");

  // 3. SURGICAL FIX: Toggle Sidebar visibility
  const sidebar = document.querySelector(".welcome-sidebar");
  if (sidebar) {
    // Only show sidebar on the very first screen (welcomeScreen)
    sidebar.style.display = screenId === "welcomeScreen" ? "flex" : "none";
  }
}

function loadAudio() {
  const level = currentVersionData.levels[currentLevelIndex];
  const audio = level.audios[currentAudioIndex];
  currentQuestionIndex = 0;
  audioPlayCount = 0;
  isAudioUnlocked = false;

  const ui = document.getElementById("testUI");
  ui.innerHTML = `
        <div class="welcome-content">
         <p style="color: #3498db; font-weight: 600; margin-bottom: 10px;">
            Click the right answer. You can click the Pass button if you don't know the answer. You can play the audio again if you need to.
        </p>
            <h2 style="color: #1abc9c; margin-bottom: 10px;">Listening Assessment</h2>
            <p style="margin-bottom: 15px;"><strong>Scenario:</strong> ${audio.scenario}</p>
            <button id="playBtn" class="btn start-btn" onclick="playAudio()">▶ PLAY AUDIO</button>
            <audio id="mainAudio" style="display: none;"><source src="audio/${audio.track_id}.mp3" type="audio/mpeg"></audio>
            <div id="dynamic-test-area" style="margin-top: 10px; width: 100%;">
                <p class="status-badge" style="background:#e67e22; color:white; padding: 10px; border-radius: 5px;">Please listen to unlock questions.</p>
            </div>
        </div>
    `;

  document.getElementById("mainAudio").onended = () => {
    if (!isAudioUnlocked) {
      isAudioUnlocked = true;
      revealQuestion();
    }
  };
}

function playAudio() {
  const audio = document.getElementById("mainAudio");
  audio.play();
  audioPlayCount++;
}

function revealQuestion() {
  const level = currentVersionData.levels[currentLevelIndex];
  const audio = level.audios[currentAudioIndex];
  const q = audio.questions[currentQuestionIndex];
  questionStartTime = Date.now();

  const container = document.getElementById("dynamic-test-area");
  if (container) {
    container.innerHTML = `
            <style>
                .options-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px auto;
                    max-width: 600px;
                }
                .grid-option, .pass-btn-custom {
                    padding: 15px !important;
                    font-size: 1.1rem !important;
                    cursor: pointer;
                    border-radius: 8px !important;
                    transition: all 0.2s;
                    color: #ffffff !important;
                    background-color: #3498db !important;
                    border: 2px solid #3498db !important;
                    width: 100%;
                    min-height: 60px;
                }
                .grid-option:hover, .pass-btn-custom:hover {
                    background-color: #ffffff !important;
                    color: #3498db !important;
                }
                .pass-container {
                    text-align: center;
                    margin: 10px auto;
                    max-width: 290px;
                }
            </style>
            <h3 style="text-align: center; color: #2c3e50;">${q.text}</h3>
            <div class="options-grid">
                ${q.options.map((opt) => `<button class="grid-option" onclick="logAndNext('${opt.replace(/'/g, "\\\\")}')">${opt}</button>`).join("")}
            </div>
            <div class="pass-container">
                <button class="pass-btn-custom" onclick="logAndNext('PASSED')">Pass</button>
            </div>
        `;
  }
}

function logAndNext(choice) {
  const level = currentVersionData.levels[currentLevelIndex];
  const audio = level.audios[currentAudioIndex];
  const q = audio.questions[currentQuestionIndex];

  listeningSessionData.push({
    level: level.level_id,
    track: audio.track_id,
    isCorrect: choice === "PASSED" ? false : choice.startsWith(q.answer),
  });

  const levelResults = listeningSessionData.filter(
    (d) => d.level === level.level_id,
  );
  if (levelResults.filter((d) => d.isCorrect).length >= 6) {
    handleLevelTransition();
    return;
  }
  if (levelResults.filter((d) => !d.isCorrect).length >= 5) {
    handleLevelDrop();
    return;
  }

  currentQuestionIndex++;
  if (currentQuestionIndex < audio.questions.length) {
    revealQuestion();
  } else {
    currentAudioIndex++;
    if (currentAudioIndex < level.audios.length) {
      loadAudio();
    } else {
      handleLevelTransition();
    }
  }
}

function moveToLevel(levelCode) {
  const newIndex = currentVersionData.levels.findIndex(
    (l) => l.level_id === levelCode,
  );
  if (newIndex !== -1) {
    currentLevelIndex = newIndex;
    currentAudioIndex = 0;
    loadAudio();
  }
}

function handleLevelTransition() {
  const levelID = currentVersionData.levels[currentLevelIndex].level_id;
  switch (levelID) {
    case "A1":
      processHandover("A1");
      break;
    case "A2":
      moveToLevel("B1");
      break;
    case "B1":
      processHandover("B1");
      break;
    case "B2":
      moveToLevel("C1");
      break;
    case "C1":
      moveToLevel("C2");
      break;
    case "C2":
      processHandover("C2");
      break;
  }
}

function handleLevelDrop() {
  const levelID = currentVersionData.levels[currentLevelIndex].level_id;
  switch (levelID) {
    case "C2":
      processHandover("C1");
      break;
    case "C1":
      processHandover("B2");
      break;
    case "B2":
      hasFailedB2 = true;
      moveToLevel("A2");
      break;
    case "B1":
      processHandover("A2");
      break;
    case "A2":
      moveToLevel("A1");
      break;
    case "A1":
      processHandover("Below A1");
      break;
  }
}

function processHandover(finalLevel) {
  const dossier = {
    studentName: studentName,
    audience: selectedAudience,
    listeningLevelReached: finalLevel,
    rawScores: listeningSessionData,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("placement_dossier", JSON.stringify(dossier));
  window.location.href = "grammar.html";
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
