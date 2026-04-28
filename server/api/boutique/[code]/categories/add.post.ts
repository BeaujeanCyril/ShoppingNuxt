import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const name = (body?.name as string || '').trim()
  const emoji = (body?.emoji as string) || '🏷️'

  if (!code || !name) {
    throw createError({ statusCode: 400, message: 'Code boutique et nom requis' })
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  // Position = max + 1
  const last = await prisma.category.findFirst({
    where: { boutiqueId: boutique.id },
    orderBy: { position: 'desc' }
  })
  const position = (last?.position ?? -1) + 1

  return await prisma.category.create({
    data: { name, emoji, position, boutiqueId: boutique.id }
  })
})
