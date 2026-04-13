import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  const userId = query.userId as string | undefined
  const familyCode = query.familyCode as string | undefined

  if (!code && !userId && !familyCode) {
    throw createError({
      statusCode: 400,
      message: 'Le paramètre "code", "userId" ou "familyCode" est requis'
    })
  }

  let boutique
  if (code || userId) {
    const baseBoutique = await findBoutique((code || userId)!)
    if (baseBoutique) {
      boutique = await prisma.boutique.findUnique({
        where: { id: baseBoutique.id },
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
    }
  } else {
    boutique = await prisma.boutique.findFirst({
      where: { familyCode },
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
  }

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
