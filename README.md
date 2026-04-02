
# CEFR Adaptive English Placement Suite (Beta)

**[🔗 View Live Application](https://andywatkin01.github.io/cefr-placement-Test-suite/)**

## 🌟 For Teachers & Students: Why use this app?

**What is it?** This app is a smart English level test that goes beyond just "right or wrong" answers. It acts like a digital tutor that adjusts the difficulty of the test in real-time based on how you are performing.

**How it works:** 1.  **A Listening Head-Start:** You start with a listening task to find your general "ballpark" level (e.g., Intermediate or Advanced).
2.  **A Tailored Grammar Test:** The app then sets a grammar test specifically for that level.
3.  **The "Soft Landing":** If the test starts too hard, the app won't just "fail" you. It is designed to "catch" you and automatically drop the difficulty until it finds the level where you are most comfortable.

**The Benefit:** * **For Students:** You get a much more accurate result than a standard test, and you won't feel overwhelmed by questions that are far too difficult.
* **For Teachers:** You get a "Placement Dossier" that doesn't just give a grade (like B1), but explains *how* the student processes English—showing you if they are ready for the next level or if their knowledge is still a bit "shaky".

---

## 🧠 For Pedagogical Experts: Cognitive Load & Adaptive Logic

This suite distinguishes itself from traditional linear assessments by focusing on **Learner State** and **Processing Fluency**.

### Adaptive Handshake & Anchor Levels
The system utilizes a "Handshake" protocol between receptive (listening) and productive (grammar) modules. The Grammar engine initializes at **one sub-level below** the established listening baseline to verify the student's "Active" vs. "Passive" knowledge gap. If a student struggles at this entry point, the **Iterative Dropping** mechanism triggers, moving the student to the next lower "Anchor Level" (e.g., B2.1 → B1.1) to find a stable baseline without exhausting the student’s testing stamina.

### Cognitive Load Analysis
The `diagnostic-engine.js` monitors the "Hidden Costs" of a student's performance:
* **Mental Effort (Strain):** By calculating response times against the expected difficulty of a CEFR level, the app identifies students who may be accurate but lack the **automaticity** required for higher-level communication.
* **Audio Dependency:** Tracking "Playback Counts" reveals if a student’s listening level is reliant on repetition (High Dependency) or represents natural, real-time comprehension.
* **Stability vs. Fragility:** The final report differentiates between a "Stable" level (fast, accurate responses) and a "Fragile" level (accurate but slow/strained), helping teachers decide if a student needs remedial support or a faster-paced curriculum.

---

## 💻 For Developers: Technical Architecture & LLR Engine

### Bayesian-Inspired Scoring (LLR)
The core of the `grammar.js` engine is a **Log-Likelihood Ratio (LLR)** model. This moves away from percentage-based scoring to a confidence-based transition system:
* **Weighting:** Correct answers increment LLR by `+0.47`, while incorrect answers or "Passes" decrement it by `-0.91`.
* **State Transitions:** Promotions ("Climb") or demotions ("Drop") are only triggered when the cumulative LLR hits a boundary of **±1.5**. This ensures a statistically significant confidence level before the difficulty shifts.

### Layout & PDF Generation
The application uses a dual-layer CSS strategy to handle the transition from a web app to a professional PDF dossier:
* **Flexbox Decoupling:** On-screen, the app uses a fixed-sidebar `100vh` flexbox layout.
* **Print Engine (@media print):** When the print command is triggered, the engine forces a `display: block` override and resets heights to `auto`. This allows the browser to respect `page-break-before: always` rules for the Grammar section and `break-inside: avoid` for result cards, ensuring clean A4 report generation without content clipping.

### Data Persistence
A single `placement_dossier` object in `localStorage` acts as the source of truth, updated via a series of state transitions across the listening, grammar, and diagnostic modules before being purged upon session completion.

