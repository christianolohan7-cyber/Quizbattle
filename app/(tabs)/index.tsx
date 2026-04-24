import { useRouter } from 'expo-router';
import { User, X, Trophy, History, BarChart2, PlayCircle } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, StatusBar, ScrollView } from 'react-native';
import { GameContext } from '../../context/GameContext';
import { loadHistory, loadP2History, loadP2Profile, loadPlayerProfile, MatchHistoryEntry } from '../../utils/storage';
import { QUESTIONS } from '../../utils/questions';

const RANKS = [
  { tier: 'BRONZE', color: '#cd7f32', minElo: 0 },
  { tier: 'SILVER', color: '#94a3b8', minElo: 1000 },
  { tier: 'GOLD', color: '#f59e0b', minElo: 1500 },
  { tier: 'PLATINUM', color: '#38bdf8', minElo: 2000 },
  { tier: 'DIAMOND', color: '#a78bfa', minElo: 2500 },
];

export default function LobbyScreen() {
  const router = useRouter();
  const { state, dispatch } = useContext(GameContext);

  const [isP1Ready, setIsP1Ready] = useState(false);
  const [isP2Ready, setIsP2Ready] = useState(false);

  // Initial load
  useEffect(() => {
    async function init() {
      const p1 = await loadPlayerProfile();
      if (p1) dispatch({ type: 'SET_PLAYER', payload: p1 });
      
      const p2 = await loadP2Profile();
      if (p2) dispatch({ type: 'SET_OPPONENT', payload: p2 });
    }
    init();
  }, []);

  useEffect(() => {
    if (isP1Ready && isP2Ready) {
      const opponent = state.opponent || { id: 'p2', name: 'Player 2', elo: 1200 };
      
      // Select 5 random questions
      const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 5);

      dispatch({ 
        type: 'START_MATCH', 
        payload: { 
          opponent, 
          questions: selectedQuestions 
        } 
      });
      
      setIsP1Ready(false);
      setIsP2Ready(false);
      router.push('/game/match');
    }
  }, [isP1Ready, isP2Ready]);

  const getRankDetails = (elo: number) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (elo >= RANKS[i].minElo) return RANKS[i];
    }
    return RANKS[0];
  };

  const openProfile = (player: 'p1' | 'p2') => {
    router.push({
      pathname: '/profile',
      params: { player }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.absoluteHeader}>
        <Text style={styles.mainTitle}>QUIZ BATTLE</Text>
      </View>

      {/* Player 1 Card */}
      <View style={styles.playerSection}>
        <View style={[styles.card, styles.cardP1]}>
          <TouchableOpacity style={styles.cardProfileIcon} onPress={() => openProfile('p1')}>
            <View style={[styles.iconCircle, { backgroundColor: '#ef444422', borderColor: '#ef4444' }]}>
              <User size={32} color="#ef4444" />
            </View>
          </TouchableOpacity>

          <Text style={styles.playerLabel}>PLAYER 1</Text>
          <Text style={styles.playerName}>{state.player?.name || 'Player 1'}</Text>
          
          <View style={[styles.tierBadge, {
            backgroundColor: getRankDetails(state.player?.elo ?? 1200).color + '33',
            borderColor: getRankDetails(state.player?.elo ?? 1200).color
          }]}>
            <Text style={[styles.tierText, { color: getRankDetails(state.player?.elo ?? 1200).color }]}>
              {getRankDetails(state.player?.elo ?? 1200).tier}
            </Text>
          </View>
          <Text style={styles.eloText}>Rank: {state.player?.elo ?? 1200}</Text>

          <TouchableOpacity
            style={[styles.button, isP1Ready ? styles.buttonReady : styles.buttonP1]}
            onPress={() => setIsP1Ready(!isP1Ready)}
          >
            <Text style={styles.buttonText}>{isP1Ready ? '✓ READY!' : 'READY'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* VS Badge */}
      <View style={styles.vsContainer}>
        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>VS</Text>
        </View>
      </View>

      {/* Player 2 Card */}
      <View style={styles.playerSection}>
        <View style={[styles.card, styles.cardP2]}>
          <TouchableOpacity style={styles.cardProfileIcon} onPress={() => openProfile('p2')}>
            <View style={[styles.iconCircle, { backgroundColor: '#3b82f622', borderColor: '#3b82f6' }]}>
              <User size={32} color="#3b82f6" />
            </View>
          </TouchableOpacity>

          <Text style={styles.playerLabel}>PLAYER 2</Text>
          <Text style={styles.playerName}>{state.opponent?.name || 'Player 2'}</Text>
          
          <View style={[styles.tierBadge, {
            backgroundColor: getRankDetails(state.opponent?.elo ?? 1200).color + '33',
            borderColor: getRankDetails(state.opponent?.elo ?? 1200).color
          }]}>
            <Text style={[styles.tierText, { color: getRankDetails(state.opponent?.elo ?? 1200).color }]}>
              {getRankDetails(state.opponent?.elo ?? 1200).tier}
            </Text>
          </View>
          <Text style={styles.eloText}>Rank: {state.opponent?.elo ?? 1200}</Text>

          <TouchableOpacity
            style={[styles.button, isP2Ready ? styles.buttonReady : styles.buttonP2]}
            onPress={() => setIsP2Ready(!isP2Ready)}
          >
            <Text style={styles.buttonText}>{isP2Ready ? '✓ READY!' : 'READY'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f8fafc' },
  absoluteHeader: { position: 'absolute', top: 30, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  mainTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: 3 },

  // Player Cards
  playerSection: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 24, width: '92%', maxWidth: 280, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8, borderWidth: 3 },
  cardP1: { borderColor: '#ef4444' },
  cardP2: { borderColor: '#3b82f6' },
  
  cardProfileIcon: { marginBottom: 12 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  
  playerLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 3 },
  playerName: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, borderWidth: 1.2, marginBottom: 6 },
  tierText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  eloText: { fontSize: 14, color: '#64748b', fontWeight: '800', marginBottom: 18 },
  
  button: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12, width: '100%', alignItems: 'center', elevation: 3 },
  buttonP1: { backgroundColor: '#ef4444' },
  buttonP2: { backgroundColor: '#3b82f6' },
  buttonReady: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.2 },

  // VS
  vsContainer: { justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  vsBadge: { backgroundColor: '#0f172a', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  vsText: { color: '#fff', fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
});