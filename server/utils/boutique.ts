import prisma from './db'

export async function findBoutique(codeOrUserId: string) {
  let boutique = await prisma.boutique.findUnique({ where: { keycloakUserId: codeOrUserId } })
  if (!boutique) {
    boutique = await prisma.boutique.findUnique({ where: { code: codeOrUserId } })
  }
  return boutique
}
