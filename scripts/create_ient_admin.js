const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'ient@ient.com.br';
    const password = '32013650'; // IMPORTANT: This will be hashed
    const name = 'Admin IENT';
    const role = 'ADMIN';

    console.log(`Criando usuário admin: ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                name,
                role,
            },
            create: {
                email,
                name,
                password: hashedPassword,
                role,
            },
        });
        console.log('Usuário criado com sucesso:', user);
    } catch (e) {
        console.error('Erro ao criar usuário:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
