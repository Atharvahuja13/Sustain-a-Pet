import { daysBetween, START_HEALTH, taskCount } from './engine.js'

export const PETS = [
  { id: 'leafling', name: 'Leafling', cost: 50 },
  { id: 'mossy', name: 'Mossy', cost: 50 },
  { id: 'sunbud', name: 'Sunbud', cost: 50 },
]
export const DECOR = [
  { id: 'lantern', name: 'Firefly lantern', icon: '🏮', cost: 25 },
  { id: 'planter', name: 'Wildflower planter', icon: '🌷', cost: 35 },
  { id: 'bench', name: 'Garden bench', icon: '🪑', cost: 45 },
]
export const AREAS = [
  { id: 'meadow', name: 'Little Meadow', cost: 0, requires: null, description: 'The beginning of a greener home.' },
  { id: 'pond', name: 'Willow Pond', cost: 55, requires: 'flowerbed', description: 'A quiet waterside retreat.' },
  { id: 'grove', name: 'Amber Grove', cost: 90, requires: 'bridge', description: 'A woodland waiting to flourish.' },
]
export const RESTORATIONS = [
  { id: 'flowerbed', area: 'meadow', name: 'Restore the flowerbed', cost: 35, requires: null },
  { id: 'bridge', area: 'pond', name: 'Mend the woodland bridge', cost: 50, requires: 'flowerbed' },
  { id: 'tree', area: 'grove', name: 'Revive the wishing tree', cost: 75, requires: 'bridge' },
]
export const QUESTS = [
  { id: 'three', name: 'Small steps', target: 3, reward: 15 },
  { id: 'eight', name: 'A greener day', target: 8, reward: 30 },
]
export const ownsPet = (s, id) => s.activePet === id || Boolean(s.pets[id])
const canSpend = (s, n) => s.coins >= n

export function claimGift(s, today) {
  if (s.gifts.includes(today) || (s.gifts.at(-1) && daysBetween(s.gifts.at(-1), today) <= 0)) return s
  const streak = s.gifts.at(-1) && daysBetween(s.gifts.at(-1), today) === 1 ? s.streak + 1 : 1
  return { ...s, gifts: [...s.gifts, today], streak, coins: s.coins + 20 + Math.min(streak - 1, 6) * 5 }
}
export function claimQuest(s, id, today) {
  const q = QUESTS.find((q) => q.id === id), key = `${today}:${id}`
  if (!q || taskCount(s, today) < q.target || s.questClaims.includes(key)) return s
  return { ...s, coins: s.coins + q.reward, questClaims: [...s.questClaims, key] }
}
export function buyDecor(s, id) {
  const item = DECOR.find((d) => d.id === id)
  if (!item || s.owned.includes(id) || !canSpend(s, item.cost)) return s
  return { ...s, coins: s.coins - item.cost, owned: [...s.owned, id] }
}
export function placeDecor(s, id, slot) {
  if (!s.owned.includes(id) || !['left', 'center', 'right', null].includes(slot)) return s
  const placements = { ...s.placements }
  for (const key of Object.keys(placements)) if (placements[key] === id) delete placements[key]
  if (slot) placements[`${s.area}:${slot}`] = id
  return { ...s, placements }
}
export function restore(s, id) {
  const r = RESTORATIONS.find((r) => r.id === id)
  if (!r || !s.areas.includes(r.area) || s.restored.includes(id) || (r.requires && !s.restored.includes(r.requires)) || !canSpend(s, r.cost)) return s
  return { ...s, coins: s.coins - r.cost, restored: [...s.restored, id] }
}
export function visitArea(s, id) {
  const a = AREAS.find((a) => a.id === id)
  if (!a) return s
  if (s.areas.includes(id)) return s.area === id ? s : { ...s, area: id }
  if ((a.requires && !s.restored.includes(a.requires)) || !canSpend(s, a.cost)) return s
  return { ...s, coins: s.coins - a.cost, areas: [...s.areas, id], area: id }
}
export function selectPet(s, id, today) {
  const p = PETS.find((p) => p.id === id)
  if (!p || s.activePet === id || (!ownsPet(s, id) && !canSpend(s, p.cost))) return s
  const current = { pet: s.pet, xp: s.xp, health: s.health }
  const next = s.pets[id] ?? { pet: { name: p.name, sprite: id, createdOn: today }, xp: 0, health: START_HEALTH }
  return { ...s, ...next, activePet: id, pets: { ...s.pets, [s.activePet]: current }, coins: s.coins - (ownsPet(s, id) ? 0 : p.cost) }
}
