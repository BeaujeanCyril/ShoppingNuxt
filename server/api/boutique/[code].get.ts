import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code boutique requis'
    })
  }

  const boutique = await prisma.boutique.findUnique({
    where: { code },
    include: {
      magasins: {
        orderBy: { position: 'asc' },
        include: {
          items: true
        }
      }
    }
  })

  if (!boutique) {
    throw createError({
      statusCode: 404,
      message: 'Boutique non trouvée'
    })
  }

  // Ajouter le compte d'articles à acheter pour chaque magasin
  const magasinsWithCount = boutique.magasins.map(magasin => {
    const itemsToShop = magasin.items.filter(item => item.currentQuantity < item.idealQuantity)
    return {
      ...magasin,
      itemsCount: magasin.items.length,
      shoppingCount: itemsToShop.length
    }
  })

  return {
    ...boutique,
    magasins: magasinsWithCount
  }
})
