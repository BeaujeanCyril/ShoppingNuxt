import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code boutique requis'
    })
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'ID magasin requis'
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
      id,
      boutiqueId: boutique.id
    }
  })

  if (!magasin) {
    throw createError({
      statusCode: 404,
      message: 'Magasin non trouvé'
    })
  }

  // Supprimer le magasin (cascade supprime les items)
  await prisma.magasin.delete({
    where: { id }
  })

  return { success: true }
})
