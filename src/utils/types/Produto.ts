export interface Produto {
    id:                string;
    nome:              string;
    descricao:         string;
    preco:             number;
    quantidadeEstoque: number;
    categoria:         string;
    ativo:             boolean;
}

export interface FormProduto {
    nome:              string;
    descricao:         string;
    preco:             string;
    quantidadeEstoque: string;
    categoria:         string;
}

export const FORM_VAZIO: FormProduto = {
    nome: "", descricao: "", preco: "", quantidadeEstoque: "", categoria: "Rosa",
};

export const CATEGORIAS = ["Rosa", "Buquê", "Arranjo", "Planta"];

export const CATEGORIAS_CORES: Record<string, { bg: string; text: string }> = {
    Rosa:    { bg: "#F2DDD9", text: "#C4897A" },
    Buque:   { bg: "#D4EDE0", text: "#2D5A3D" },
    Planta:  { bg: "#e0f0d4", text: "#3a6b2a" },
    Arranjo: { bg: "#fef0d0", text: "#B8922A" },
};

