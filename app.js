// ==================== GLOBAL STATE ====================
let fullTestData = null;
let baselineData = null;
let currentVersionData = null;
let selectedAudience = null;
let currentLevelIndex = 3; // Starts at B2
let currentAudioIndex = 0;
let currentQuestionIndex = 0;

let studentName = "Guest";
let listeningSessionData = [];
let baselineSessionData = [];
let audioPlayCount = 0;
let questionStartTime = 0;

let isAudioUnlocked = false;
let isBaselineMode = true; // Start in calibration mode
let hasFailedB2 = false;

// ==================== INITIALIZATION ====================
async function initTest() {
  try {
    // 1. Load Calibration Data
    const baseResponse = await fetch("data/baseline.json");
    if (!baseResponse.ok) throw new Error("Could not find data/baseline.json");
    baselineData = await baseResponse.json();

    // 2. Load Main Test Data
    const response = await fetch("data/questions.json");
    if (!response.ok) throw new Error("Could not find data/questions.json.");
    fullTestData = await response.json();

    // Shuffle main questions
    fullTestData.versions.forEach((v) => {
      v.levels.forEach((l) => {
        l.audios.forEach((a) => shuffleArray(a.questions));
      });
    });

    console.log("Initialization Successful: Baseline and Main data loaded.");
  } catch (error) {
    console.error("Initialization Failed:", error);
  }
}

document.addEventListener("DOMContentLoaded", initTest);

