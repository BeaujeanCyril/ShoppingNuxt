import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Le paramètre "code" est requis'
    })
  }

  const boutique = await prisma.boutique.findFirst({
    where: { code },
    include: {
      magasins: {
        orderBy: { position: 'asc' }
      }
    }
  })

  if (!boutique) {
    throw createError({
      statusCode: 404,
      message: 'Boutique non trouvée'
    })
  }

  const magasins = boutique.magasins.map(magasin => ({
    id: magasin.id,
    name: magasin.name,
    emoji: magasin.emoji
  }))

  return { magasins }
})
