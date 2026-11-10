function createUserService(prisma) {
  async function listOthers(excludeUserId) {
    return prisma.user.findMany({
      where: { id: { not: excludeUserId } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }

  return { listOthers };
}

module.exports = createUserService;