// ==================== NAVIGATION & UI ====================
function showScreen(screenId) {
  const screens = document.querySelectorAll(".screen");
  const layout = document.querySelector(".welcome-layout");
  const sidebar = document.querySelector(".welcome-sidebar");
  const mainContent = document.querySelector(".welcome-main");

  // 1. Toggle Sidebar and Layout Widths via Inline Styles
  if (screenId === "welcome-screen") {
    // Show Sidebar
    if (sidebar) sidebar.style.display = "flex";
    // Reset Main Content width
    if (mainContent) {
      mainContent.style.flex = "1";
      mainContent.style.width = "auto";
    }
  } else {
    // Hide Sidebar
    if (sidebar) sidebar.style.display = "none";
    // Force Main Content to fill 100% of the screen
    if (mainContent) {
      mainContent.style.flex = "1 1 100%";
      mainContent.style.width = "100%";
    }
  }

  // 2. Switch Screens
  screens.forEach((s) => {
    s.style.setProperty("display", "none", "important");
    s.classList.remove("active");
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.style.setProperty("display", "flex", "important");
    target.classList.add("active");
  }
}

function selectAudience(audienceKey) {
  if (!fullTestData) return;
  selectedAudience = audienceKey;
  console.log("Audience Selected: " + audienceKey);
  currentVersionData = fullTestData.versions.find((v) =>
    v.audience.toLowerCase().includes(audienceKey),
  );
  if (currentVersionData) showScreen("confirm-screen");
}

function startAssessment() {
  const nameInput = document.getElementById("studentName");
  studentName = nameInput ? nameInput.value.trim() || "Guest" : "Guest";
  showScreen("test-screen");
  loadAudio();
}

// ==================== CORE TEST LOGIC ====================
function loadAudio() {
  let audio;

  if (isBaselineMode) {
    audio = baselineData.questions[currentAudioIndex];
  } else {
    const level = currentVersionData.levels[currentLevelIndex];
    audio = level.audios[currentAudioIndex];
  }

  currentQuestionIndex = 0;
  audioPlayCount = 0;
  isAudioUnlocked = false;

  const ui = document.getElementById("testUI");
  ui.innerHTML = `
    <div class="welcome-content">
        <p style="color: #e67e22; font-weight: 600; margin-bottom: 10px;">
            ${
              isBaselineMode
                ? "SYSTEM CALIBRATION: Please listen to these short clips to calibrate audio levels and response timing."
                : "Click the right answer. You can click the Pass button if you don't know the answer."
            }
        </p>
        <h2 style="color: #2c3e50; margin-bottom: 10px;">
            ${isBaselineMode ? "Audio & Speed Sync" : "Listening Assessment"}
        </h2>
        
        <p style="margin-bottom: 15px;"><strong>Scenario:</strong> ${audio.scenario}</p>
        
        <button id="playBtn" class="btn start-btn" onclick="playAudio()">
            ${isBaselineMode ? "▶ RUN SYNC" : "▶ PLAY AUDIO"}
        </button>

        <audio id="mainAudio" style="display: none;">
            <source src="audio/${audio.track_id}.mp3" type="audio/mpeg">
        </audio>

        <div id="dynamic-test-area" style="margin-top: 10px; width: 100%;">
            <p class="status-badge" style="background:#7f8c8d; color:white; padding: 10px; border-radius: 5px;">
                ${isBaselineMode ? "Awaiting calibration..." : "Please listen to unlock questions."}
            </p>
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
  const audioEl = document.getElementById("mainAudio");
  if (audioEl) {
    audioEl.play();
    audioPlayCount++;
  }
}

function revealQuestion() {
  let audio, q;

  if (isBaselineMode) {
    audio = baselineData.questions[currentAudioIndex];
    q = audio;
  } else {
    const level = currentVersionData.levels[currentLevelIndex];
    audio = level.audios[currentAudioIndex];
    q = audio.questions[currentQuestionIndex];
  }

  questionStartTime = Date.now();

  const container = document.getElementById("dynamic-test-area");
  if (container) {
    container.innerHTML = `
            <style>
                .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px auto; max-width: 600px; }
                .grid-option, .pass-btn-custom {
                    padding: 15px !important; font-size: 1.1rem !important; cursor: pointer; border-radius: 8px !important;
                    transition: all 0.2s; color: #ffffff !important; background-color: #3498db !important;
                    border: 2px solid #3498db !important; width: 100%; min-height: 60px;
                }
                .grid-option:hover, .pass-btn-custom:hover { background-color: #ffffff !important; color: #3498db !important; }
                .pass-container { text-align: center; margin: 10px auto; max-width: 290px; }
            </style>
            <h3 style="text-align: center; color: #2c3e50;">${q.text}</h3>
            <div class="options-grid">
                ${q.options.map((opt) => `<button class="grid-option" onclick="logAndNext('${opt.replace(/'/g, "\\\\")}')">${opt}</button>`).join("")}
            </div>
            ${
              !isBaselineMode
                ? `
            <div class="pass-container">
                <button class="pass-btn-custom" onclick="logAndNext('PASSED')">Pass</button>
            </div>`
                : ""
            }
        `;
  }
}

function logAndNext(choice) {
  const responseTime = Date.now() - questionStartTime;

  if (isBaselineMode) {
    baselineSessionData.push({
      track: baselineData.questions[currentAudioIndex].track_id,
      responseTime: responseTime,
      playCount: audioPlayCount,
    });

    currentAudioIndex++;

    if (currentAudioIndex < baselineData.questions.length) {
      loadAudio();
    } else {
      const samples = baselineSessionData.slice(1);
      const sum = samples.reduce((acc, curr) => acc + curr.responseTime, 0);
      window.calculatedBaseRT = sum / samples.length;

      isBaselineMode = false;
      console.log(
        "Calibration Finished. Base RT: " + window.calculatedBaseRT + "ms",
      );
      currentAudioIndex = 0;
      currentLevelIndex = 3;

      startMainTestTransition();
    }
  } else {
    const level = currentVersionData.levels[currentLevelIndex];
    const audio = level.audios[currentAudioIndex];
    const q = audio.questions[currentQuestionIndex];

    listeningSessionData.push({
      level: level.level_id,
      track: audio.track_id,
      isCorrect: choice === "PASSED" ? false : choice.startsWith(q.answer),
      responseTime: responseTime,
      playCount: audioPlayCount,
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
}

function startMainTestTransition() {
  const ui = document.getElementById("testUI");
  let timeLeft = 5;

  const timerInterval = setInterval(() => {
    ui.innerHTML = `
      <div class="welcome-content" style="text-align: center; padding: 40px;">
        <div style="font-size: 3rem; margin-bottom: 20px;">✅</div>
        <h2 style="color: #27ae60; margin-bottom: 10px;">Calibration Complete</h2>
        <p style="font-size: 1.2rem; color: #2c3e50;">Great! Your personalized baseline is set.</p>
        <hr style="width: 50%; margin: 20px auto; border: 0; border-top: 1px solid #ddd;">
        <p style="text-transform: uppercase; letter-spacing: 1px; color: #7f8c8d;">The Listening Assessment begins in:</p>
        <div style="font-size: 4rem; font-weight: bold; color: #3498db; margin: 20px 0;">${timeLeft}</div>
        <p style="font-style: italic; color: #95a5a6;">Get ready to listen carefully...</p>
      </div>
    `;
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(timerInterval);
      loadAudio();
    }
  }, 1000);
}

// ==================== LEVEL MANAGEMENT ====================
function moveToLevel(levelID) {
  const index = currentVersionData.levels.findIndex(
    (l) => l.level_id === levelID,
  );
  if (index !== -1) {
    currentLevelIndex = index;
    currentAudioIndex = 0;
    currentQuestionIndex = 0;
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
  console.log(
    "Listening Finished. Final Level: " + finalLevel + ". Moving to Grammar.",
  );
  const dossier = {
    studentName: studentName,
    audience: selectedAudience,
    listeningLevelReached: finalLevel,
    listeningBaseRT: window.calculatedBaseRT || 0,
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
