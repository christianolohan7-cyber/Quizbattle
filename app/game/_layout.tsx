import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="match" />
      <Stack.Screen name="round" />
      <Stack.Screen name="result" />
      <Stack.Screen name="game_over" />
    </Stack>
  );
}
