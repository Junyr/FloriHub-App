import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:8080";
const TOKEN_KEY = "florihub_token";

const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
const setToken = (t: string) => AsyncStorage.setItem(TOKEN_KEY, t);

async function request(method: string, path: string, body?: object) {
    try {
        const token = await getToken();

        // ← adicione esse log
        console.log("REQUEST:", method, BASE_URL + path);
        console.log("BODY:", JSON.stringify(body));
        console.log("TOKEN:", token);

        const response = await fetch(BASE_URL + path, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            ...(body && { body: JSON.stringify(body) }),
        });

        // ← adicione esse log
        console.log("RESPONSE STATUS:", response.status);

        if (!response.ok) {
            const erro = await response.json().catch(() => ({}));
            console.log("RESPONSE ERROR:", erro);
            throw new Error(erro.message || `Erro ${response.status}`);
        }

        if (response.status === 204) return null;
        return response.json();
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