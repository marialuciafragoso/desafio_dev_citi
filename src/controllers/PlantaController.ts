import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

// cadastrar planta nova (POST /plantas)
export const createPlanta = async (req: Request, res: Response) => {
  try {
    const {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    } = req.body;

    // 1. Verifica se todos os campos foram enviados
    if (
      nome === undefined ||
      especie === undefined ||
      preco === undefined ||
      estoque === undefined ||
      luminosidade === undefined ||
      petFriendly === undefined ||
      regaACadaDias === undefined
    ) {
      return res.status(400).json({
        message: "Todos os campos são obrigatórios no cadastro.",
      });
    }

    // 2. Valida textos (nome e especie)
    if (typeof nome !== "string" || nome.trim() === "") {
      return res.status(400).json({
        message: "O campo 'nome' deve ser um texto não vazio.",
      });
    }

    if (typeof especie !== "string" || especie.trim() === "") {
      return res.status(400).json({
        message: "O campo 'especie' deve ser um texto não vazio.",
      });
    }

    // 3. Valida inteiros e regras de valores (preco, estoque, regaACadaDias)
    if (!Number.isInteger(preco) || preco <= 0) {
      return res.status(400).json({
        message: "O campo 'preco' deve ser um número inteiro maior que zero.",
      });
    }

    if (!Number.isInteger(estoque) || estoque < 0) {
      return res.status(400).json({
        message: "O campo 'estoque' deve ser um número inteiro maior ou igual a zero.",
      });
    }

    if (!Number.isInteger(regaACadaDias) || regaACadaDias < 1) {
      return res.status(400).json({
        message: "O campo 'regaACadaDias' deve ser um número inteiro maior ou igual a 1.",
      });
    }

    // 4. Valida enum (luminosidade) e booleano (petFriendly)
    if (!Object.values(Luminosidade).includes(luminosidade)) {
      return res.status(400).json({
        message: "O campo 'luminosidade' deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
      });
    }

    if (typeof petFriendly !== "boolean") {
      return res.status(400).json({
        message: "O campo 'petFriendly' deve ser um valor booleano (true ou false).",
      });
    }

    // 5. Cria a planta no banco de dados
    const planta = await PlantaRepository.createPlanta({
      nome: nome.trim(),
      especie: especie.trim(),
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};

// listar todas as plantas cadastradas com filtros e ordenação opcionais (GET /plantas)
export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly, nome, ordem } = req.query;

    let luminosidadeFiltro: Luminosidade | undefined = undefined;
    if (luminosidade !== undefined) {
      if (
        typeof luminosidade !== "string" ||
        !Object.values(Luminosidade).includes(luminosidade as Luminosidade)
      ) {
        return res.status(400).json({
          message: "Filtro 'luminosidade' inválido. Use SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
        });
      }
      luminosidadeFiltro = luminosidade as Luminosidade;
    }

    let petFriendlyFiltro: boolean | undefined = undefined;
    if (petFriendly !== undefined) {
      if (petFriendly !== "true" && petFriendly !== "false") {
        return res.status(400).json({
          message: "Filtro 'petFriendly' inválido. Use true ou false.",
        });
      }
      petFriendlyFiltro = petFriendly === "true";
    }

    let nomeFiltro: string | undefined = undefined;
    if (nome !== undefined) {
      if (typeof nome !== "string" || nome.trim() === "") {
        return res.status(400).json({
          message: "Filtro 'nome' inválido. Informe um texto não vazio.",
        });
      }
      nomeFiltro = nome.trim();
    }

    let ordemFiltro: "preco" | "nome" | undefined = undefined;
    if (ordem !== undefined) {
      if (ordem !== "preco" && ordem !== "nome") {
        return res.status(400).json({
          message: "Parâmetro 'ordem' inválido. Use 'preco' ou 'nome'.",
        });
      }
      ordemFiltro = ordem;
    }

    const plantas = await PlantaRepository.findAllPlantas({
      luminosidade: luminosidadeFiltro,
      petFriendly: petFriendlyFiltro,
      nome: nomeFiltro,
      ordem: ordemFiltro,
    });

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar plantas." });
  }
};

