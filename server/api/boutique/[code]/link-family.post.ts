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

  const body = await readBody(event)
  const { familyCode } = body || {}

  if (!familyCode || typeof familyCode !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Le champ "familyCode" est requis'
    })
  }

  const boutique = await findBoutique(code)

  if (!boutique) {
    throw createError({
      statusCode: 404,
      message: 'Boutique non trouvée'
    })
  }

  const updated = await prisma.boutique.update({
    where: { id: boutique.id },
    data: { familyCode }
  })

  return updated
})
