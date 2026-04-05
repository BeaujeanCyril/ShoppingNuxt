import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { code, magasinId, name } = body as { code?: string, magasinId?: number, name?: string }

  if (!code || !magasinId || !name) {
    throw createError({
      statusCode: 400,
      message: 'Les paramètres "code", "magasinId" et "name" sont requis'
    })
  }

  // Vérifier que le magasin appartient bien à la boutique
  const magasin = await prisma.magasin.findFirst({
    where: {
      id: magasinId,
      boutique: { code }
    }
  })

  if (!magasin) {
    throw createError({
      statusCode: 404,
      message: 'Magasin non trouvé pour cette boutique'
    })
  }

  // Chercher un item existant (case-insensitive)
  const existingItem = await prisma.item.findFirst({
    where: {
      magasinId,
      name: { equals: name, mode: 'insensitive' }
    }
  })

  let item

  if (existingItem) {
    item = await prisma.item.update({
      where: { id: existingItem.id },
      data: { idealQuantity: existingItem.idealQuantity + 1 }
    })
  } else {
    item = await prisma.item.create({
      data: {
        name,
        idealQuantity: 1,
        currentQuantity: 0,
        magasinId
      }
    })
  }

  return {
    success: true,
    item: {
      id: item.id,
      name: item.name,
      idealQuantity: item.idealQuantity,
      currentQuantity: item.currentQuantity
    }
  }
})
