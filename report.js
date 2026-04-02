document.addEventListener("DOMContentLoaded", () => {
  const dossier = JSON.parse(localStorage.getItem("placement_dossier"));
  if (!dossier) return;

  // Header Data
  document.getElementById("student-name-display").innerText =
    dossier.studentName || "Student";
  document.getElementById("current-date").innerText =
    "Report Dated: " + new Date().toLocaleDateString();
  document.getElementById("res-listening").innerText =
    dossier.listeningLevelReached || "N/A";
  document.getElementById("res-uoe").innerText =
    dossier.finalGrammarLevel || "N/A";

  const diag = dossier.diagnosticProfile;
  if (!diag) return;

  // Cognitive Analysis
  document.getElementById("profile-title").innerText = diag.name;
  document.getElementById("pedagogical-rec").innerText = diag.rec;

  // Mental Effort
  const effortScore = diag.effort.score;
  document.getElementById("load-value").innerText =
    "● ".repeat(effortScore) + "○ ".repeat(5 - effortScore);

  let effortTxt = "";
  if (effortScore <= 2) effortTxt = "Low: Fluent/Automatic";
  else if (effortScore === 3) effortTxt = "Moderate: Requires focus";
  else effortTxt = "High: Cognitive Ceiling";
  document.getElementById("effort-label").innerText = effortTxt;

  // Style
  document.getElementById("style-icon").innerText = diag.style.icon;
  document.getElementById("style-label").innerText = diag.style.label;

  // Stability
  document.getElementById("stability-icon").innerText = diag.stability.icon;
  document.getElementById("stability-value").innerText = diag.stability.label;
});
