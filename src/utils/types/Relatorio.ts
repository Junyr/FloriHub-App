export interface Relatorio {
    geradoEm:    string;
    totalVendas: number;
    valorTotal:  number;
    ticketMedio: number;
    vendas:      VendaResumo[];
    topProdutos: TopProduto[];
}

interface TopProduto {
    nomeProduto:      string;
    quantidadeVendida: number;
    valorTotal:       number;
}

interface VendaResumo {
    vendaId:    string;
    dataVenda:  string;
    cliente:    string;
    vendedor:   string;
    status:     string;
    valorTotal: number;
}