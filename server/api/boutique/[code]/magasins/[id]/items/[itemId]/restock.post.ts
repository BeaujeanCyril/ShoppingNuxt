import prisma from '~/server/utils/db'

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
  const boutique = await prisma.boutique.findUnique({ where: { code } })
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

  // Remettre la quantité au niveau spécifié ou au niveau idéal
  const newQuantity = quantity !== undefined
    ? Math.max(0, quantity)
    : existingItem.idealQuantity

  const item = await prisma.item.update({
    where: { id: itemId },
    data: { currentQuantity: newQuantity }
  })

  return item
})
