import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { keycloakUserId, name } = body

  if (!keycloakUserId) {
    throw createError({
      statusCode: 400,
      message: 'keycloakUserId est requis'
    })
  }

  // Chercher une boutique existante par keycloakUserId
  let boutique = await prisma.boutique.findUnique({
    where: { keycloakUserId }
  })

  if (!boutique) {
    // Créer une nouvelle boutique liée au compte Keycloak
    boutique = await prisma.boutique.create({
      data: {
        name: name?.trim() || 'Ma boutique',
        keycloakUserId
      }
    })
  }

  return boutique
})
