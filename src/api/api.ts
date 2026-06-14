import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {router} from "expo-router";

const BASE_URL = Platform.OS === "web"
    ? "http://localhost:8080"      // navegador
    : "http://10.0.2.2:8080";

const TOKEN_KEY = "florihub_token";

export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
const setToken = (t: string) => AsyncStorage.setItem(TOKEN_KEY, t);

async function request(method: string, path: string, body?: object) {
    try {
        const token = await getToken();

        const response = await fetch(BASE_URL + path, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            ...(body && { body: JSON.stringify(body) }),
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (response.status === 401 || response.status === 403) {
            await AsyncStorage.removeItem("florihub_token");
            await AsyncStorage.removeItem("florihub_usuario");
            router.replace("/login");
            throw new Error("Sessão expirada. Faça login novamente.");
        }

        if (!response.ok) {
            throw new Error(data?.message || data?.mensagem || `Erro ${response.status}`);
        }

        return data;

    } catch (e: any) {
        console.error("ERRO:", method, BASE_URL + path, e.message);
        throw e;
    }
}

export async function login(email: string, senha: string) {
    const data = await request("POST", "/auth/login", { email, senha });
    await setToken(data.token);
    await AsyncStorage.setItem("florihub_usuario", JSON.stringify({
        nome:  data.nome,
        email: data.email,
        role:  data.role,
    }));
    return data;
}

export const logout = async () => {
    await AsyncStorage.removeItem("florihub_token");
    await AsyncStorage.removeItem("florihub_usuario");
};

export const getVendas   = () => request("GET", "/vendas");
export const getProdutos = () => request("GET", "/produtos");

export const createProduto = (dados: object) => request("POST", "/produtos", dados);
export const updateProduto = (id: string, dados: object) => request("PUT", `/produtos/${id}`, dados);
export const deleteProduto = (id: string) => request("DELETE", `/produtos/${id}`);

export const createVenda        = (dados: object) => request("POST", "/vendas", dados);
export const updateVendaStatus  = (id: string, status: string) =>
    request("PATCH", `/vendas/${id}/status?status=${status}`);

export const getUsuarios = () => request("GET", "/usuarios");
export const createUsuario = (dados: object) => request("POST", "/usuarios", dados);
export const updateUsuario = (id: string, dados: object) => request("PUT", `/usuarios/${id}`, dados);
export const deleteUsuario = (id: string) => request("DELETE", `/usuarios/${id}`);

export const getRelatorio = (params: {
    inicio?: string;
    fim?: string;
    status?: string;
}) => {
    const query = new URLSearchParams();
    if (params.inicio) query.append("inicio", params.inicio);
    if (params.fim)    query.append("fim",    params.fim);
    if (params.status && params.status !== "Todos") query.append("status", params.status);

    const qs = query.toString();
    return request("GET", `/relatorios/vendas${qs ? "?" + qs : ""}`);
};

export const getRelatorioPdfUrl = (params: {
    inicio?: string;
    fim?: string;
    status?: string;
}) => {
    const query = new URLSearchParams();
    if (params.inicio) query.append("inicio", params.inicio);
    if (params.fim)    query.append("fim",    params.fim);
    if (params.status) query.append("status", params.status);

    const qs = query.toString();
    return `${BASE_URL}/relatorios/vendas.pdf${qs ? "?" + qs : ""}`;
};