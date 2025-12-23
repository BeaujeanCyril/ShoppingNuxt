import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const magasinId = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { name, idealQuantity } = body

  if (!code || !magasinId) {
    throw createError({
      statusCode: 400,
      message: 'Code boutique et ID magasin requis'
    })
  }

  if (!name || !name.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Le nom de l\'article est requis'
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

  // Créer l'item
  const item = await prisma.item.create({
    data: {
      name: name.trim(),
      idealQuantity: idealQuantity || 1,
      currentQuantity: 0,
      magasinId
    }
  })

  return item
})