// Listar todas as plantas esgotadas, ou seja, com estoque igual a 0 (GET /plantas/esgotadas)
export const readPlantasEsgotadas = async (req: Request, res: Response) => {
  try {
    const plantasEsgotadas = await PlantaRepository.findPlantasEsgotadas();

    return res.status(200).json(plantasEsgotadas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar plantas esgotadas." });
  }
};

// Buscar uma única planta pelo ID que vem na URL (GET /plantas/:id)
export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Valida se o id na URL é um número inteiro positivo (ex: recusa /plantas/abc ou /plantas/0)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

// Editar apenas os campos que o cliente enviou (PATCH /plantas/:id)
export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    } = req.body;

    // No PATCH, nenhum campo é obrigatório, mas os que forem enviados (diferentes de undefined)
    // precisam seguir exatamente as mesmas regras de negócio do cadastro:
    if (nome !== undefined && (typeof nome !== "string" || nome.trim() === "")) {
      return res.status(400).json({
        message: "O campo 'nome' deve ser um texto não vazio.",
      });
    }

    if (especie !== undefined && (typeof especie !== "string" || especie.trim() === "")) {
      return res.status(400).json({
        message: "O campo 'especie' deve ser um texto não vazio.",
      });
    }

    if (preco !== undefined && (!Number.isInteger(preco) || preco <= 0)) {
      return res.status(400).json({
        message: "O campo 'preco' deve ser um número inteiro maior que zero.",
      });
    }

    if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0)) {
      return res.status(400).json({
        message: "O campo 'estoque' deve ser um número inteiro maior ou igual a zero.",
      });
    }

    if (regaACadaDias !== undefined && (!Number.isInteger(regaACadaDias) || regaACadaDias < 1)) {
      return res.status(400).json({
        message: "O campo 'regaACadaDias' deve ser um número inteiro maior ou igual a 1.",
      });
    }

    if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade)) {
      return res.status(400).json({
        message: "O campo 'luminosidade' deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
      });
    }

    if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
      return res.status(400).json({
        message: "O campo 'petFriendly' deve ser um valor booleano (true ou false).",
      });
    }

    // Verifica se a planta existe antes de tentar atualizar
    const plantaExistente = await PlantaRepository.findPlantaById(id);

    if (!plantaExistente) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    const plantaAtualizada = await PlantaRepository.updatePlanta(id, {
      nome: nome !== undefined ? nome.trim() : undefined,
      especie: especie !== undefined ? especie.trim() : undefined,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

// Apagar uma planta do banco (DELETE /plantas/:id)
export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const plantaExistente = await PlantaRepository.findPlantaById(id);

    if (!plantaExistente) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao remover planta." });
  }
};

// Realizar venda de uma planta diminuindo o estoque (POST /plantas/:id/venda)
export const venderPlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const { quantidade } = req.body;

    if (quantidade === undefined || !Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({
        message: "O campo 'quantidade' é obrigatório e deve ser um número inteiro maior que zero.",
      });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    if (planta.estoque < quantidade) {
      return res.status(400).json({
        message: `Estoque insuficiente. Temos só ${planta.estoque} vasos disponíveis.`,
      });
    }

    const plantaAtualizada = await PlantaRepository.venderPlanta(id, quantidade);

    if (!plantaAtualizada) {
      return res.status(400).json({
        message: "Estoque insuficiente para concluir a venda.",
      });
    }

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao processar venda da planta." });
  }
};

// Calcular valor total em centavos e total de vasos do estoque (GET /plantas/estoque/valor-total)
export const getValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findAllPlantasPrecoEEstoque();

    let valorTotalEmCentavos = 0;
    let totalDeVasos = 0;

    for (const planta of plantas) {
      valorTotalEmCentavos += planta.preco * planta.estoque;
      totalDeVasos += planta.estoque;
    }

    return res.status(200).json({
      valorTotalEmCentavos,
      totalDeVasos,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular valor total do estoque." });
  }
};
