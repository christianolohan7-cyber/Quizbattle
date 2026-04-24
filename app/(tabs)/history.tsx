import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameContext } from '../../context/GameContext';
import { loadHistory, loadP2History, MatchHistoryEntry } from '../../utils/storage';

export default function HistoryScreen() {
  const { state } = useContext(GameContext);
  const [activePlayer, setActivePlayer] = useState<'p1' | 'p2'>('p1');
  const [historyP1, setHistoryP1] = useState<MatchHistoryEntry[]>([]);
  const [historyP2, setHistoryP2] = useState<MatchHistoryEntry[]>([]);

  useEffect(() => {
    loadHistory().then(setHistoryP1);
    loadP2History().then(setHistoryP2);
  }, []);

  const history = activePlayer === 'p1' ? historyP1 : historyP2;
  const playerName = activePlayer === 'p1'
    ? (state.player?.name || 'Player 1')
    : (state.opponent?.name || 'Player 2');

  const wins = history.filter(h => h?.result === 'Win').length;
  const losses = history.filter(h => h?.result === 'Loss').length;

  const renderItem = ({ item }: { item: MatchHistoryEntry }) => (
    <View style={styles.card}>
      <View style={[styles.resultStrip, {
        backgroundColor: item.result === 'Win' ? '#10b981' : item.result === 'Loss' ? '#ef4444' : '#f59e0b'
      }]} />
      <View style={styles.cardMain}>
        <View>
          <Text style={styles.opponent}>vs {item.opponentName}</Text>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
          <Text style={styles.score}>Score: <Text style={{ fontWeight: '900' }}>{item.myScore || 0}</Text> – {item.opponentScore || 0}</Text>
        </View>
        <View style={styles.rightSide}>
          <Text style={[styles.result, {
            color: item.result === 'Win' ? '#10b981' : item.result === 'Loss' ? '#ef4444' : '#f59e0b'
          }]}>{item.result}</Text>
          <Text style={[styles.eloChange, { color: item.eloChange >= 0 ? '#10b981' : '#ef4444' }]}>
            {item.eloChange > 0 ? '+' : ''}{item.eloChange} Rank
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Player Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, activePlayer === 'p1' && styles.toggleP1]}
          onPress={() => setActivePlayer('p1')}
        >
          <Text style={[styles.toggleText, activePlayer === 'p1' && styles.toggleTextActive]}>Player 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activePlayer === 'p2' && styles.toggleP2]}
          onPress={() => setActivePlayer('p2')}
        >
          <Text style={[styles.toggleText, activePlayer === 'p2' && styles.toggleTextActive]}>Player 2</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryName}>{playerName}</Text>
        <View style={styles.summaryPills}>
          <View style={[styles.pill, { backgroundColor: '#10b98122' }]}>
            <Text style={[styles.pillText, { color: '#10b981' }]}>{wins}W</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#ef444422' }]}>
            <Text style={[styles.pillText, { color: '#ef4444' }]}>{losses}L</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#64748b22' }]}>
            <Text style={[styles.pillText, { color: '#64748b' }]}>{history.length} total</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => item?.id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No match history yet.</Text>
            <Text style={styles.emptySubtext}>Play a battle to see results here!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  toggleRow: { flexDirection: 'row', margin: 16, backgroundColor: '#e2e8f0', borderRadius: 16, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  toggleP1: { backgroundColor: '#ef4444' },
  toggleP2: { backgroundColor: '#3b82f6' },
  toggleText: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  toggleTextActive: { color: '#fff', fontWeight: '900' },
  summaryBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  summaryName: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  summaryPills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontWeight: '800', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18, marginBottom: 10, overflow: 'hidden', elevation: 2 },
  resultStrip: { width: 6 },
  cardMain: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  opponent: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  date: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 3 },
  score: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 3 },
  rightSide: { alignItems: 'flex-end' },
  result: { fontSize: 18, fontWeight: '900' },
  eloChange: { fontSize: 13, fontWeight: '800', marginTop: 3 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#94a3b8' },
  emptySubtext: { fontSize: 14, color: '#cbd5e1', marginTop: 6 },
});
