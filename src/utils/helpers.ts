import {router} from "expo-router";

export const handleVoltar = () => {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace("/dashboard");
    }
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

export const parseDateToISO = (str: string): string | undefined => {
    const partes = str.split("/");
    if (partes.length !== 3 || partes[2].length !== 4) return undefined;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
};

export const brl = (v: number) =>
    v.toLocaleString("pt-BR", {
        style:    "currency",
        currency: "BRL",
    });