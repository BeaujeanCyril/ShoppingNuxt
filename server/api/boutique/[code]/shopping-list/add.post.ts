import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

function normalizeName(raw: string): string {
  const t = raw.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const magasinId = parseInt(body?.magasinId)
  const rawName = body?.name as string
  const quantity = parseInt(body?.quantity)
  const categoryId = body?.categoryId ? parseInt(body.categoryId) : null

  if (!code || !magasinId || !rawName || !rawName.trim() || !quantity || quantity < 1) {
    throw createError({ statusCode: 400, message: 'Données invalides' })
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  const magasin = await prisma.magasin.findFirst({
    where: { id: magasinId, boutiqueId: boutique.id }
  })
  if (!magasin) {
    throw createError({ statusCode: 404, message: 'Magasin non trouvé' })
  }

  const name = normalizeName(rawName)

  // Recherche d'un item existant (case-insensitive) dans ce magasin
  const existing = await prisma.item.findFirst({
    where: {
      magasinId,
      name: { equals: name, mode: 'insensitive' }
    }
  })

  if (existing) {
    // Item existant : on incrémente requestedQuantity (sans toucher à idealQuantity ni à currentQuantity).
    const updated = await prisma.item.update({
      where: { id: existing.id },
      data: {
        requestedQuantity: existing.requestedQuantity + quantity,
        // Si on fournit une catégorie et que l'item n'en a pas, on la pose
        ...(categoryId && !existing.categoryId ? { categoryId } : {})
      }
    })
    const entry = await prisma.shoppingListEntry.create({
      data: { itemId: existing.id, quantity }
    })
    return { item: updated, created: false, entryId: entry.id }
  }

  // Création : pas de QI (idealQuantity=0), seulement un besoin ponctuel
  const created = await prisma.item.create({
    data: {
      name,
      idealQuantity: 0,
      currentQuantity: 0,
      requestedQuantity: quantity,
      magasinId,
      categoryId
    }
  })
  const entry = await prisma.shoppingListEntry.create({
    data: { itemId: created.id, quantity }
  })
  return { item: created, created: true, entryId: entry.id }
})
