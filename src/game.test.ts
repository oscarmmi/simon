import { describe, expect, it } from 'vitest'
import { acceptPad, createGameState, startGame } from './game'

describe('Pulse Four game logic', () => {
  it('advances the player index when the next pad matches', () => {
    const state = { sequence: [0, 2], inputIndex: 0, phase: 'input' as const }

    const result = acceptPad(state, 0, 3)

    expect(result.outcome).toBe('matched')
    expect(result.state.inputIndex).toBe(1)
    expect(result.state.phase).toBe('input')
    expect(result.state.sequence).toEqual([0, 2])
  })

  it('ends the run when the player presses the wrong pad', () => {
    const state = { sequence: [0, 2], inputIndex: 1, phase: 'input' as const }

    const result = acceptPad(state, 1, 3)

    expect(result.outcome).toBe('wrong')
    expect(result.state.phase).toBe('over')
    expect(result.state.inputIndex).toBe(1)
  })

  it('extends the sequence by one after a complete, correct turn', () => {
    const initial = startGame(createGameState(), 2)
    const playerTurn = { ...initial, phase: 'input' as const }

    const result = acceptPad(playerTurn, 2, 1)

    expect(result.outcome).toBe('complete')
    expect(result.state.sequence).toEqual([2, 1])
    expect(result.state.inputIndex).toBe(0)
    expect(result.state.phase).toBe('showing')
  })
})
