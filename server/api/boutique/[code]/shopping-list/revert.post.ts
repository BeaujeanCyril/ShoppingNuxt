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

  if (created) {
    // L'item avait été créé pour la liste : on le supprime
    await prisma.item.delete({ where: { id: itemId } })
    return { success: true, deleted: true }
  }

  // L'item existait déjà : on remonte currentQuantity (clampé à idealQuantity)
  const restored = Math.min(item.idealQuantity, item.currentQuantity + quantity)
  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { currentQuantity: restored }
  })
  return { success: true, deleted: false, item: updated }
})
