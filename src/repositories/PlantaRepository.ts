import { Luminosidade, Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};

export const findAllPlantas = async (filters?: {
    luminosidade?: Luminosidade;
    petFriendly?: boolean;
    nome?: string;
    ordem?: "preco" | "nome";
}) => {
    return await prisma.planta.findMany({
        where: {
            luminosidade: filters?.luminosidade,
            petFriendly: filters?.petFriendly,
            nome: filters?.nome
                ? {
                      contains: filters.nome,
                      mode: "insensitive",
                  }
                : undefined,
        },
        orderBy: filters?.ordem
            ? {
                  [filters.ordem]: "asc",
              }
            : undefined,
    });
};

export const findPlantasEsgotadas = async () => {
    return await prisma.planta.findMany({
        where: {
            estoque: 0,
        },
    });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};

// Diminui o estoque apenas se ainda houver quantidade suficiente no momento exato da atualização
// (resolve o problema de duas pessoas tentarem comprar o último vaso ao mesmo tempo!)
export const venderPlanta = async (id: number, quantidade: number) => {
    const resultado = await prisma.planta.updateMany({
        where: {
            id: id,
            estoque: {
                gte: quantidade,
            },
        },
        data: {
            estoque: {
                decrement: quantidade,
            },
        },
    });

    if (resultado.count === 0) {
        return null;
    }

    return await prisma.planta.findUnique({
        where: { id: id },
    });
};

// Soma uma nova quantidade de vasos ao estoque atual da planta
export const reporEstoquePlanta = async (id: number, quantidade: number) => {
    return await prisma.planta.update({
        where: { id: id },
        data: {
            estoque: {
                increment: quantidade,
            },
        },
    });
};

// Busca apenas preco e estoque de todas as plantas para o cálculo do valor total
export const findAllPlantasPrecoEEstoque = async () => {
    return await prisma.planta.findMany({
        select: {
            preco: true,
            estoque: true,
        },
    });
};
