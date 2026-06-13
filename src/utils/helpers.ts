import {router} from "expo-router";

export interface TopProduto {
    nomeProduto:      string;
    quantidadeVendida: number;
    valorTotal:       number;
}

export interface VendaResumo {
    vendaId:    string;
    dataVenda:  string;
    cliente:    string;
    vendedor:   string;
    status:     string;
    valorTotal: number;
}

export interface Relatorio {
    geradoEm:    string;
    totalVendas: number;
    valorTotal:  number;
    ticketMedio: number;
    vendas:      VendaResumo[];
    topProdutos: TopProduto[];
}

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
    id:           string;
    usuarioId:    string;
    nomeVendedor: string;
    clienteId:    string;
    nomeCliente:  string;
    valorTotal:   number;
    status:       "ABERTA" | "FINALIZADA" | "CANCELADA";
    dataVenda:    string;
    observacao:   string;
    itens:        VendaItem[];
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

export const handleVoltar = () => {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace("/dashboard");
    }
};

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

export const mascaraData = (texto: string) => {
    // Remove tudo que não é número
    const numeros = texto.replace(/\D/g, "");

    // Aplica a máscara DD/MM/AAAA
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
};

export const parseData = (str: string, fimDoDia = false) => {
    const partes = str.split("/");
    if (partes.length !== 3 || partes[2].length !== 4) return null;
    const [dia, mes, ano] = partes;
    const data = new Date(`${ano}-${mes}-${dia}${fimDoDia ? "T23:59:59" : "T00:00:00"}`);
    return isNaN(data.getTime()) ? null : data;
};

export const brl = (v: number) =>
    v.toLocaleString("pt-BR", {
        style:    "currency",
        currency: "BRL",
    });

export const nomeUsuario = (
    id: string,
    usuarios: { id: string; nome: string }[],
    usuarioLogado?: Usuario | null
) => {
    // ADMIN — procura na lista completa
    const u = usuarios.find((u) => u.id === id);
    if (u) return u.nome;

    // VENDEDOR — é sempre ele mesmo
    if (usuarioLogado?.id === id) return usuarioLogado.nome;

    return "—";
};

export const nomeProduto = (id: string, produtos: { id: string; nome: string }[]) => {
    const p = produtos.find((p) => p.id === id);
    return p ? p.nome : "—";
};