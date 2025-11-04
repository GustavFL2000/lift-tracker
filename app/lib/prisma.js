import { PrismaClient } from "@prisma/client";

let prismaClientInstance;

export function getPrisma() {
  if (prismaClientInstance) return prismaClientInstance;
  if (process.env.NODE_ENV === "production") {
    prismaClientInstance = new PrismaClient();
  } else {
    if (!global.prismaClientInstance) {
      global.prismaClientInstance = new PrismaClient();
    }
    prismaClientInstance = global.prismaClientInstance;
  }
  return prismaClientInstance;
}



