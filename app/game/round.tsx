import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GameContext } from "../../context/GameContext";

export default function RoundScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(GameContext);

  const [timeLeft, setTimeLeft] = useState(10);

  const [p1Answer, setP1Answer] = useState<number | null>(null);
  const [p2Answer, setP2Answer] = useState<number | null>(null);

  const [p1AnswerTime, setP1AnswerTime] = useState<number | null>(null);
  const [p2AnswerTime, setP2AnswerTime] = useState<number | null>(null);

  const [p1HiddenOptions, setP1HiddenOptions] = useState<number[]>([]);
  const [p2HiddenOptions, setP2HiddenOptions] = useState<number[]>([]);

  const [p1LifelineUsed, setP1LifelineUsed] = useState(false);
  const [p2LifelineUsed, setP2LifelineUsed] = useState(false);

  const [roundOver, setRoundOver] = useState(false);

  const currentQuestionIndex = state.currentQuestionIndex;
  const currentQuestion = state.activeQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === state.activeQuestions.length - 1;

  // Timer logic
  useEffect(() => {
    if (roundOver) return;

    if (timeLeft === 0) {
      handleTimeUp();
      return;
    }
    const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, roundOver]);

  // NEW GAME LOGIC:
  // 1. When P1 answers correctly → immediately proceed to next round
  // 2. When P1 answers incorrectly → wait for P2 to answer
  // 3. When both answer correctly → they split 50-50

  useEffect(() => {
    if (roundOver || p1Answer === null || !currentQuestion) return;
    const p1Correct = p1Answer === currentQuestion.correctAnswerIndex;

    if (p1Correct) {
      setP1AnswerTime(Date.now());
      // P1 answered correctly → proceed immediately
      setRoundOver(true);
      const p2Correct =
        p2Answer !== null
          ? p2Answer === currentQuestion.correctAnswerIndex
          : false;
      evaluateRound(p1Correct, p2Correct, p2Answer === null);
    }
  }, [p1Answer, roundOver]);

  useEffect(() => {
    if (roundOver || p1Answer === null || p2Answer === null || !currentQuestion) return;
    const p1Correct = p1Answer === currentQuestion.correctAnswerIndex;

    if (!p1Correct) {
      // P1 answered incorrectly and P2 answered → evaluate immediately
      setP2AnswerTime(Date.now());
      setRoundOver(true);
      const p2Correct = p2Answer === currentQuestion.correctAnswerIndex;
      evaluateRound(p1Correct, p2Correct, false);
    }
  }, [p2Answer, p1Answer, roundOver]);

  // Handle P2 answering first and correctly
  useEffect(() => {
    if (roundOver || p2Answer === null || p1Answer !== null || !currentQuestion) return;
    const p2Correct = p2Answer === currentQuestion.correctAnswerIndex;

    if (p2Correct) {
      setP2AnswerTime(Date.now());
      // P2 answered correctly first → proceed immediately
      setRoundOver(true);
      evaluateRound(false, p2Correct, false);
    }
  }, [p2Answer, p1Answer, roundOver]);

  const handleTimeUp = () => {
    if (roundOver) return;
    setRoundOver(true);

    const p1Correct =
      p1Answer === null || !currentQuestion
        ? false
        : p1Answer === currentQuestion.correctAnswerIndex;
    const p2Correct =
      p2Answer === null || !currentQuestion
        ? false
        : p2Answer === currentQuestion.correctAnswerIndex;

    evaluateRound(p1Correct, p2Correct, p1Answer !== null && p2Answer === null);
  };

  const evaluateRound = (
    p1Correct: boolean,
    p2Correct: boolean,
    p1AnsweredFirst: boolean,
  ) => {
    // time bonus based on when the player answered (we'll use the final timeLeft if they didn't answer)
    const p1Bonus = Math.max(1, p1AnswerTime ? p1AnswerTime : timeLeft);
    const p2Bonus = Math.max(1, p2AnswerTime ? p2AnswerTime : timeLeft);

    const diff = currentQuestion.difficulty || 1;
    const p1StreakMult = Math.max(1, state.p1Streak);
    const p2StreakMult = Math.max(1, state.p2Streak);

    // Formula: time bonus × streak × difficulty × 10
    let p1Potential = p1Bonus * p1StreakMult * diff * 10;
    let p2Potential = p2Bonus * p2StreakMult * diff * 10;

    // Lifeline halves points
    if (p1LifelineUsed) p1Potential = Math.round(p1Potential / 2);
    if (p2LifelineUsed) p2Potential = Math.round(p2Potential / 2);

    let p1Points = 0;
    let p2Points = 0;

    // Point splitting logic if both correct
    if (p1Correct && p2Correct) {
      p1Points = Math.round(p1Potential / 2);
      p2Points = Math.round(p2Potential / 2);
    } else {
      if (p1Correct) p1Points = p1Potential;
      if (p2Correct) p2Points = p2Potential;
    }

    dispatch({
      type: "ANSWER_QUESTION",
      payload: {
        player: "p1",
        isCorrect: p1Correct,
        points: p1Points,
      },
    });
    dispatch({
      type: "ANSWER_QUESTION",
      payload: {
        player: "p2",
        isCorrect: p2Correct,
        points: p2Points,
      },
    });

    setTimeout(() => {
      proceedToNext();
    }, 2000);
  };

  const proceedToNext = () => {
    setP1Answer(null);
    setP2Answer(null);
    setP1AnswerTime(null);
    setP2AnswerTime(null);
    setP1HiddenOptions([]);
    setP2HiddenOptions([]);
    setP1LifelineUsed(false);
    setP2LifelineUsed(false);
    setRoundOver(false);
    setTimeLeft(10);

    if (isLastQuestion) {
      dispatch({ type: "SHOW_RESULT" });
      router.replace("/game/result");
    } else {
      dispatch({ type: "NEXT_QUESTION" });
    }
  };

  const handleLifeline = (player: "p1" | "p2") => {
    if (
      player === "p1" &&
      state.p1Lifelines > 0 &&
      !p1LifelineUsed &&
      p1Answer === null &&
      currentQuestion
    ) {
      dispatch({ type: "USE_LIFELINE", payload: { player: "p1" } });
      setP1LifelineUsed(true);
      const wrongIndexes = [0, 1, 2, 3].filter(
        (i) => i !== currentQuestion.correctAnswerIndex,
      );
      const shuffled = wrongIndexes.sort(() => 0.5 - Math.random());
      setP1HiddenOptions(shuffled.slice(0, 2));
    }

    if (
      player === "p2" &&
      state.p2Lifelines > 0 &&
      !p2LifelineUsed &&
      p2Answer === null &&
      currentQuestion
    ) {
      dispatch({ type: "USE_LIFELINE", payload: { player: "p2" } });
      setP2LifelineUsed(true);
      const wrongIndexes = [0, 1, 2, 3].filter(
        (i) => i !== currentQuestion.correctAnswerIndex,
      );
      const shuffled = wrongIndexes.sort(() => 0.5 - Math.random());
      setP2HiddenOptions(shuffled.slice(0, 2));
    }
  };

  if (!currentQuestion) return null;

  return (
    <View style={styles.container}>
      {/* Player 1 Section (Left - Red) */}
      <View style={styles.playerPanel}>
        <View style={[styles.playerHeader, styles.p1Header]}>
          <Text style={styles.playerName}>{state.player.name}</Text>
          <Text style={styles.scoreText}>Score: {state.score}</Text>
          <Text style={styles.streakText}>Streak: {state.p1Streak}🔥</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            if (p1HiddenOptions.includes(index)) {
              return (
                <View
                  key={index}
                  style={[styles.optionButton, { opacity: 0 }]}
                />
              );
            }

            let bgColor = "#ffffff";
            let borderColor = "#ef4444"; // Red outline default
            let textColor = "#1e293b";

            if (
              p1Answer === index ||
              (roundOver && index === currentQuestion.correctAnswerIndex)
            ) {
              if (index === currentQuestion.correctAnswerIndex) {
                bgColor = "#10b981"; // Immediately green if correct
                borderColor = "#047857";
                textColor = "#ffffff";
              } else if (p1Answer === index) {
                bgColor = "#ef4444"; // Immediately red if wrong
                borderColor = "#b91c1c";
                textColor = "#ffffff";
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { backgroundColor: bgColor, borderColor },
                ]}
                onPress={() => {
                  if (!roundOver && p1Answer === null) setP1Answer(index);
                }}
                activeOpacity={0.7}
                disabled={roundOver || p1Answer !== null}
              >
                <Text style={[styles.optionText, { color: textColor }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.lifelineButton,
            styles.lifelineP1,
            (state.p1Lifelines === 0 ||
              p1LifelineUsed ||
              p1Answer !== null ||
              roundOver) &&
              styles.disabledButton,
          ]}
          onPress={() => handleLifeline("p1")}
          disabled={
            state.p1Lifelines === 0 ||
            p1LifelineUsed ||
            p1Answer !== null ||
            roundOver
          }
        >
          <Text style={styles.lifelineText}>50/50 ({state.p1Lifelines})</Text>
        </TouchableOpacity>
      </View>

      {/* Center Section (Question & Timer) */}
      <View style={styles.centerPanel}>
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{timeLeft}</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionCounter}>
            Q {currentQuestionIndex + 1} / {state.activeQuestions.length}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {roundOver && (
          <View style={styles.roundOverBadge}>
            <Text style={styles.roundOverText}>EVALUATING...</Text>
          </View>
        )}
      </View>

      {/* Player 2 Section (Right - Blue) */}
      <View style={styles.playerPanel}>
        <View style={[styles.playerHeader, styles.p2Header]}>
          <Text style={styles.playerName}>
            {state.opponent?.name || "Player 2"}
          </Text>
          <Text style={styles.scoreText}>Score: {state.opponentScore}</Text>
          <Text style={styles.streakText}>Streak: {state.p2Streak}🔥</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            if (p2HiddenOptions.includes(index)) {
              return (
                <View
                  key={index}
                  style={[styles.optionButton, { opacity: 0 }]}
                />
              );
            }

            let bgColor = "#ffffff";
            let borderColor = "#3b82f6"; // Blue outline default
            let textColor = "#1e293b";

            if (
              p2Answer === index ||
              (roundOver && index === currentQuestion.correctAnswerIndex)
            ) {
              if (index === currentQuestion.correctAnswerIndex) {
                bgColor = "#10b981"; // Immediately green if correct
                borderColor = "#047857";
                textColor = "#ffffff";
              } else if (p2Answer === index) {
                bgColor = "#ef4444"; // Immediately red if wrong
                borderColor = "#b91c1c";
                textColor = "#ffffff";
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { backgroundColor: bgColor, borderColor },
                ]}
                onPress={() => {
                  const p1Correct =
                    p1Answer !== null && currentQuestion
                      ? p1Answer === currentQuestion.correctAnswerIndex
                      : null;
                  // P2 can answer if roundOver is false OR if P1 answered incorrectly
                  const canP2Answer =
                    !roundOver || (p1Answer !== null && !p1Correct);
                  if (canP2Answer && p2Answer === null) setP2Answer(index);
                }}
                activeOpacity={0.7}
                disabled={(() => {
                  const p1Correct =
                    p1Answer !== null && currentQuestion
                      ? p1Answer === currentQuestion.correctAnswerIndex
                      : null;
                  // P2 disabled if already answered or if P1 answered correctly
                  return p2Answer !== null || p1Correct === true;
                })()}
              >
                <Text style={[styles.optionText, { color: textColor }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.lifelineButton,
            styles.lifelineP2,
            (state.p2Lifelines === 0 ||
              p2LifelineUsed ||
              p2Answer !== null ||
              (p1Answer !== null &&
                p1Answer === currentQuestion.correctAnswerIndex) ||
              roundOver) &&
              styles.disabledButton,
          ]}
          onPress={() => handleLifeline("p2")}
          disabled={
            state.p2Lifelines === 0 ||
            p2LifelineUsed ||
            p2Answer !== null ||
            (p1Answer !== null &&
              p1Answer === currentQuestion.correctAnswerIndex) ||
            roundOver
          }
        >
          <Text style={styles.lifelineText}>50/50 ({state.p2Lifelines})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8fafc",
  },
  playerPanel: {
    flex: 1.2,
    padding: 10,
    justifyContent: "space-between",
  },
  centerPanel: {
    flex: 1.5,
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  playerHeader: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  p1Header: {
    backgroundColor: "#fee2e2", // Light Red
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  p2Header: {
    backgroundColor: "#dbeafe", // Light Blue
    borderWidth: 2,
    borderColor: "#3b82f6",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginTop: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f59e0b",
    marginTop: 2,
  },
  optionsContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "center",
    gap: 8,
  },
  optionButton: {
    width: "48%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  lifelineButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  lifelineP1: {
    backgroundColor: "#ef4444",
  },
  lifelineP2: {
    backgroundColor: "#3b82f6",
  },
  disabledButton: {
    backgroundColor: "#cbd5e1",
  },
  lifelineText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
  timerBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 4,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
  },
  questionCard: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  questionCounter: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 2,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    color: "#0f172a",
    lineHeight: 28,
  },
  roundOverBadge: {
    position: "absolute",
    bottom: 20,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  roundOverText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
});
