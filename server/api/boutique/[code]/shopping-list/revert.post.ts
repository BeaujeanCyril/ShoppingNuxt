import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const itemId = parseInt(body?.itemId)
  const quantity = parseInt(body?.quantity)
  const created = !!body?.created

  if (!code || !itemId || !quantity || quantity < 1) {
    throw createError({ statusCode: 400, message: 'Données invalides' })
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      magasin: { boutiqueId: boutique.id }
    }
  })
  if (!item) {
    throw createError({ statusCode: 404, message: 'Article non trouvé' })
  }

  const entryId = body?.entryId ? parseInt(body.entryId) : null

  if (created) {
    // L'item avait été créé pour la liste : on le supprime (cascade ShoppingListEntry).
    await prisma.item.delete({ where: { id: itemId } })
    return { success: true, deleted: true }
  }

  // L'item existait déjà : on décrémente requestedQuantity (clampé à 0).
  const newRequested = Math.max(0, item.requestedQuantity - quantity)
  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { requestedQuantity: newRequested }
  })

  // Marque l'entrée d'historique correspondante comme annulée pour ne pas biaiser l'analyse
  if (entryId) {
    await prisma.shoppingListEntry.updateMany({
      where: { id: entryId, itemId },
      data: { revertedAt: new Date() }
    })
  }

  return { success: true, deleted: false, item: updated }
})
