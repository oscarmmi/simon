<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  acceptPad,
  createGameState,
  startGame,
  type GameState,
} from './game'

const pads = [
  { name: 'Solar', color: 'amber', key: 'Q', note: 261.63, icon: '✳' },
  { name: 'Tide', color: 'cyan', key: 'W', note: 329.63, icon: '⌁' },
  { name: 'Bloom', color: 'magenta', key: 'A', note: 392, icon: '✿' },
  { name: 'Volt', color: 'lime', key: 'S', note: 523.25, icon: '↯' },
]

const game = ref<GameState>(createGameState())
const activePad = ref<number | null>(null)
const soundEnabled = ref(true)
const bestRound = ref(0)
const message = ref('Ready when you are.')
const stepCount = computed(() => game.value.sequence.length)
const isPlaying = computed(() => game.value.phase === 'showing' || game.value.phase === 'input')
const timerIds: number[] = []
let audioContext: AudioContext | null = null

function later(callback: () => void, delay: number) {
  timerIds.push(window.setTimeout(callback, delay))
}

function clearTimers() {
  timerIds.splice(0).forEach(window.clearTimeout)
  activePad.value = null
}

function getAudioContext() {
  if (!soundEnabled.value) return null
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    return audioContext
  } catch {
    return null
  }
}

function tone(index: number, length = 0.18, volume = 0.075) {
  const context = getAudioContext()
  if (!context) return
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = pads[index]?.note ?? 240
  gain.gain.setValueAtTime(volume, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + length)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + length)
}

function randomPad() {
  return Math.floor(Math.random() * pads.length)
}

function flash(index: number, duration = 240) {
  activePad.value = index
  tone(index)
  later(() => {
    if (activePad.value === index) activePad.value = null
  }, duration)
}

function playSequence() {
  const sequence = [...game.value.sequence]
  game.value = { ...game.value, phase: 'showing', inputIndex: 0 }
  message.value = 'Watch the pulse…'
  const gap = 560
  sequence.forEach((index, position) => {
    later(() => flash(index, 330), 280 + position * gap)
  })
  later(() => {
    game.value = { ...game.value, phase: 'input' }
    message.value = 'Your turn. Repeat the sequence.'
  }, 280 + sequence.length * gap)
}

function startGameNow() {
  clearTimers()
  game.value = startGame(createGameState(), randomPad())
  message.value = 'Watch the pulse…'
  playSequence()
}

function pressPad(index: number) {
  if (game.value.phase !== 'input') return
  clearTimers()
  flash(index, 170)
  const previousLength = game.value.sequence.length
  const result = acceptPad(game.value, index, randomPad())
  game.value = result.state

  if (result.outcome === 'wrong') {
    message.value = 'Sequence broken. Take another run.'
    return
  }
  if (result.outcome === 'complete') {
    bestRound.value = Math.max(bestRound.value, previousLength)
    window.localStorage.setItem('pulse-four-best', String(bestRound.value))
    message.value = 'Clean run. Next round…'
    later(playSequence, 780)
    return
  }
  message.value = `${game.value.inputIndex} of ${game.value.sequence.length} pulses matched.`
}

