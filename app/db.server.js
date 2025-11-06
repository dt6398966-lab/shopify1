import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

export default prisma;


// ✅ Correct ESM-compatible Prisma setup for Remix

// import pkg from "@prisma/client";
// const { PrismaClient, Prisma } = pkg;

// // ✅ Safe single-instance setup
// let prisma;

// if (process.env.NODE_ENV !== "production") {
//   if (!global.__db) {
//     global.__db = new PrismaClient();
//   }
//   prisma = global.__db;
// } else {
//   prisma = new PrismaClient();
// }

// export { prisma, Prisma };
