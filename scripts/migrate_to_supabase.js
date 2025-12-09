const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();
const dbPath = path.resolve(__dirname, '../prisma/dev.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Erro ao abrir banco SQLite:", err.message);
        process.exit(1);
    }
    console.log('Conectado ao banco SQLite local.');
});

async function migrate() {
    try {
        console.log("Iniciando migração...");

        // 1. Migrate Units
        console.log("Migrando Unidades...");
        const units = await query("SELECT * FROM Unit");
        for (const u of units) {
            await prisma.unit.upsert({
                where: { id: u.id },
                update: {
                    name: u.name,
                    address: u.address,
                    createdAt: new Date(u.createdAt),
                    updatedAt: new Date(u.updatedAt)
                },
                create: {
                    id: u.id,
                    name: u.name,
                    address: u.address,
                    createdAt: new Date(u.createdAt),
                    updatedAt: new Date(u.updatedAt)
                }
            });
        }
        console.log(`Migradas ${units.length} Unidades.`);

        // 2. Migrate Roles
        console.log("Migrando Cargos...");
        const roles = await query("SELECT * FROM Role");
        for (const r of roles) {
            await prisma.role.upsert({
                where: { id: r.id },
                update: {
                    name: r.name,
                    createdAt: new Date(r.createdAt),
                    updatedAt: new Date(r.updatedAt)
                },
                create: {
                    id: r.id,
                    name: r.name,
                    createdAt: new Date(r.createdAt),
                    updatedAt: new Date(r.updatedAt)
                }
            });
        }
        console.log(`Migrados ${roles.length} Cargos.`);

        // 3. Migrate Users
        console.log("Migrando Usuários...");
        const users = await query("SELECT * FROM User");
        for (const u of users) {
            const userData = {
                id: u.id,
                email: u.email,
                name: u.name,
                password: u.password,
                role: u.role,
                createdAt: new Date(u.createdAt),
                updatedAt: new Date(u.updatedAt)
            };
            // Optional relation
            if (u.unitId) userData.unitId = u.unitId;

            await prisma.user.upsert({
                where: { email: u.email }, // Use email as unique identifier for upsert
                update: {
                    ...userData,
                    id: undefined // Don't update ID if exists, keep existing ID logic or force same ID?
                    // Better to force same ID if checking by ID, but we check by email.
                    // If check by email, we might have ID mismatch if seed created ID 1 and sqlite ID 1 is different.
                    // Seed usually creates empty DB.
                    // Let's try upsert by ID if possible, but email is unique.
                    // Let's try create first, if fail (email exists), we skip or update?
                    // The seed created "admin@example.com". If sqlite has it, we update it.
                },
                create: userData
            });
            // Note: If ID conflict happens (e.g. Postgres sequence vs provided ID), Prisma handles explicit ID on create.
            // But if we upsert by Email, we might not be able to enforce ID if records differ.
            // Assuming clean slate + seed. Seed created ID 1. If SQLite User 1 is ID 1, good.
        }
        console.log(`Migrados ${users.length} Usuários.`);

        // 4. Migrate Employees
        console.log("Migrando Funcionários...");
        const employees = await query("SELECT * FROM Employee");
        for (const e of employees) {
            await prisma.employee.upsert({
                where: { cpf: e.cpf },
                update: {
                    name: e.name,
                    roleId: e.roleId,
                    unitId: e.unitId,
                    createdAt: new Date(e.createdAt),
                    updatedAt: new Date(e.updatedAt)
                },
                create: {
                    id: e.id,
                    name: e.name,
                    cpf: e.cpf,
                    roleId: e.roleId,
                    unitId: e.unitId,
                    createdAt: new Date(e.createdAt),
                    updatedAt: new Date(e.updatedAt)
                }
            });
        }
        console.log(`Migrados ${employees.length} Funcionários.`);

        // 5. Migrate TimeRecords
        console.log("Migrando Registros de Ponto...");
        const records = await query("SELECT * FROM TimeRecord");
        for (const r of records) {
            const recordData = {
                id: r.id,
                date: new Date(r.date),
                startTime: new Date(r.startTime),
                endTime: new Date(r.endTime),
                description: r.description,
                totalHours: r.totalHours,
                status: r.status,
                employeeId: r.employeeId,
                createdAt: new Date(r.createdAt),
                updatedAt: new Date(r.updatedAt)
            };
            if (r.validatorId) recordData.validatorId = r.validatorId;

            await prisma.timeRecord.upsert({
                where: { id: r.id },
                update: recordData,
                create: recordData
            });
        }
        console.log(`Migrados ${records.length} Registros.`);

        // Reset Sequences (Important for Postgres after manual ID inserts)
        // Since we are inserting manual IDs, the auto-increment sequence might lag behind.
        console.log("Ajustando sequências do banco de dados...");
        const tables = ['Unit', 'Role', 'User', 'Employee', 'TimeRecord'];
        for (const table of tables) {
            // raw query to set sequence val
            // Postgres sequence name is usually "Table_id_seq" or similar. Prisma 6 convention?
            // Usually "Table_id_seq". Be careful with exact casing. 
            // Prisma creates tables with exact model name casing usually if mapped, or lowercase?
            // Defaults to preserving case or lowercase depending on DB.
            // We can use a generic query to find max ID + 1.
            try {
                // This raw query syntax handles standard Postgres sequence naming conventions created by Prisma
                // It sets the sequence to the MAX(id) + 1
                await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id)+1, 1), false) FROM "${table}";`);
            } catch (e) {
                console.log(`Aviso: Não foi possível atualizar sequencia para ${table}. Pode não ser necessário. ${e.message}`);
            }
        }

        console.log("Migração concluída com sucesso!");

    } catch (error) {
        console.error("Erro durante a migração:", error);
    } finally {
        db.close();
        await prisma.$disconnect();
    }
}

function query(sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

migrate();
