import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code } = body

  if (!name || !name.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Le nom de la boutique est requis'
    })
  }

  // Valider le code PIN (6 chiffres)
  if (!code || !/^\d{6}$/.test(code)) {
    throw createError({
      statusCode: 400,
      message: 'Le code PIN doit contenir exactement 6 chiffres'
    })
  }

  // Vérifier que le code n'existe pas déjà
  const existing = await prisma.boutique.findUnique({ where: { code } })
  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Ce code PIN est déjà utilisé. Choisissez un autre code.'
    })
  }

  // Créer la boutique
  const boutique = await prisma.boutique.create({
    data: {
      name: name.trim(),
      code
    }
  })

  return boutique
})
