/**
 * grammar.js - Finalized Logic and Syntax
 */

let placementDossier = null;
let currentAudience = null;
let currentLevel = null;
let currentLevelSuffix = "-"; // Track the current suffix globally
let allQuestionsData = null;
let currentQuestions = [];
let currentQuestionIndex = 0;

let logLikelihoodRatio = 0.0;
const BOUNDARY_A = 1.5;
const BOUNDARY_B = -1.5;
const LLR_CORRECT = 0.47;
const LLR_INCORRECT = -0.91;

const SUB_LEVEL_LADDER = [
  "A1-",
  "A1.1",
  "A1.2",
  "A1.2+",
  "A2-",
  "A2.1",
  "A2.2",
  "A2.2+",
  "B1-",
  "B1.1",
  "B1.2",
  "B1.2+",
  "B2-",
  "B2.1",
  "B2.2",
  "B2.2+",
  "C1-",
  "C1.1",
  "C1.2",
  "C1.2+",
  "C2-",
  "C2.1",
  "C2.2",
  "C2.2+",
];

let grammarSessionLog = [];

window.onload = function () {
  const savedData = localStorage.getItem("placement_dossier");
  if (!savedData) {
    window.location.href = "index.html";
    return;
  }
  placementDossier = JSON.parse(savedData);
  currentAudience = placementDossier.audience;

  // MAP STARTING POINT: One step lower than Listening
  const listeningResult = placementDossier.listeningLevelReached || "B2";

  const startMapping = {
    A1: "A1-",
    A2: "A1.2+", // One step below A2-
    B1: "A2.2+", // One step below B1-
    B2: "B1.2+", // One step below B2-
    C1: "B2.2+", // One step below C1-
    C2: "C1.2+", // One step below C2-
  };

  currentLevel = startMapping[listeningResult] || "B1.2+";

  // Update internal trackers to match the mapping
  const match = currentLevel.match(/^([A-C][1-2])(.*)$/);
  if (match) {
    currentLevel = match[1];
    currentLevelSuffix = match[2];
  }

  console.log(
    `Handshake Successful: Listening was ${listeningResult}. Grammar starting at ${currentLevel}${currentLevelSuffix}`,
  );
};

async function startGrammarTest() {
  try {
    const response = await fetch("data/questions_uoe.json");
    allQuestionsData = await response.json();

    document
      .getElementById("welcomeScreen")
      .style.setProperty("display", "none", "important");
    document
      .getElementById("testScreen")
      .style.setProperty("display", "flex", "important");

    transitionToState(currentLevel + currentLevelSuffix);
  } catch (error) {
    console.error("Data Load Error:", error);
  }
}

function loadLevelQuestions(subLevelKey) {
  const dataBlock = allQuestionsData[currentAudience];
  currentQuestions = dataBlock ? dataBlock[subLevelKey] : [];

  if (!currentQuestions || currentQuestions.length === 0) {
    console.warn("No questions found for sub-level:", subLevelKey);
    finalizeTest();
    return;
  }
  showQuestion();
}

function showQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  if (!q) {
    finalizeTest();
    return;
  }

  const container = document.getElementById("testUI");
  const optionsHTML = q.options
    .map(
      (opt) =>
        `<button class="option-btn" onclick="handleAnswer('${opt.replace(/'/g, "\\'")}')">${opt}</button>`,
    )
    .join("");

  container.innerHTML = `
    <div style="text-align: center; max-width: 700px; margin: 0 auto;">
    <p style="color: #3498db; font-weight: 600; margin-bottom: 10px;">
            Click the right answer to fill the gap. You can click the Pass button if you don't know the answer.
        </p>
        <p style="color: #7f8c8d;">SECTION 2: USE OF ENGLISH</p>
        <h2 style="margin: 20px 0 40px;">${q.text}</h2>
        <div class="options-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">${optionsHTML}</div>
       <button class="option-btn" style="margin-top: 20px;" onclick="handleAnswer(null)">Pass</button>
    </div>
  `;
}

