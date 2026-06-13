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

export const FORM_VAZIO: FormUsuario = {
    nome: "", email: "", senha: "", role: "VENDEDOR",
};

export const ROLE_CORES: Record<string, { bg: string; text: string }> = {
    ADMIN:    { bg: "#D4EDE0", text: "#1C3829" },
    VENDEDOR: { bg: "#EEF7F2", text: "#2D5A3D" },
};
