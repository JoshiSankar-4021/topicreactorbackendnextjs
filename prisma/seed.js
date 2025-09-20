import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
await prisma.education.createMany({
    data: [
    { educationname: "High School" },
    { educationname: "Bachelor's" },
    { educationname: "Master's" },
    { educationname: "PhD" }
    ],
    skipDuplicates: true
});

await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
    name: "Admin",
    email: "admin@gmail.com",
    password: "admin@1234",
    address: "India",
    phone: "9347175051",
    gender: "M",
    education: 1
    }
});
}

main()
.catch(e => console.error(e))
.finally(async () => prisma.$disconnect());
