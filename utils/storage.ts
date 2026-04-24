import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player } from '../context/GameContext';

export interface MatchHistoryEntry {
  id: string;
  date: string;
  opponentName: string;
  result: 'Win' | 'Loss' | 'Draw';
  eloChange: number;
  myScore: number;
  opponentScore: number;
}

export const loadPlayerProfile = async (): Promise<Player | null> => {
  try {
    const data = await AsyncStorage.getItem('@player_profile');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const savePlayerProfile = async (player: Player) => {
  try {
    await AsyncStorage.setItem('@player_profile', JSON.stringify(player));
  } catch (e) {
    console.error(e);
  }
};

export const loadP2Profile = async (): Promise<Player | null> => {
  try {
    const data = await AsyncStorage.getItem('@p2_profile');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const saveP2Profile = async (player: Player) => {
  try {
    await AsyncStorage.setItem('@p2_profile', JSON.stringify(player));
  } catch (e) {
    console.error(e);
  }
};

export const loadHistory = async (): Promise<MatchHistoryEntry[]> => {
  try {
    const data = await AsyncStorage.getItem('@match_history');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveHistory = async (history: MatchHistoryEntry[]) => {
  try {
    await AsyncStorage.setItem('@match_history', JSON.stringify(history));
  } catch (e) {
    console.error(e);
  }
};

export const loadP2History = async (): Promise<MatchHistoryEntry[]> => {
  try {
    const data = await AsyncStorage.getItem('@p2_match_history');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveP2History = async (history: MatchHistoryEntry[]) => {
  try {
    await AsyncStorage.setItem('@p2_match_history', JSON.stringify(history));
  } catch (e) {
    console.error(e);
  }
};