function handleAnswer(choice) {
  const q = currentQuestions[currentQuestionIndex];
  const isCorrect = choice ? choice.trim().startsWith(q.answer) : false;
  logLikelihoodRatio += isCorrect ? LLR_CORRECT : LLR_INCORRECT;

  // DEBUG LOG:
  console.log(`--- DEBUG TRACE ---`);
  console.log(
    `Level: ${currentLevel}${currentLevelSuffix} | Q#: ${currentQuestionIndex + 1}/${currentQuestions.length}`,
  );
  console.log(`Question: "${q.text}"`);
  console.log(`Response: ${choice || "PASS"} | Correct: ${isCorrect}`);
  console.log(
    `New LLR: ${logLikelihoodRatio.toFixed(2)} | Boundary: ${BOUNDARY_A}/${BOUNDARY_B}`,
  );

  grammarSessionLog.push({
    level: currentLevel,
    subLevel: currentLevel + currentLevelSuffix,
    isCorrect: isCorrect,
    llr: logLikelihoodRatio,
    userResponse: choice || "PASSED",
    timestamp: Date.now(), 
  });

  if (logLikelihoodRatio >= BOUNDARY_A) {
    handleLevelUp();
  } else if (logLikelihoodRatio <= BOUNDARY_B) {
    handleLevelDown();
  } else {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
      showQuestion();
    } else {
      // CHOICE B: Climb if positive score, otherwise end.
      if (logLikelihoodRatio > 0) {
        handleLevelUp();
      } else {
        finalizeTest();
      }
    }
  }
}

function handleLevelUp() {
  let currentFull = currentLevel + currentLevelSuffix;
  let idx = SUB_LEVEL_LADDER.indexOf(currentFull);

  // CLIMB LOGIC: If there is a next rung, take it.
  if (idx >= 0 && idx < SUB_LEVEL_LADDER.length - 1) {
    console.log(`Advancing: ${currentFull} -> ${SUB_LEVEL_LADDER[idx + 1]}`);
    transitionToState(SUB_LEVEL_LADDER[idx + 1]);
  } else {
    // Reached C2.2+
    finalizeTest();
  }
}

function handleLevelDown() {
  let currentFull = currentLevel + currentLevelSuffix;
  let idx = SUB_LEVEL_LADDER.indexOf(currentFull);

  // 1. Identify the "Anchor" levels (the starts of CEFR bands)
  const anchors = ["C1.1", "B2.1", "B1.1", "A2.1", "A1.1"];

  // 2. Find the next logical anchor below the current level
  let nextAnchor = null;
  for (let anchor of anchors) {
    if (SUB_LEVEL_LADDER.indexOf(anchor) < idx) {
      nextAnchor = anchor;
      break;
    }
  }

  // 3. If an anchor exists below AND user hasn't already passed a level, drop down
  // Check if they've passed anything by seeing if 'highestPassed' would still be 'A1-'
  const hasPassedAnything = grammarSessionLog.some((log) => {
    const rungLogs = grammarSessionLog.filter(
      (l) => l.subLevel === log.subLevel,
    );
    return rungLogs[rungLogs.length - 1].llr > 0;
  });

  if (nextAnchor && !hasPassedAnything) {
    console.log(
      `Soft Landing: Failed ${currentFull}, dropping to anchor ${nextAnchor}`,
    );
    transitionToState(nextAnchor);
  } else {
    // If there are no more anchors, or they already established a "high water mark"
    // and are now just failing a higher level, stop.
    console.log("No further levels to test or floor reached. Finalizing.");
    finalizeTest();
  }
}

function transitionToState(stateName) {
  const targetLevelPrefix = stateName.split(/[.\-+]/)[0];

  // Update internal tracking
  const match = stateName.match(/^([A-C][1-2])(.*)$/);
  if (match) {
    currentLevel = match[1];
    currentLevelSuffix = match[2]; // e.g., ".1"
    currentQuestionIndex = 0; // Always reset for new JSON key
    logLikelihoodRatio = 0.0;
    loadLevelQuestions(stateName);
  }
}

function finalizeTest() {
  // AWARD LOGIC: Find the highest sub-level ending with a positive score
  let highestPassed = "A1-";

  SUB_LEVEL_LADDER.forEach((rung) => {
    const rungLogs = grammarSessionLog.filter((l) => l.subLevel === rung);
    if (rungLogs.length > 0) {
      const finalLLR = rungLogs[rungLogs.length - 1].llr;
      // If the LLR ended above 0, they passed this rung
      if (finalLLR > 0) highestPassed = rung;
    }
  });

  placementDossier.grammarSessionLog = grammarSessionLog;
  placementDossier.finalGrammarLevel = highestPassed; // Award the best pass
  placementDossier.lastSubLevel = currentLevel + currentLevelSuffix;
  placementDossier.studentName = placementDossier.studentName || "Guest";

  localStorage.setItem("placement_dossier", JSON.stringify(placementDossier));

  const resultsScreen = document.getElementById("resultsReadyScreen");
  const testScreen = document.getElementById("testScreen");

  if (testScreen) testScreen.style.setProperty("display", "none", "important");
  if (resultsScreen) {
    resultsScreen.style.setProperty("display", "flex", "important");
  }
} 

/**
 * Navigates the student to the final report page.
 */
function goToReport() {
  window.location.href = "report.html";
}
