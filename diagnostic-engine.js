/**
 * diagnostic-engine.js - Full Schema Implementation
 * Translates raw session logs into "Three Questions" Pedagogical Insights.
 * Now includes Listening Cognitive Load and Unified Recommendations.
 */

const runDiagnosticAnalysis = (dossier) => {
  if (!dossier) return dossier;

  let listeningScore = 0; // To track for unified recommendation

  // ==================== SECTION 1: LISTENING ANALYSIS ====================
  if (dossier.rawScores && dossier.listeningBaseRT) {
    const lBaseRT = dossier.listeningBaseRT;
    const correctListening = dossier.rawScores.filter((item) => item.isCorrect);

    const avgListeningRT =
      correctListening.length > 0
        ? correctListening.reduce((acc, curr) => acc + curr.responseTime, 0) /
          correctListening.length
        : 0;

    const lRatio = avgListeningRT / (lBaseRT || 1);

    const totalPlays = dossier.rawScores.reduce(
      (acc, curr) => acc + curr.playCount,
      0,
    );
    const avgPlays = totalPlays / dossier.rawScores.length;

    let lEffort = {
      score: 1,
      label: "Level Automaticity",
      visual: "● ○ ○ ○ ○",
      interpretation:
        "The student decodes speech at this level instantly. They have 'spare capacity' to notice tone or background details.",
    };
    if (lRatio > 2.5)
      lEffort = {
        score: 5,
        label: "Cognitive Ceiling",
        visual: "● ● ● ● ●",
        interpretation:
          "The student is at their absolute limit for this level. Any increase in speed or noise would likely cause a breakdown in understanding.",
      };
    else if (lRatio > 2.0)
      lEffort = {
        score: 4,
        label: "High Cognitive Load",
        visual: "● ● ● ● ○",
        interpretation:
          "To understand this level, the student is 'laboring.' They may be focusing so hard on words that they miss the overall meaning.",
      };
    else if (lRatio > 1.5)
      lEffort = {
        score: 3,
        label: "Conscious Effort",
        visual: "● ● ● ○ ○",
        interpretation:
          "The student can follow the audio, but it requires full concentration. They may feel tired after long periods of listening.",
      };
    else if (lRatio > 1.2)
      lEffort = {
        score: 2,
        label: "Level Fluency",
        visual: "● ● ○ ○ ○",
        interpretation:
          "Processing is smooth. The student understands the language at this level without needing to consciously translate in their head.",
      };

    listeningScore = lEffort.score;

    // --- PROCESSING DELAY LOGIC ---
    let lRatioLabel = "Level-Matched Speed";
    let lRatioDesc =
      "The student processes language at this level at near-native speed. They can keep up with natural-paced conversations in this range.";

    if (lRatio > 2.0) {
      lRatioLabel = "Speed Overload";
      lRatioDesc =
        "The decoding delay is so high that the student cannot keep up with continuous speech at this level without frequent pauses.";
    } else if (lRatio > 1.5) {
      lRatioLabel = "Delayed Decoding";
      lRatioDesc =
        "The student needs extra time to translate this level of speech. They often miss the start of a new sentence while still processing the last one.";
    } else if (lRatio > 1.2) {
      lRatioLabel = "Processing Lag";
      lRatioDesc =
        "There is a slight delay in decoding at this level. In a group setting, they may struggle to respond before the topic changes.";
    }

    // --- AUDIO DEPENDENCY LOGIC ---
    let lPlayLabel = "Single-Pass Mastery";
    let lPlayDesc =
      "The student understands language at this level on the first hearing. They do not need repetition to grasp the main message.";

    if (avgPlays > 2.0) {
      lPlayLabel = "High Audio Strain";
      lPlayDesc =
        "The student requires multiple replays to decode the meaning at this level. This suggests the sounds aren't yet 'sticking' on the first try.";
    } else if (avgPlays > 1.5) {
      lPlayLabel = "Repetition Dependent";
      lPlayDesc =
        "The student often needs to hear the audio twice to feel confident at this level. They may struggle with 'one-shot' instructions.";
    } else if (avgPlays > 1.1) {
      lPlayLabel = "High Reliability";
      lPlayDesc =
        "The student occasionally checks details but generally trusts their first impression of the audio at this level.";
    }

    // --- SYNTHESIZED LISTENING OBSERVATION ---
    const lRatioScore = lRatio > 2.0 ? 4 : lRatio > 1.5 ? 3 : 2;
    const lPlayScore = avgPlays > 2.0 ? 4 : avgPlays > 1.5 ? 3 : 2;
    const maxListenScore = Math.max(lEffort.score, lRatioScore, lPlayScore);

    let lObsTitle = "Aural Mastery";
    let lObsDesc =
      "At this level, the student's listening is highly efficient. They have reached the automaticity needed to handle faster speech or more complex audio at the next CEFR stage.";

    if (maxListenScore >= 5) {
      lObsTitle = "Aural Overload";
      lObsDesc =
        "The audio at this level is currently too fast or complex for the student to decode reliably. Continued exposure without a lower-level 'safety net' may lead to frustration.";
    } else if (maxListenScore >= 4) {
      lObsTitle = "Aural Strain";
      lObsDesc =
        "Listening at this level is currently a struggle. While they may know the words, they cannot process them fast enough. Prioritize ear-training at this level.";
    } else if (maxListenScore >= 3) {
      lObsTitle = "Aural Observation";
      lObsDesc =
        "The student understands this level of audio, but it is 'expensive' for their brain. They should stay at this level to build listening stamina before moving up.";
    }

    dossier.listeningDiagnostic = {
      effort: lEffort,
      ratioProfile: { label: lRatioLabel, interpretation: lRatioDesc },
      playProfile: { label: lPlayLabel, interpretation: lPlayDesc },
      observation: { title: lObsTitle, desc: lObsDesc },
      metrics: {
        loadRatio: lRatio.toFixed(2),
        playbackStrain: avgPlays.toFixed(1),
      },
    };
  }

  // ==================== SECTION 2: GRAMMAR ANALYSIS ====================
  if (!dossier.grammarSessionLog || dossier.grammarSessionLog.length === 0) {
    return dossier;
  }

  const log = dossier.grammarSessionLog;
  const finalLevel = dossier.finalGrammarLevel;

  const ladder = [
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
  const finalIdx = ladder.indexOf(finalLevel);

  const processed = log.map((e, i) => {
    const rt = i === 0 ? 4 : (e.timestamp - log[i - 1].timestamp) / 1000;
    const levelIdx = ladder.indexOf(e.subLevel);
    let zone = "Other";
    if (levelIdx === finalIdx) zone = "Z0";
    else if (levelIdx < finalIdx && levelIdx >= finalIdx - 4) zone = "Baseline";
    return { ...e, rt, zone };
  });

  const baseItems = processed.filter(
    (e) => e.zone === "Baseline" && e.isCorrect,
  );
  const z0Items = processed.filter((e) => e.zone === "Z0" && e.isCorrect);

  const baseRT =
    baseItems.reduce((a, b) => a + b.rt, 0) / (baseItems.length || 1);
  const z0RT = z0Items.reduce((a, b) => a + b.rt, 0) / (z0Items.length || 1);
  const ratio = z0RT / (baseRT || 1);

  const totalWrong = processed.filter((e) => !e.isCorrect).length;
  const fastWrong = processed.filter(
    (e) => !e.isCorrect && e.rt < baseRT * 0.85,
  ).length;
  const impulsivityIndex = totalWrong > 0 ? fastWrong / totalWrong : 0;

  let effort = {
    score: 1,
    label: "Level Automaticity",
    visual: "● ○ ○ ○ ○",
    interpretation: `Grammar at ${finalLevel} is 'second nature.' The student can focus entirely on meaning rather than mechanics.`,
  };

  if (ratio > 2.1) {
    effort = {
      score: 5,
      label: "Cognitive Ceiling",
      visual: "● ● ● ● ●",
      interpretation: `The student is at their absolute limit for ${finalLevel}. Accuracy here requires total concentration, leaving no room for flow.`,
    };
  } else if (ratio > 1.7) {
    effort = {
      score: 4,
      label: "High Cognitive Load",
      visual: "● ● ● ● ○",
      interpretation: `The student is 'laboring' to apply ${finalLevel} rules. They likely have to stop and think consciously before forming sentences.`,
    };
  } else if (ratio > 1.4) {
    effort = {
      score: 3,
      label: "Conscious Effort",
      visual: "● ● ● ○ ○",
      interpretation: `${finalLevel} rules are understood but not yet automated. Accurate production is possible but feels 'expensive' for the brain.`,
    };
  } else if (ratio > 1.1) {
    effort = {
      score: 2,
      label: "Level Fluency",
      visual: "● ● ○ ○ ○",
      interpretation: `Processing is smooth. The student retrieves ${finalLevel} structures quickly enough to maintain a conversation.`,
    };
  }

  let style = {
    label: "Balanced",
    icon: "⚖️",
    desc: "A measured approach, showing a healthy balance between grammatical thought and response speed.",
  };
  if (impulsivityIndex > 0.6) {
    style = {
      label: "Quick / Impulsive",
      icon: "🐇",
      desc: "Relies on intuition or rapid retrieval. Speed is high, but check if accuracy is being sacrificed for pace.",
    };
  } else if (baseRT > 9) {
    style = {
      label: "Careful / Cautious",
      icon: "🐢",
      desc: "Prioritizes accuracy above all else. The student uses significant time to consciously 'build' every sentence.",
    };
  }

  const earlyRT =
    processed
      .slice(0, Math.min(3, processed.length))
      .reduce((a, b) => a + b.rt, 0) / 3;
  const lateRT = processed.slice(-3).reduce((a, b) => a + b.rt, 0) / 3;
  let stability = {
    label: "Consistent",
    icon: "🎯",
    desc: "Highly consistent rhythm; suggests a very stable and well-internalised grammatical system.",
  };

  if (lateRT > earlyRT * 1.6) {
    stability = {
      label: "Fatigue / Variable",
      icon: "⚠️",
      desc: "Performance fluctuates or slows down, suggesting that mental stamina is a factor at this level.",
    };
  } else if (lateRT > earlyRT * 1.2) {
    stability = {
      label: "Steady",
      icon: "📊",
      desc: "Maintains a predictable pace throughout the session with minor variations.",
    };
  }

  const reliability = {
    isReliable: z0Items.length >= 3,
    reason:
      z0Items.length < 3
        ? "Insufficient items at target level for deep analysis."
        : "Optimal",
  };

  // ==================== GRAMMAR OBSERVATION LOGIC ====================
  let gObsTitle = "Grammar Consolidation";
  let gObsDesc = `At the ${finalLevel} level, structures are understood but not yet fluid. The student requires active mental effort to bridge the gap between 'knowing' a rule and 'using' it spontaneously in real-time.`;

  // High Automaticity
  if (ratio < 1.15) {
    gObsTitle = "Grammar Mastery";
    gObsDesc = `The student's processing of ${finalLevel} structures is highly efficient. They have reached the automaticity needed to focus entirely on complex meaning rather than mechanics at this stage.`;
  }
  // High Effort / Ceiling
  else if (ratio > 1.7) {
    gObsTitle = "Grammar Strain";
    gObsDesc = `The student is currently 'laboring' to apply ${finalLevel} rules. This high cognitive load suggests that while they can pass a test, they may struggle to maintain accuracy during a spontaneous conversation at this level.`;
  }

  // Refine based on Style (The "Flavor")
  if (style.label === "Quick / Impulsive" && effort.score > 3) {
    gObsTitle = "Emergent / Guessing";
    gObsDesc = `The student is attempting ${finalLevel} items quickly but with low accuracy. This suggests they are bypassing grammatical rules in favor of intuition or guessing at this level.`;
  } else if (
    style.label === "Careful / Cautious" &&
    stability.label === "Consistent"
  ) {
    gObsDesc += ` Their cautious but consistent pace at ${finalLevel} suggests a student who prioritizes accuracy and is carefully 'building' sentences.`;
  }

  // --- Cognitive Load Summary Logic ---
  const lLevel = dossier.listeningLevelReached;
  const gLevel = dossier.finalGrammarLevel;

  // Use the variables that exist locally in this function
  const lEffort = dossier.listeningDiagnostic?.effort?.label || "";
  const gEffort = effort?.label || "";
  let summary = "";

  // 1. Check for Level Discrepancy
  const levels = ["Below A1", "A1", "A2", "B1", "B2", "C1", "C2"];
  const lIdx = levels.indexOf(lLevel);
  const gIdx = levels.indexOf(gLevel);

  if (lLevel === gLevel) {
    if (lEffort.includes("High") || gEffort.includes("High")) {
      summary = `The student has reached ${lLevel}, but is doing so at a high 'cognitive cost.' While they understand the material, they may tire quickly in long lessons. Focus on fluency and stamina before pushing higher.`;
    } else {
      summary = `The student demonstrates a highly stable profile at ${lLevel}. Their linguistic 'automaticity' is strong, allowing them to focus on meaning rather than mechanics. They are ready for more challenging integrated tasks.`;
    }
  } else if (lIdx > gIdx) {
    summary = `The student has a strong natural 'ear' for English at ${lLevel}, but their structural accuracy (${gLevel}) hasn't caught up. They may appear more fluent than they are; prioritize formal grammar to prevent fossilized errors.`;
  } else {
    summary = `The student has a strong grasp of structures (${gLevel}) but struggles to process real-time speech at the same speed (${lLevel}). Prioritize high-volume listening to turn 'head knowledge' into 'ear knowledge.'`;
  }

  document.getElementById("overall-summary-text").textContent = summary;

  // ==================== FINAL ASSEMBLY ====================
  dossier.diagnosticProfile = {
    grammar: {
      effort,
      style,
      stability,
      observation: { title: gObsTitle, desc: gObsDesc }, // Add this line
      reliability,
      metrics: {
        loadRatio: ratio.toFixed(2),
        impulsivityIndex: impulsivityIndex.toFixed(2),
        itemCount: processed.length,
      },
    },
    listening: dossier.listeningDiagnostic || null,
  };

  return dossier;
};;;;;
