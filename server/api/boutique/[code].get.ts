import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code boutique requis'
    })
  }

  const baseBoutique = await findBoutique(code)

  if (!baseBoutique) {
    throw createError({
      statusCode: 404,
      message: 'Boutique non trouvée'
    })
  }

  // Recharger avec les relations
  const boutique = await prisma.boutique.findUnique({
    where: { id: baseBoutique.id },
    include: {
      magasins: {
        orderBy: { position: 'asc' },
        include: {
          items: true
        }
      },
      categories: {
        orderBy: [{ position: 'asc' }, { name: 'asc' }]
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
  // Un item est "à acheter" s'il manque par rapport à l'objectif de stock OU s'il est demandé ponctuellement
  const magasinsWithCount = boutique.magasins.map(magasin => {
    const itemsToShop = magasin.items.filter(item =>
      item.currentQuantity < item.idealQuantity || item.requestedQuantity > 0
    )
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
