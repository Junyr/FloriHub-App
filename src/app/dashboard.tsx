import {useEffect, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {colors} from "../styles/global";
import {getProdutos, getUsuarios, getVendas, logout} from "../api/api";
import {brl, nomeUsuario, Produto, STATUS_CORES, Usuario, Venda} from "../utils/helpers";
import {router} from "expo-router";

export default function DashboardScreen() {
    const [vendas,   setVendas]   = useState<Venda[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [usuarios,  setUsuarios]  = useState<Usuario[]>([]);
    const [usuarioLogado,  setUsuarioLogado]  = useState<Usuario | null>(null);
    const [load,     setLoad]     = useState(true);
    const [refresh,  setRefresh]  = useState(false);

    const carregar = async () => {
        try {
            const [v, p, u] = await Promise.all([getVendas(), getProdutos(), getUsuarios()]);
            setVendas(v);
            setProdutos(p);
            setUsuarios(u);
        } finally {
            setLoad(false);
            setRefresh(false);
        }
    };

    useEffect(() => {
        AsyncStorage.getItem("florihub_usuario").then((u) => {
            if (u) setUsuarioLogado(JSON.parse(u)); // ← estado separado
        });
        carregar();
    }, []);

    if (load) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    const finalizadas = vendas.filter(v => v.status === "FINALIZADA");
    const receita     = finalizadas.reduce((s, v) => s + v.valorTotal, 0);
    const ticket      = finalizadas.length ? receita / finalizadas.length : 0;
    const abertas     = vendas.filter(v => v.status === "ABERTA").length;
    const semEstoque  = produtos.filter(p => p.ativo && p.quantidadeEstoque === 0).length;
    const criticos    = produtos.filter(p => p.ativo && p.quantidadeEstoque <= 5);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refresh}
                    onRefresh={() => { setRefresh(true); carregar(); }}
                    tintColor={colors.primary}
                />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>🌺 FloriHub</Text>
                        <Text style={styles.headerSub}>
                            Olá, {usuarioLogado?.nome?.split(" ")[0] || "..."} 👋
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                            Alert.alert("Sair", "Deseja encerrar a sessão?", [
                                { text: "Cancelar", style: "cancel" },
                                {
                                    text: "Sair",
                                    style: "destructive",
                                    onPress: async () => {
                                        await logout();
                                        router.replace("/login");
                                    },
                                },
                            ])
                        }
                    >
                        <Text style={styles.logoutText}>Sair</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Métricas */}
            <View style={styles.grid}>
                {[
                    { label: "Receita Total",       value: brl(receita), sub: `${finalizadas.length} finalizadas`, accent: colors.primary     },
                    { label: "Ticket Médio",        value: brl(ticket),  sub: "por venda",                        accent: "#B8922A"          },
                    { label: "Vendas Abertas",      value: abertas,      sub: "em aberto",                        accent: colors.rose        },
                    { label: "Sem Estoque",         value: semEstoque,   sub: "sem reposição",                    accent: colors.primaryDark },
                ].map((m, i) => (
                    <View key={i} style={[styles.metricCard, { borderTopColor: m.accent }]}>
                        <Text style={styles.metricLabel}>{m.label}</Text>
                        <Text style={styles.metricValue}>{String(m.value)}</Text>
                        <Text style={styles.metricSub}>{m.sub}</Text>
                    </View>
                ))}
            </View>

            {/* Atalhos de navegação */}
            <View style={styles.atalhos}>
                <TouchableOpacity
                    style={styles.atalhoBtn}
                    onPress={() => router.push("/produto")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.atalhoEmoji}>🌸</Text>
                    <Text style={styles.atalhoText}>Produtos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.atalhoBtn}
                    onPress={() => router.push("/vendas")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.atalhoEmoji}>🌺</Text>
                    <Text style={styles.atalhoText}>Vendas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.atalhoBtn}
                    onPress={() => {}/*router.push(/*"/usuarios")*/}
                    activeOpacity={0.8}
                >
                    <Text style={styles.atalhoEmoji}>🌱</Text>
                    <Text style={styles.atalhoText}>Usuários</Text>
                </TouchableOpacity>
            </View>

            {/* Vendas recentes */}
            <Text style={styles.section}>Vendas Recentes</Text>
            {vendas.length === 0
                ? <Text style={styles.empty}>Nenhuma venda registrada.</Text>
                : vendas.slice(0, 5).map(v => {
                    return (
                        <View key={v.id} style={styles.vendaRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.vendaNome}>{nomeUsuario(v.usuarioId, usuarios) || "—"}</Text>
                                <Text style={styles.vendaData}>
                                    {new Date(v.dataVenda).toLocaleDateString("pt-BR")}
                                </Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.vendaValor}>{brl(v.valorTotal)}</Text>
                                <View style={[styles.badge, { backgroundColor: STATUS_CORES[v.status].bg }]}>
                                    <Text style={[styles.badgeText, { color: STATUS_CORES[v.status].text }]}>{v.status}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })
            }

            {/* Estoque crítico */}
            <Text style={styles.section}>Estoque Crítico</Text>
            {criticos.length === 0
                ? <Text style={styles.empty}>Nenhum produto crítico.</Text>
                : criticos.map(p => (
                    <View key={p.id} style={styles.estoqueRow}>
                        <Text style={styles.estoqueName}>{p.nome}</Text>
                        <Text style={[styles.estoqueQtd, { color: p.quantidadeEstoque === 0 ? colors.rose : colors.gold }]}>
                            {p.quantidadeEstoque === 0 ? "Esgotado" : `${p.quantidadeEstoque} un.`}
                        </Text>
                    </View>
                ))
            }

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background },
    center:      { flex: 1, justifyContent: "center", alignItems: "center" },
    header:      { backgroundColor: colors.primaryDark, padding: 24, paddingTop: 56 },
    headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
    headerSub:   { fontSize: 14, color: colors.primaryLight },
    grid:        { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
    metricCard:  { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderTopWidth: 4, flex: 1, minWidth: "45%" },
    metricLabel: { fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", color: colors.muted, marginBottom: 6 },
    metricValue: { fontSize: 22, fontWeight: "700", color: colors.primaryDark, marginBottom: 2 },
    metricSub:   { fontSize: 11, color: colors.muted },
    section:     { fontSize: 16, fontWeight: "600", color: colors.primaryDark, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
    empty:       { color: colors.muted, fontSize: 13, paddingHorizontal: 16, marginBottom: 8 },
    vendaRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#fff" },
    vendaNome:   { fontSize: 13, fontWeight: "600", color: colors.text },
    vendaData:   { fontSize: 11, color: colors.muted, marginTop: 2 },
    vendaValor:  { fontSize: 14, fontWeight: "600", color: colors.primaryDark },
    badge:       { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 4 },
    badgeText:   { fontSize: 10, fontWeight: "600" },
    estoqueRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#fff" },
    estoqueName: { fontSize: 13, color: colors.text, flex: 1 },
    estoqueQtd:  { fontSize: 13, fontWeight: "600" },
    atalhos:    { flexDirection: "row", padding: 16, gap: 12, marginBottom: 8 },
    atalhoBtn:  { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    atalhoEmoji:{ fontSize: 28, marginBottom: 6 },
    atalhoText: { fontSize: 13, fontWeight: "600", color: colors.primaryDark },
    headerRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    logoutBtn:  { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});