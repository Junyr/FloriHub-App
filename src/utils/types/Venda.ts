import {Produto} from "@/utils/types/Produto";

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

interface VendaItem {
    produtoId:     string;
    nomeProduto:   string;
    quantidade:    number;
    precoUnitario: number;
    subTotal:      number;
}

export interface ItemForm {
    produto:    Produto;
    quantidade: number;
}

export const FILTROS = ["Todos", "ABERTA", "FINALIZADA", "CANCELADA"];

export const STATUS_CORES: Record<string, { bg: string; text: string }> = {
    FINALIZADA: { bg: "#d4edd9", text: "#1a5c36" },
    ABERTA:     { bg: "#fef6df", text: "#B8922A" },
    CANCELADA:  { bg: "#fce4df", text: "#8a3a2a" },
};