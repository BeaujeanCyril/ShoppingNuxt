import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name } = body

  const list = await prisma.shoppingList.create({
    data: {
      name: name || 'Ma liste'
    },
    include: {
      items: {
        include: {
          item: true
        }
      }
    }
  })

  return list
})
