/**
 * Calculates the new ELO rating for the player.
 * @param playerElo Current ELO of the player
 * @param opponentElo Current ELO of the opponent
 * @param isWinner true if player won, false if lost, undefined if draw
 * @param kFactor The maximum possible adjustment per game
 */
export function calculateNewElo(playerElo: number, opponentElo: number, isWinner: boolean | null, kFactor: number = 32): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  
  let actualScore = 0.5; // Draw
  if (isWinner === true) actualScore = 1;
  else if (isWinner === false) actualScore = 0;

  return Math.round(playerElo + kFactor * (actualScore - expectedScore));
}
