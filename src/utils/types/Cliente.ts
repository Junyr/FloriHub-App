export interface Cliente {
    id:           string;
    nome:         string;
    cpfCnpj?:     string;
    telefone?:    string;
    email?:       string;
    endereco?:    Endereco;
    observacoes?: string;
    ativo:        boolean;
}

export interface Endereco {
    cep?:         string;
    logradouro?:  string;
    numero?:      string;
    complemento?: string;
    bairro?:      string;
    cidade?:      string;
    uf?:          string;
}

export interface FormCliente {
    nome:         string;
    cpfCnpj:      string;
    telefone:     string;
    email:        string;
    observacoes:  string;
    // ← endereço
    cep:          string;
    logradouro:   string;
    numero:       string;
    complemento:  string;
    bairro:       string;
    cidade:       string;
    uf:           string;
}

export const FORM_VAZIO_CLIENTE: FormCliente = {
    nome: "", cpfCnpj: "", telefone: "", email: "", observacoes: "",
    cep: "", logradouro: "", numero: "", complemento: "",
    bairro: "", cidade: "", uf: "",
};