function onKeydown(event: KeyboardEvent) {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target
  if (target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (event.key.toLowerCase() === 'r') {
    event.preventDefault()
    startGameNow()
    return
  }
  const key = event.key.toLowerCase()
  const number = Number(event.key)
  const index = pads.findIndex((pad, padIndex) => pad.key.toLowerCase() === key || number === padIndex + 1)
  if (index >= 0) {
    event.preventDefault()
    pressPad(index)
  }
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  if (soundEnabled.value) tone(0, 0.12, 0.035)
}

onMounted(() => {
  bestRound.value = Number(window.localStorage.getItem('pulse-four-best') || 0)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearTimers()
  window.removeEventListener('keydown', onKeydown)
  void audioContext?.close()
})
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="wordmark" href="#home" aria-label="Pulse Four home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>pulse<span class="wordmark-light">four</span></span>
      </a>
      <div class="topbar-right">
        <span class="edition"><span class="live-dot"></span> A little brain training</span>
        <button class="sound-toggle" type="button" :aria-pressed="soundEnabled" @click="toggleSound">
          <span class="sound-icon" aria-hidden="true">{{ soundEnabled ? '◖' : '◌' }}</span>
          <span>{{ soundEnabled ? 'Sound on' : 'Sound off' }}</span>
        </button>
      </div>
    </header>

    <section id="home" class="game-layout" aria-label="Pulse Four game">
      <div class="intro-column">
        <p class="eyebrow"><span class="eyebrow-line"></span> THE SEQUENCE GAME</p>
        <h1>Stay in<br /><span>the rhythm.</span></h1>
        <p class="intro-copy">Four lights. One growing pattern.<br />How far can your focus take you?</p>

        <div class="round-card" aria-live="polite">
          <div class="round-head">
            <span class="card-label">CURRENT ROUND</span>
            <span class="round-status" :class="`status-${game.phase}`">
              <span class="status-dot"></span>{{ game.phase === 'input' ? 'Your turn' : game.phase === 'showing' ? 'Watch' : game.phase === 'over' ? 'Run ended' : 'Ready' }}
            </span>
          </div>
          <div class="round-value">{{ stepCount || '—' }}<span v-if="game.phase === 'over'" class="round-over"> / {{ stepCount }}</span></div>
          <div class="round-foot">
            <span class="tiny-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
            <span>{{ message }}</span>
          </div>
          <div class="progress-track" aria-label="Sequence progress">
            <span :style="{ width: `${game.phase === 'input' && stepCount ? (game.inputIndex / stepCount) * 100 : game.phase === 'showing' ? 16 : 0}%` }"></span>
          </div>
        </div>

        <div class="best-line">
          <span class="best-icon" aria-hidden="true">✦</span>
          <span><span class="best-label">PERSONAL BEST</span><strong>{{ bestRound }} <small>{{ bestRound === 1 ? 'round' : 'rounds' }}</small></strong></span>
          <span class="best-divider"></span>
          <span class="best-caption">Your best<br />streak, saved here.</span>
        </div>

        <div class="controls-note">
          <span class="keyboard-icon" aria-hidden="true">⌘</span>
          <p>Play with your keyboard<br /><kbd>Q</kbd> <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> or <kbd>1</kbd>–<kbd>4</kbd><br /><span>Press <kbd>R</kbd> to restart anytime</span></p>
        </div>
      </div>

      <div class="board-column">
        <div class="board-topline">
          <span class="board-caption">THE PLAYING FIELD</span>
          <span class="round-chip"><span class="chip-pulse"></span> {{ game.phase === 'ready' ? 'ROUND 00' : `ROUND ${String(stepCount).padStart(2, '0')}` }}</span>
        </div>

        <div class="game-board" :class="{ 'board-active': isPlaying }">
          <button
            v-for="(pad, index) in pads"
            :key="pad.name"
            class="pad"
            :class="[`pad-${pad.color}`, { lit: activePad === index }]"
            type="button"
            :aria-label="`${pad.name} pad, key ${pad.key}`"
            :aria-pressed="activePad === index"
            @click="pressPad(index)"
          >
            <span class="pad-glyph" aria-hidden="true">{{ pad.icon }}</span>
            <span class="pad-name">{{ pad.name }}</span>
            <span class="pad-key">{{ pad.key }} <i>·</i> {{ index + 1 }}</span>
          </button>
          <div class="board-center" aria-hidden="true">
            <span class="center-orbit orbit-one"></span>
            <span class="center-orbit orbit-two"></span>
            <span class="center-core"><span class="center-brand">P<span>·</span>4</span><span class="center-word">PULSE<br />FOUR</span></span>
          </div>
        </div>

        <div class="board-footer">
          <div class="sequence-dots" aria-hidden="true">
            <span v-for="dot in 4" :key="dot" :class="{ reached: game.phase === 'input' && game.inputIndex >= dot }"></span>
          </div>
          <span>{{ game.phase === 'over' ? 'Pattern lost' : isPlaying ? 'Listen · remember · repeat' : 'Ready to find your flow?' }}</span>
          <span class="footer-spark" aria-hidden="true">✳</span>
        </div>

        <button class="start-button" type="button" @click="startGameNow">
          <span>{{ game.phase === 'ready' ? 'Start a new game' : game.phase === 'over' ? 'Play again' : 'Restart game' }}</span>
          <span class="button-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
    </section>

    <footer class="page-footer">
      <span>MADE FOR CURIOUS MINDS</span>
      <span class="footer-center"><span class="footer-star">✳</span> Take a breath. Find the beat.</span>
      <span>01 — 04 <span class="footer-dash">/</span> FOCUS</span>
    </footer>
  </main>
</template>
