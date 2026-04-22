import React, { createContext, useReducer, ReactNode } from 'react';

// --- FSM States ---
export type GameState = 'lobby' | 'match' | 'round' | 'result' | 'game_over';

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
  streak: number;
  lifelines: number;
}

// --- Initial State ---
const initialState: MatchState = {
  state: 'lobby',
  player: { id: 'p1', name: 'Student 1', elo: 1200 }, // Default, will be loaded from storage
  opponent: null,
  score: 0,
  opponentScore: 0,
  currentQuestionIndex: 0,
  streak: 0,
  lifelines: 1, // 1 lifeline per game (50/50 logic)
};

// --- Actions ---
type Action =
  | { type: 'START_MATCH'; payload: Player }
  | { type: 'START_ROUND' }
  | { type: 'ANSWER_QUESTION'; payload: { isCorrect: boolean; points: number } }
  | { type: 'OPPONENT_ANSWER'; payload: { isCorrect: boolean; points: number } }
  | { type: 'USE_LIFELINE' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'SHOW_RESULT' }
  | { type: 'END_GAME' }
  | { type: 'RESET_LOBBY' };

// --- Reducer Logic ---
function gameReducer(state: MatchState, action: Action): MatchState {
  switch (action.type) {
    case 'START_MATCH':
      return {
        ...state,
        state: 'match',
        opponent: action.payload,
        score: 0,
        opponentScore: 0,
        currentQuestionIndex: 0,
        streak: 0,
        lifelines: 1,
      };
    case 'START_ROUND':
      return { ...state, state: 'round' };
    case 'ANSWER_QUESTION':
      if (action.payload.isCorrect) {
        const streakBonus = state.streak * 10;
        return {
          ...state,
          score: state.score + action.payload.points + streakBonus,
          streak: state.streak + 1,
        };
      } else {
        return { ...state, streak: 0 };
      }
    case 'OPPONENT_ANSWER':
      if (action.payload.isCorrect) {
        return { ...state, opponentScore: state.opponentScore + action.payload.points };
      }
      return state;
    case 'USE_LIFELINE':
      return { ...state, lifelines: Math.max(0, state.lifelines - 1) };
    case 'NEXT_QUESTION':
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case 'SHOW_RESULT':
      return { ...state, state: 'result' };
    case 'END_GAME':
      return { ...state, state: 'game_over' };
    case 'RESET_LOBBY':
      return { ...initialState, player: state.player };
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
