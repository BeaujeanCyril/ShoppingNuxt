import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const magasinId = parseInt(getRouterParam(event, 'id') || '0')
  const itemId = parseInt(getRouterParam(event, 'itemId') || '0')
  const body = await readBody(event)
  const quantity = body?.quantity // Si non défini, on remet au niveau idéal

  if (!code || !magasinId || !itemId) {
    throw createError({
      statusCode: 400,
      message: 'Code boutique, ID magasin et ID item requis'
    })
  }

  // Vérifier que la boutique existe
  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({
      statusCode: 404,
      message: 'Boutique non trouvée'
    })
  }

  // Vérifier que le magasin appartient à cette boutique
  const magasin = await prisma.magasin.findFirst({
    where: {
      id: magasinId,
      boutiqueId: boutique.id
    }
  })

  if (!magasin) {
    throw createError({
      statusCode: 404,
      message: 'Magasin non trouvé'
    })
  }

  // Vérifier que l'item appartient à ce magasin
  const existingItem = await prisma.item.findFirst({
    where: {
      id: itemId,
      magasinId
    }
  })

  if (!existingItem) {
    throw createError({
      statusCode: 404,
      message: 'Article non trouvé'
    })
  }

  // Remettre la quantité : si fournie, on la prend telle quelle ;
  // sinon on couvre à la fois l'objectif de stock et la demande ponctuelle.
  // À chaque restock, requestedQuantity est remis à 0 (la liste est consommée).
  const newQuantity = quantity !== undefined
    ? Math.max(0, quantity)
    : Math.max(existingItem.idealQuantity, existingItem.currentQuantity + existingItem.requestedQuantity)

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      currentQuantity: newQuantity,
      requestedQuantity: 0
    }
  })

  return item
})
