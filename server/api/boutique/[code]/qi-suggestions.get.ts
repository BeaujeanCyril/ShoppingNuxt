import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

interface Suggestion {
  itemId: number
  itemName: string
  magasinId: number
  magasinName: string
  magasinEmoji: string
  currentIdeal: number
  suggestedIdeal: number
  sampleSize: number
  reason: 'create' | 'adjust'
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  if (!code) {
    throw createError({ statusCode: 400, message: 'Code boutique requis' })
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  // Fenêtre de 3 mois
  const since = new Date()
  since.setMonth(since.getMonth() - 3)

  // Récupère les items de la boutique avec leurs entrées de liste de course récentes (non annulées)
  const items = await prisma.item.findMany({
    where: { magasin: { boutiqueId: boutique.id } },
    include: {
      magasin: { select: { id: true, name: true, emoji: true } },
      shoppingEntries: {
        where: {
          createdAt: { gte: since },
          revertedAt: null
        },
        select: { quantity: true }
      }
    }
  })

  const MIN_SAMPLES = 3
  const STABILITY_THRESHOLD = 0.4 // coefficient de variation max
  const ADJUST_DIFF_THRESHOLD = 0.3 // 30% d'écart pour suggérer un ajustement

  const suggestions: Suggestion[] = []

  for (const item of items) {
    const quantities = item.shoppingEntries.map(e => e.quantity)
    if (quantities.length < MIN_SAMPLES) continue

    const med = Math.round(median(quantities))
    if (med <= 0) continue

    // Stabilité : coefficient de variation
    const mean = quantities.reduce((s, v) => s + v, 0) / quantities.length
    if (mean > 0) {
      const cv = stdev(quantities) / mean
      if (cv >= STABILITY_THRESHOLD) continue
    }

    // Ne pas re-proposer une suggestion déjà rejetée à la même valeur
    if (item.dismissedQiSuggestion === med) continue

    if (item.idealQuantity === 0) {
      // Cas 1 : pas de QI, suggérer la création
      suggestions.push({
        itemId: item.id,
        itemName: item.name,
        magasinId: item.magasin.id,
        magasinName: item.magasin.name,
        magasinEmoji: item.magasin.emoji,
        currentIdeal: 0,
        suggestedIdeal: med,
        sampleSize: quantities.length,
        reason: 'create'
      })
    } else {
      // Cas 2 : QI existante, suggérer si l'écart est significatif
      const diff = Math.abs(med - item.idealQuantity) / item.idealQuantity
      if (diff > ADJUST_DIFF_THRESHOLD) {
        suggestions.push({
          itemId: item.id,
          itemName: item.name,
          magasinId: item.magasin.id,
          magasinName: item.magasin.name,
          magasinEmoji: item.magasin.emoji,
          currentIdeal: item.idealQuantity,
          suggestedIdeal: med,
          sampleSize: quantities.length,
          reason: 'adjust'
        })
      }
    }
  }

  return suggestions
})
