document.addEventListener("DOMContentLoaded", () => {
  // 1. Fetch data from the local storage dossier
  const dossier = JSON.parse(localStorage.getItem("placement_dossier"));

  // --- 1.1 PERSONALIZATION LOGIC ---
  const nameDisplayEl = document.getElementById("student-name-display");
  if (nameDisplayEl && dossier && dossier.studentName) {
    // Personalizes the H1 header you just updated in report.html
    nameDisplayEl.innerText = `${dossier.studentName} `;
  }

  // Set current date in the header
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    dateEl.innerText = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (!dossier) {
    console.warn("No placement dossier found.");
    const summaryEl = document.getElementById("profile-summary");
    if (summaryEl)
      summaryEl.innerText =
        "No test data available. Please complete an assessment.";
    return;
  }

  // 2. Identify core scores and session history
  const lScore = dossier.listeningLevelReached || "N/A";
  const gScore = dossier.finalGrammarLevel || "N/A";
  const log = dossier.grammarSessionLog || [];

  // --- 3. REFINEMENT LOGIC FOR 4-TIER GRANULARITY ---
  let refinedLabel = gScore;

  if (log.length > 0) {
    const finalLevelQuestions = log.filter((q) => q.level === gScore);
    const correctInLevel = finalLevelQuestions.filter(
      (q) => q.isCorrect,
    ).length;
    const totalInLevel = finalLevelQuestions.length;
    const successRate = totalInLevel > 0 ? correctInLevel / totalInLevel : 0;

    // 4-Tier Logic (Level-, .1, .2, Level+)
    if (successRate < 0.25) {
      refinedLabel += gScore === "A1" ? ".1" : "-";
    } else if (successRate >= 0.25 && successRate < 0.5) {
      refinedLabel += ".1";
    } else if (successRate >= 0.5 && successRate < 0.8) {
      refinedLabel += ".2";
    } else {
      refinedLabel += "+";
    }
  }

  // Update the UI Placement Card
  document.getElementById("res-listening").innerText = lScore;
  document.getElementById("res-uoe").innerText = refinedLabel;
  document.getElementById("res-sublevel").innerText =
    dossier.lastSubLevel || "General Placement";

  // --- 4. DYNAMIC NEXT-LEVEL EXPLANATION ---
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  let currentIdx = levels.indexOf(gScore);
  let nextStepText = "";
  let nextLevel =
    currentIdx < levels.length - 1 ? levels[currentIdx + 1] : "Expert (C2+)";

  if (refinedLabel.includes("-") || refinedLabel.includes(".1")) {
    nextStepText = `Current Goal: Consolidation of ${gScore} core structures.`;
  } else {
    nextStepText = `Next Milestone: Progression toward ${nextLevel} proficiency.`;
  }

  const explanationEl = document.getElementById("placement-explanation");
  if (explanationEl) {
    explanationEl.innerText = nextStepText;
    explanationEl.style.fontWeight = "600";
    explanationEl.style.color = "#3498db";
  }

  // --- 5. OVERALL PROFILE SUMMARY ---
  const summaryEl = document.getElementById("profile-summary");

  // Define the hierarchy for comparison
  const cefrOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const lBase = lScore.substring(0, 2); // Get "B2" from "B2-"
  const gBase = gScore.substring(0, 2);

  const lIdx = cefrOrder.indexOf(lBase);
  const gIdx = cefrOrder.indexOf(gBase);

  let summaryText = "";

  // Case: Grammar is significantly higher than Listening
  if (gIdx > lIdx) {
    summaryText =
      `Your assessment reveals a profile where your grammatical understanding (${gScore}) is more advanced than your current listening comprehension (${lScore}). ` +
      `This is often common in learners who have studied in a formal academic setting. ` +
      `<strong>Recommendation:</strong> You require more consistent exposure to authentic audio—such as podcasts, films, and natural conversation—to allow your listening skills to catch up with your technical knowledge of the language.`;
  }
  // Case: Listening is higher than Grammar (The "Normal" Case)
  else if (lIdx > gIdx) {
    summaryText =
      `Your listening skills (${lScore}) are currently a primary strength, outpacing your technical use of grammar (${gScore}). ` +
      `This suggests a strong natural 'ear' for the language. To reach a higher overall CEFR band, we recommend focusing on the specific grammatical structures associated with ${gScore} to bring your productive accuracy in line with your comprehension.`;
  }
  // Case: Balanced
  else {
    summaryText = `Your profile is well-balanced across both receptive listening and technical Use of English. Both your listening and grammar are currently sitting within the  ${gScore} band, indicating a consistent development across different skill areas.`;
  }

  if (summaryEl) summaryEl.innerHTML = summaryText;

  // --- 6. ASSESSMENT PROFILE DEPTH LOGIC ---
  const confEl = document.getElementById("res-confidence");
  const confDesc = document.getElementById("confidence-desc");
  const lastEntry = log[log.length - 1];
  const isDefinitive = lastEntry && Math.abs(parseFloat(lastEntry.llr)) >= 2.94;

  if (log.length > 15 && isDefinitive) {
    confEl.innerText = "Comprehensive";
    confEl.style.color = "#27ae60";
    confDesc.innerHTML =
      "<strong>Extensive Mapping:</strong> This profile is based on a broad evidence base confirming a stable proficiency boundary.";
  } else if (log.length > 8) {
    confEl.innerText = "Standard";
    confEl.style.color = "#3498db";
    confDesc.innerHTML =
      "<strong>Core Mapping:</strong> Sufficient data was collected to identify a clear placement consistent with the CEFR band.";
  } else {
    confEl.innerText = "Initial";
    confEl.style.color = "#f39c12";
    confDesc.innerHTML =
      "<strong>Screener Profile:</strong> The placement was reached efficiently. Further classroom interaction will help refine this initial snapshot.";
  }

  // --- 7. PERFORMANCE BREAKDOWN LOGIC ---
  const masteryList = document.getElementById("list-mastery");
  const frontierList = document.getElementById("list-frontier");

  const cleanLabel = (raw) =>
    raw
      .replace(".3", " (Upper)")
      .replace(".2", " (Mid)")
      .replace(".1", " (Lower)")
      .replace("-", " (Foundational)");

  if (log.length > 0) {
    // Group logs by subLevel to calculate success rates
    const levelStats = {};
    log.forEach((entry) => {
      if (!levelStats[entry.subLevel])
        levelStats[entry.subLevel] = { correct: 0, total: 0 };
      levelStats[entry.subLevel].total++;
      if (entry.isCorrect) levelStats[entry.subLevel].correct++;
    });

    // 1. Mastered: Only levels with 70% accuracy or higher
    const mastered = Object.keys(levelStats)
      .filter((sub) => levelStats[sub].correct / levelStats[sub].total >= 0.7)
      .map((sub) => cleanLabel(sub))
      .slice(-3);

    // 2. Frontier: Levels with lower accuracy or the very last level attempted
    const frontier = Object.keys(levelStats)
      .filter((sub) => levelStats[sub].correct / levelStats[sub].total < 0.7)
      .map((sub) => cleanLabel(sub))
      .slice(0, 3);

    masteryList.innerHTML =
      mastered
        .map((item) => `<li><span style="color:#27ae60;">✓</span> ${item}</li>`)
        .join("") || `<li>Core ${gScore} structures mastered.</li>`;

    frontierList.innerHTML =
      frontier
        .map(
          (item) => `<li><span style="color:#e67e22;">🎯</span> ${item}</li>`,
        )
        .join("") || `<li>Developing ${gScore} complexity.</li>`;
  }
}); // This correctly closes the DOMContentLoaded listener

function closeReport() {
  localStorage.clear();
  sessionStorage.clear();
  window.close();
  setTimeout(() => {
    window.location.href = "https://www.google.com";
  }, 200);
}