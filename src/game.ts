export type GamePhase = 'ready' | 'showing' | 'input' | 'over'

export interface GameState {
  sequence: number[]
  inputIndex: number
  phase: GamePhase
}

export type InputOutcome = 'ignored' | 'matched' | 'complete' | 'wrong'

export function createGameState(): GameState {
  return { sequence: [], inputIndex: 0, phase: 'ready' }
}

export function startGame(_state: GameState, firstPad: number): GameState {
  return { sequence: [firstPad], inputIndex: 0, phase: 'showing' }
}

export function acceptPad(
  state: GameState,
  pad: number,
  nextPad: number,
): { state: GameState; outcome: InputOutcome } {
  if (state.phase !== 'input') return { state, outcome: 'ignored' }
  if (state.sequence[state.inputIndex] !== pad) {
    return { state: { ...state, phase: 'over' }, outcome: 'wrong' }
  }

  const nextIndex = state.inputIndex + 1
  if (nextIndex < state.sequence.length) {
    return { state: { ...state, inputIndex: nextIndex }, outcome: 'matched' }
  }

  return {
    state: {
      sequence: [...state.sequence, nextPad],
      inputIndex: 0,
      phase: 'showing',
    },
    outcome: 'complete',
  }
}
