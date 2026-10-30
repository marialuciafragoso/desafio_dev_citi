import { Luminosidade, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Limpa as plantas anteriores para que o seed possa ser rodado várias vezes sem duplicar
    await prisma.planta.deleteMany();

    const plantasExemplo = [
      {
        nome: "Costela-de-adão",
        especie: "Monstera deliciosa",
        preco: 8990,
        estoque: 12,
        luminosidade: Luminosidade.MEIA_SOMBRA,
        petFriendly: false,
        regaACadaDias: 3,
      },
      {
        nome: "Samambaia Americana",
        especie: "Nephrolepis exaltata",
        preco: 4500,
        estoque: 0, // Planta esgotada para testar GET /plantas/esgotadas
        luminosidade: Luminosidade.MEIA_SOMBRA,
        petFriendly: true,
        regaACadaDias: 2,
      },
      {
        nome: "Espada-de-são-jorge",
        especie: "Dracaena trifasciata",
        preco: 3500,
        estoque: 20,
        luminosidade: Luminosidade.SOL_PLENO,
        petFriendly: false,
        regaACadaDias: 10,
      },
      {
        nome: "Maranta Calathea",
        especie: "Calathea orbifolia",
        preco: 6200,
        estoque: 5,
        luminosidade: Luminosidade.SOMBRA,
        petFriendly: true,
        regaACadaDias: 3,
      },
    ];

    await prisma.planta.createMany({
      data: plantasExemplo,
    });

    console.log(`Seed concluído: ${plantasExemplo.length} plantas cadastradas com sucesso!`);
  } catch (error) {
    console.error("Erro ao executar seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
