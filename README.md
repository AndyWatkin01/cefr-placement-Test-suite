# CEFR Adaptive English Placement Suite

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/AndyWatkin01/cefr-placement-Test-suite)

An intelligent, multi-stage assessment tool designed to accurately place English language learners within the **Common European Framework of Reference for Languages (CEFR)**.



## 🚀 Overview
The application uses a coordinated three-stage process to evaluate a student's proficiency. It moves beyond static testing by employing a Bayesian-inspired adaptive engine that reacts to student performance in real-time.

### The Three-Stage Handshake
1.  **Data Initialization:** Collects student metadata (name, target audience) and initializes a `placement_dossier` in `localStorage` to serve as the single source of truth across all modules.
2.  **Listening Baseline:** Establishes an initial CEFR anchor (e.g., B2) based on receptive audio comprehension.
3.  **Adaptive Use of English:** A dynamic grammar assessment that "hunts" for the student's proficiency boundary by adjusting question difficulty based on accuracy.

---

## 🧠 Technical Engine: Adaptive Logic
The core of the system is the `grammar.js` engine, which utilizes a **Log-Likelihood Ratio (LLR)** to determine level transitions.

### Scoring Mechanics
- **Correct Answer:** `+0.47` LLR.
- **Incorrect/Passed Answer:** `-0.91` LLR.
- **Confidence Boundaries:** - **Climb (Boundary A):** Hitting `+1.5` triggers an immediate move to a higher sub-level.
    - **Drop (Boundary B):** Hitting `-1.5` triggers a level drop.

### Branching & The "Mega-Drop"
To ensure efficiency, the app includes "Entry Point Drop" logic. If a student fails significantly at their starting level (established by the listening test), the app triggers a major jump (e.g., B-levels down to A2-) to find a stable baseline quickly.



---

## 📊 Reporting & Pedagogical Analysis
The `report.js` module translates raw data into a student-facing profile.

### Key Features:
* **4-Tier Granularity:** Refines broad CEFR levels into sub-steps (`-`, `.1`, `.2`, `+`) based on final success rates.
* **Asynchronous Advice:** Automatically compares Listening vs. Grammar scores. If a significant gap exists, it provides tailored advice (e.g., recommending "authentic audio exposure" for students with high technical grammar but low comprehension).
* **Result Confidence:** Categorizes the report as *Initial*, *Standard*, or *Comprehensive* based on the volume of data collected and the mathematical stability of the final boundary.

---

## 🛠 Project Structure
* `grammar.html / .js`: The adaptive testing environment.
* `report.html / .js`: The data visualization and results engine.
* `styles.css`: Centralized styling for the assessment UI and professional report layout.
* `data/questions_uoe.json`: The hierarchical question bank organized by CEFR levels.

---

## 📥 PDF Generation & Print Logic
The report includes a specialized `@media print` CSS layer. When "Print Full Report" is selected, the system:
* Removes the navigation sidebars and interactive buttons.
* Re-centers the content for a clean, certificate-style A4 layout.
* Preserves the dynamic pedagogical advice and branding.



---

## 🛠 Future Roadmap
- **Cognitive Load Integration:** Implementing tracking for response times to factor mental effort into the placement confidence score.
- **Expanded Question Banks:** Increasing the depth of C1/C2 "Use of English" items.
- **Enhanced Visuals:** Integrating progress tracking charts directly into the student dashboard.

---

**Contact:** [anthony.watkin01@gmail.com](mailto:anthony.watkin01@gmail.com)

---

## ⚖️ License

This project is dual-licensed to balance software flexibility with pedagogical integrity:

* **Software & Logic:** The underlying code (JavaScript, HTML, CSS) is licensed under the **MIT License**.
* **Assessment Content:** All test questions, audio transcripts, validation reports, and pedagogical documentation are licensed under **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

*Copyright (c) 2026. All rights reserved.*
