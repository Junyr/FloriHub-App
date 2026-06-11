export interface Usuario {
    id:        string;
    nome:      string;
    email:     string;
    role:      "ADMIN" | "VENDEDOR";
    ativo:     boolean;
    criadoEm: string;
}

export interface FormUsuario {
    nome:  string;
    email: string;
    senha: string;
    role:  "ADMIN" | "VENDEDOR";
}

export const FORM_VAZIO_USUARIO: FormUsuario = {
    nome: "", email: "", senha: "", role: "VENDEDOR",
};

export interface VendaItem {
    produtoId:     string;
    produtoNome:   string;
    quantidade:    number;
    precoUnitario: number;
    subTotal:      number;
}

export interface Venda {
    id:          string;
    usuarioId: string;
    valorTotal:  number;
    status:      "ABERTA" | "FINALIZADA" | "CANCELADA";
    dataVenda:   string;
    observacao:  string;
    itens:       VendaItem[];
}

export interface Produto {
    id:                string;
    nome:              string;
    descricao:         string;
    preco:             number;
    quantidadeEstoque: number;
    categoria:         string;
    ativo:             boolean;
}

export interface ItemForm {
    produto:    Produto;
    quantidade: number;
}

export const STATUS_CORES: Record<string, { bg: string; text: string }> = {
    FINALIZADA: { bg: "#d4edd9", text: "#1a5c36" },
    ABERTA:     { bg: "#fef6df", text: "#B8922A" },
    CANCELADA:  { bg: "#fce4df", text: "#8a3a2a" },
};

export interface FormProduto {
    nome:              string;
    descricao:         string;
    preco:             string;
    quantidadeEstoque: string;
    categoria:         string;
}

export const CATEGORIAS = ["Rosa", "Buquê", "Arranjo", "Planta"];

export const CAT_CORES: Record<string, { bg: string; text: string }> = {
    Rosa:    { bg: "#F2DDD9", text: "#C4897A" },
    Buque:   { bg: "#D4EDE0", text: "#2D5A3D" },
    Planta:  { bg: "#e0f0d4", text: "#3a6b2a" },
    Arranjo: { bg: "#fef0d0", text: "#B8922A" },
};

export const FORM_VAZIO: FormProduto = {
    nome: "", descricao: "", preco: "", quantidadeEstoque: "", categoria: "Rosa",
};

export const FILTROS = ["Todos", "ABERTA", "FINALIZADA", "CANCELADA"];

export const ROLE_CORES: Record<string, { bg: string; text: string }> = {
    ADMIN:    { bg: "#D4EDE0", text: "#1C3829" },
    VENDEDOR: { bg: "#EEF7F2", text: "#2D5A3D" },
};

export const brl = (v: number) =>
    "R$ " + v.toFixed(2).replace(".", ",");

export const nomeUsuario = (id: string, usuarios: { id: string; nome: string }[]) => {
    const u = usuarios.find((u) => u.id === id);
    return u ? u.nome : "—";
};

export const nomeProduto = (id: string, produtos: { id: string; nome: string }[]) => {
    const p = produtos.find((p) => p.id === id);
    return p ? p.nome : "—";
};