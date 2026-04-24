import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { GameContext } from '../../context/GameContext';

export default function MatchScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(GameContext);

  useEffect(() => {
    // Wait for 3 seconds on the Match screen, then start the round
    const timer = setTimeout(() => {
      dispatch({ type: 'START_ROUND' });
      router.replace('/game/round');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MATCH FOUND!</Text>
      
      <View style={styles.vsContainer}>
        {/* Player 1 (Red Accent) */}
        <View style={[styles.playerCard, styles.player1Card]}>
          <Text style={styles.name}>{state.player.name}</Text>
          <Text style={styles.elo}>Rank: {state.player.elo}</Text>
        </View>

        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Player 2 (Blue Accent) */}
        <View style={[styles.playerCard, styles.player2Card]}>
          <Text style={styles.name}>{state.opponent?.name || 'Guest'}</Text>
          <Text style={styles.elo}>Rank: {state.opponent?.elo || 1200}</Text>
        </View>
      </View>

      <Text style={styles.loadingText}>Preparing battle arena...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 40,
    letterSpacing: 2,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  playerCard: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 24,
    width: '35%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 4,
    marginHorizontal: 20,
  },
  player1Card: {
    borderColor: '#ef4444', // Red Accent for P1
  },
  player2Card: {
    borderColor: '#3b82f6', // Blue Accent for P2
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  elo: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  vsBadge: {
    backgroundColor: '#0f172a',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  vsText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 50,
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.8,
  },
});
