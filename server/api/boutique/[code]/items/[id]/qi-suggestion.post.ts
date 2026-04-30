import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const itemId = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const action = body?.action as 'accept' | 'dismiss'
  const value = parseInt(body?.value)

  if (!code || !itemId || !action || !value || value < 0) {
    throw createError({ statusCode: 400, message: 'Données invalides' })
  }
  if (action !== 'accept' && action !== 'dismiss') {
    throw createError({ statusCode: 400, message: 'Action invalide' })
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  const item = await prisma.item.findFirst({
    where: { id: itemId, magasin: { boutiqueId: boutique.id } }
  })
  if (!item) {
    throw createError({ statusCode: 404, message: 'Article non trouvé' })
  }

  if (action === 'accept') {
    const updated = await prisma.item.update({
      where: { id: itemId },
      data: { idealQuantity: value, dismissedQiSuggestion: null }
    })
    return { success: true, item: updated }
  }

  // dismiss
  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { dismissedQiSuggestion: value }
  })
  return { success: true, item: updated }
})
