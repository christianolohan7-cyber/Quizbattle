import React, { createContext, ReactNode, useReducer } from "react";

// --- FSM States ---
export type GameState = "lobby" | "match" | "round" | "result" | "game_over";

// --- Types ---
export interface Player {
  id: string;
  name: string;
  elo: number;
}

export interface MatchState {
  state: GameState;
  player: Player;
  opponent: Player | null;
  score: number;
  opponentScore: number;
  currentQuestionIndex: number;
  p1Streak: number;
  p2Streak: number;
  p1Lifelines: number;
  p2Lifelines: number;
  activeQuestions: any[];
}

// --- Initial State with valid player ---
const initialState: MatchState = {
  state: "lobby",
  player: { id: "p1", name: "Player 1", elo: 1200 }, // always present
  opponent: null,
  score: 0,
  opponentScore: 0,
  currentQuestionIndex: 0,
  p1Streak: 0,
  p2Streak: 0,
  p1Lifelines: 1,
  p2Lifelines: 1,
  activeQuestions: [],
};

// --- Actions ---
type Action =
  | { type: "SET_PLAYER"; payload: Player }
  | { type: "SET_OPPONENT"; payload: Player }
  | { type: "START_MATCH"; payload: { opponent: Player; questions: any[] } }
  | { type: "START_ROUND" }
  | {
    type: "ANSWER_QUESTION";
    payload: {
      player: "p1" | "p2";
      isCorrect: boolean;
      points: number;
    };
  }
  | { type: "USE_LIFELINE"; payload: { player: "p1" | "p2" } }
  | { type: "NEXT_QUESTION" }
  | { type: "SHOW_RESULT" }
  | { type: "UPDATE_ELO"; payload: { p1EloChange: number; p2EloChange: number } }
  | { type: "RESET_LOBBY" };

// --- Reducer Logic ---
function gameReducer(state: MatchState, action: Action): MatchState {
  switch (action.type) {
    case "SET_PLAYER":
      return { ...state, player: action.payload };
    case "SET_OPPONENT":
      return { ...state, opponent: action.payload };
    case "START_MATCH":
      return {
        ...state,
        state: "match",
        opponent: action.payload.opponent,
        activeQuestions: action.payload.questions,
        score: 0,
        opponentScore: 0,
        currentQuestionIndex: 0,
        p1Streak: 0,
        p2Streak: 0,
        p1Lifelines: 1,
        p2Lifelines: 1,
      };
    case "START_ROUND":
      return { ...state, state: "round" };
    case "ANSWER_QUESTION":
      if (action.payload.player === "p1") {
        if (action.payload.isCorrect) {
          return {
            ...state,
            score: state.score + action.payload.points,
            p1Streak: state.p1Streak + 1,
          };
        } else {
          return { ...state, p1Streak: 0 };
        }
      } else {
        if (action.payload.isCorrect) {
          return {
            ...state,
            opponentScore: state.opponentScore + action.payload.points,
            p2Streak: state.p2Streak + 1,
          };
        } else {
          return { ...state, p2Streak: 0 };
        }
      }
    case "USE_LIFELINE":
      if (action.payload.player === "p1") {
        return { ...state, p1Lifelines: Math.max(0, state.p1Lifelines - 1) };
      } else {
        return { ...state, p2Lifelines: Math.max(0, state.p2Lifelines - 1) };
      }
    case "NEXT_QUESTION":
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case "SHOW_RESULT":
      return { ...state, state: "result" };
    case "UPDATE_ELO": {
      return {
        ...state,
        player: { ...state.player, elo: state.player.elo + action.payload.p1EloChange },
        opponent: state.opponent
          ? { ...state.opponent, elo: state.opponent.elo + action.payload.p2EloChange }
          : null,
      };
    }
    case "RESET_LOBBY":
      return {
        ...initialState,
        player: state.player,      // keep updated player
        opponent: state.opponent,  // keep updated opponent
      };
    default:
      return state;
  }
}

// --- Context ---
export const GameContext = createContext<{
  state: MatchState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};