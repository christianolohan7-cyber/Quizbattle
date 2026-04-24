import { useLocalSearchParams, useRouter } from 'expo-router';
import { User, X, Trophy, History, BarChart2, PlayCircle, ArrowLeft } from 'lucide-react-native';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, StatusBar, ScrollView } from 'react-native';
import { GameContext } from '../../context/GameContext';
import { loadHistory, loadP2History, MatchHistoryEntry } from '../../utils/storage';

const RANKS = [
  { tier: 'BRONZE', color: '#cd7f32', minElo: 0 },
  { tier: 'SILVER', color: '#94a3b8', minElo: 1000 },
  { tier: 'GOLD', color: '#f59e0b', minElo: 1500 },
  { tier: 'PLATINUM', color: '#38bdf8', minElo: 2000 },
  { tier: 'DIAMOND', color: '#a78bfa', minElo: 2500 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { player: initialPlayer } = useLocalSearchParams<{ player: 'p1' | 'p2' }>();
  const { state } = useContext(GameContext);

  const activePlayer = initialPlayer || 'p1';
  const [modalTab, setModalTab] = useState<'stats' | 'history' | 'tiers'>('stats');
  const [historyP1, setHistoryP1] = useState<MatchHistoryEntry[]>([]);
  const [historyP2, setHistoryP2] = useState<MatchHistoryEntry[]>([]);

  useEffect(() => {
    loadHistory().then(h => setHistoryP1(h || []));
    loadP2History().then(h => setHistoryP2(h || []));
  }, []);

  const getRankDetails = (elo: number) => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (elo >= RANKS[i].minElo) return RANKS[i];
    }
    return RANKS[0];
  };

  const currentPlayer = activePlayer === 'p1' ? state.player : state.opponent;
  const currentHistory = activePlayer === 'p1' ? historyP1 : historyP2;
  const elo = currentPlayer?.elo ?? 1200;
  const rank = getRankDetails(elo);
  const wins = currentHistory.filter(h => h && h.result === 'Win').length;
  const losses = currentHistory.filter(h => h && h.result === 'Loss').length;
  const winRate = currentHistory.length > 0 ? Math.round((wins / currentHistory.length) * 100) : 0;
  const accentColor = activePlayer === 'p1' ? '#ef4444' : '#3b82f6';

  const renderHistoryItem = ({ item }: { item: MatchHistoryEntry }) => {
    if (!item) return null;
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
          <Text style={styles.historyOpponent}>vs {item.opponentName}</Text>
          <Text style={styles.historyScores}>
            Score: <Text style={{ fontWeight: '800' }}>{item.myScore || 0}</Text> – {item.opponentScore || 0}
          </Text>
        </View>
        <View style={styles.historyRight}>
          <Text style={[styles.historyResult, {
            color: item.result === 'Win' ? '#10b981' : item.result === 'Loss' ? '#ef4444' : '#f59e0b'
          }]}>
            {item.result}
          </Text>
          <TouchableOpacity style={styles.replayBtn}>
            <PlayCircle size={16} color={accentColor} />
            <Text style={[styles.replayText, { color: accentColor }]}>REPLAY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={28} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activePlayer === 'p1' ? 'Player 1' : 'Player 2'} Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={[styles.avatarLarge, { borderColor: rank.color }]}>
            <User size={64} color={rank.color} />
          </View>
          <Text style={styles.profileNameText}>{currentPlayer?.name || (activePlayer === 'p1' ? 'Player 1' : 'Player 2')}</Text>
          <View style={[styles.rankBadgeLarge, { backgroundColor: rank.color + '22', borderColor: rank.color }]}>
            <Text style={[styles.rankTextLarge, { color: rank.color }]}>{rank.tier} RANK</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            onPress={() => setModalTab('stats')}
            style={[styles.tabItem, modalTab === 'stats' && { borderBottomColor: accentColor }]}
          >
            <BarChart2 size={20} color={modalTab === 'stats' ? accentColor : '#94a3b8'} />
            <Text style={[styles.tabText, modalTab === 'stats' && { color: accentColor }]}>Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setModalTab('history')}
            style={[styles.tabItem, modalTab === 'history' && { borderBottomColor: accentColor }]}
          >
            <History size={20} color={modalTab === 'history' ? accentColor : '#94a3b8'} />
            <Text style={[styles.tabText, modalTab === 'history' && { color: accentColor }]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setModalTab('tiers')}
            style={[styles.tabItem, modalTab === 'tiers' && { borderBottomColor: accentColor }]}
          >
            <Trophy size={20} color={modalTab === 'tiers' ? accentColor : '#94a3b8'} />
            <Text style={[styles.tabText, modalTab === 'tiers' && { color: accentColor }]}>Tiers</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {modalTab === 'stats' && (
            <View style={styles.statsContainer}>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{elo}</Text>
                  <Text style={styles.statLbl}>Rank Rating</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#10b981' }]}>{winRate}%</Text>
                  <Text style={styles.statLbl}>Win Rate</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{currentHistory.length}</Text>
                  <Text style={styles.statLbl}>Matches</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statVal, { color: '#ef4444' }]}>{losses}</Text>
                  <Text style={styles.statLbl}>Losses</Text>
                </View>
              </View>
            </View>
          )}

          {modalTab === 'history' && (
            <View style={styles.historyContainer}>
              {currentHistory.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No match history found.</Text>
                </View>
              ) : (
                currentHistory.map((item, index) => (
                  <View key={item?.id || index} style={{ width: '100%' }}>
                    {renderHistoryItem({ item })}
                  </View>
                ))
              )}
            </View>
          )}

          {modalTab === 'tiers' && (
            <View style={styles.tiersContainer}>
              {RANKS.map((r, idx) => {
                const isCurrent = rank.tier === r.tier;
                return (
                  <View key={idx} style={[styles.tierRow, isCurrent && styles.tierRowActive]}>
                    <View style={[styles.tierIconBox, { backgroundColor: r.color + '22' }]}>
                      <Trophy size={24} color={r.color} />
                    </View>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierName, { color: r.color }]}>{r.tier}</Text>
                      <Text style={styles.tierRequirement}>{r.minElo}+ Rank</Text>
                    </View>
                    {isCurrent && (
                      <View style={[styles.currentTag, { backgroundColor: r.color }]}>
                        <Text style={styles.currentTagText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  
  profileHero: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff' },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, borderWidth: 5, justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#f8fafc' },
  profileNameText: { fontSize: 32, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  rankBadgeLarge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 2 },
  rankTextLarge: { fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabItem: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tabText: { fontSize: 15, fontWeight: '800', color: '#94a3b8' },
  tabContent: { flex: 1, padding: 20 },

  statsContainer: { gap: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '48%', backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  statVal: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  statLbl: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 4 },
  
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 16 },

  historyContainer: { gap: 12 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 22, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  historyLeft: { flex: 1 },
  historyDate: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  historyOpponent: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  historyScores: { color: '#64748b', fontSize: 14, marginTop: 4, fontWeight: '600' },
  historyRight: { alignItems: 'flex-end' },
  historyResult: { fontWeight: '900', fontSize: 18, marginBottom: 8 },
  replayBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#f1f5f9', borderRadius: 10 },
  replayText: { fontSize: 11, fontWeight: '900' },

  tiersContainer: { gap: 12 },
  tierRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 22, elevation: 1 },
  tierRowActive: { borderWidth: 2, borderColor: '#e2e8f0', elevation: 4 },
  tierIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 20, fontWeight: '900' },
  tierRequirement: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginTop: 2 },
  currentTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currentTagText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#94a3b8' },
});