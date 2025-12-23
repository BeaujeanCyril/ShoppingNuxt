import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const magasinId = parseInt(getRouterParam(event, 'id') || '0')

  if (!code || !magasinId) {
    throw createError({
      statusCode: 400,
      message: 'Code boutique et ID magasin requis'
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
    },
    include: {
      items: {
        orderBy: { name: 'asc' }
      }
    }
  })

  if (!magasin) {
    throw createError({
      statusCode: 404,
      message: 'Magasin non trouvé'
    })
  }

  return {
    magasin: {
      id: magasin.id,
      name: magasin.name,
      emoji: magasin.emoji
    },
    items: magasin.items
  }
})
