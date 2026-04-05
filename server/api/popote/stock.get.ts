import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const familyCode = query.familyCode as string | undefined

  if (!code && !familyCode) {
    throw createError({
      statusCode: 400,
      message: 'Le paramètre "code" ou "familyCode" est requis'
    })
  }

  const boutique = await prisma.boutique.findFirst({
    where: code ? { code } : { familyCode },
    include: {
      magasins: {
        include: {
          items: {
            where: { currentQuantity: { gt: 0 } }
          }
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

  const items = boutique.magasins.flatMap(magasin =>
    magasin.items.map(item => ({
      name: item.name,
      currentQuantity: item.currentQuantity,
      idealQuantity: item.idealQuantity,
      magasin: magasin.name
    }))
  )

  return { items }
})
