import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GameContext } from '../../context/GameContext';
import { savePlayerProfile, saveP2Profile, loadHistory, loadP2History, saveHistory, saveP2History, MatchHistoryEntry } from '../../utils/storage';

export default function ResultScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(GameContext);
  
  const [eloData, setEloData] = useState<{ p1Old: number; p1New: number; p1Change: number; p2Old: number; p2New: number; p2Change: number } | null>(null);

  useEffect(() => {
    async function processResult() {
      if (!state.opponent) return;

      const p1Wins = state.score > state.opponentScore;
      const p2Wins = state.opponentScore > state.score;
      const isDraw = state.score === state.opponentScore;

      // The ELO change is the winner's total score
      const winnerScore = p1Wins ? state.score : (p2Wins ? state.opponentScore : 0);
      const eloChangeAmount = winnerScore;
      
      let p1EloChange = 0;
      let p2EloChange = 0;

      if (p1Wins) {
        p1EloChange = eloChangeAmount;
        p2EloChange = -eloChangeAmount;
      } else if (p2Wins) {
        p1EloChange = -eloChangeAmount;
        p2EloChange = eloChangeAmount;
      }

      const p1OldElo = state.player.elo;
      const p2OldElo = state.opponent.elo;
      
      const p1NewElo = Math.max(0, p1OldElo + p1EloChange);
      const p2NewElo = Math.max(0, p2OldElo + p2EloChange);

      setEloData({
        p1Old: p1OldElo,
        p1New: p1NewElo,
        p1Change: p1EloChange,
        p2Old: p2OldElo,
        p2New: p2NewElo,
        p2Change: p2EloChange,
      });

      // Dispatch to context so lobby is updated
      dispatch({ type: 'UPDATE_ELO', payload: { p1EloChange, p2EloChange } });

      // Save new profiles
      const updatedP1 = { ...state.player, elo: p1NewElo };
      const updatedP2 = { ...state.opponent, elo: p2NewElo };
      
      await savePlayerProfile(updatedP1);
      await saveP2Profile(updatedP2);

      // Save to P1 history
      const history = await loadHistory();
      const newEntryP1: MatchHistoryEntry = {
        id: Date.now().toString() + '-p1',
        date: new Date().toISOString(),
        opponentName: state.opponent.name,
        result: isDraw ? 'Draw' : (p1Wins ? 'Win' : 'Loss'),
        eloChange: p1EloChange,
        myScore: state.score,
        opponentScore: state.opponentScore,
      };
      await saveHistory([newEntryP1, ...history]);

      // Save to P2 history
      const historyP2 = await loadP2History();
      const newEntryP2: MatchHistoryEntry = {
        id: Date.now().toString() + '-p2',
        date: new Date().toISOString(),
        opponentName: state.player.name,
        result: isDraw ? 'Draw' : (p2Wins ? 'Win' : 'Loss'),
        eloChange: p2EloChange,
        myScore: state.opponentScore,
        opponentScore: state.score,
      };
      await saveP2History([newEntryP2, ...historyP2]);
    }

    processResult();
  }, []);

  const handleReturnToLobby = () => {
    dispatch({ type: 'RESET_LOBBY' });
    router.replace('/(tabs)');
  };

  if (!eloData) {
    return (
      <View style={styles.container}>
        <Text style={styles.calculating}>Calculating Results...</Text>
      </View>
    );
  }

  const p1Wins = state.score > state.opponentScore;
  const p2Wins = state.opponentScore > state.score;

  let titleText = 'DRAW!';
  let titleColor = '#f59e0b';
  if (p1Wins) {
    titleText = 'PLAYER 1 WINS!';
    titleColor = '#ef4444';
  } else if (p2Wins) {
    titleText = 'PLAYER 2 WINS!';
    titleColor = '#3b82f6';
  }

  return (
    <View style={styles.container}>
      
      <Text style={[styles.mainTitle, { color: titleColor }]}>{titleText}</Text>

      <View style={styles.cardsContainer}>
        {/* Player 1 (Red) */}
        <View style={[styles.playerCard, styles.p1Card]}>
          <Text style={styles.playerName}>{state.player.name}</Text>
          <Text style={styles.scoreValue}>{state.score}</Text>
          <Text style={styles.scoreLabel}>Final Score</Text>
          
          <View style={styles.eloBox}>
            <Text style={styles.eloTitle}>Rating</Text>
            <Text style={styles.eloValue}>{eloData.p1Old} ➔ {eloData.p1New}</Text>
            <Text style={[styles.eloChange, { color: eloData.p1Change > 0 ? '#10b981' : (eloData.p1Change < 0 ? '#ef4444' : '#94a3b8') }]}>
              {eloData.p1Change > 0 ? '+' : ''}{eloData.p1Change}
            </Text>
          </View>
        </View>

        <View style={styles.centerCol}>
          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleReturnToLobby}>
            <Text style={styles.buttonText}>Lobby</Text>
          </TouchableOpacity>
        </View>

        {/* Player 2 (Blue) */}
        <View style={[styles.playerCard, styles.p2Card]}>
          <Text style={styles.playerName}>{state.opponent?.name || 'Player 2'}</Text>
          <Text style={styles.scoreValue}>{state.opponentScore}</Text>
          <Text style={styles.scoreLabel}>Final Score</Text>
          
          <View style={styles.eloBox}>
            <Text style={styles.eloTitle}>Rating</Text>
            <Text style={styles.eloValue}>{eloData.p2Old} ➔ {eloData.p2New}</Text>
            <Text style={[styles.eloChange, { color: eloData.p2Change > 0 ? '#10b981' : (eloData.p2Change < 0 ? '#ef4444' : '#94a3b8') }]}>
              {eloData.p2Change > 0 ? '+' : ''}{eloData.p2Change}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  calculating: {
    color: '#64748b',
    fontSize: 20,
    fontWeight: '700',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  playerCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 20,
    width: '35%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 3,
  },
  p1Card: {
    borderColor: '#ef4444',
  },
  p2Card: {
    borderColor: '#3b82f6',
  },
  playerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 52,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eloBox: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  eloTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 2,
  },
  eloValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  eloChange: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
    color: '#94a3b8',
  },
  centerCol: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBadge: {
    backgroundColor: '#0f172a',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  vsText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
