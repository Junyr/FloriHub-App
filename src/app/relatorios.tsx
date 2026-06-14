import { useState } from "react";
import {
    View, Text, ScrollView, StyleSheet,
    ActivityIndicator, TouchableOpacity, Platform,
} from "react-native";
import { colors } from "@/styles/global";
import { getRelatorio, getRelatorioPdfUrl, getToken } from "@/api/api";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing   from "expo-sharing";

import {brl, ConfirmState, handleVoltar, mascaraData, parseDateToISO} from "@/utils/helpers";
import { TextInput } from "react-native";
import { Relatorio } from "@/utils/types/Relatorio";
import { STATUS_CORES } from "@/utils/types/Venda";
import ConfirmModal from "@/components/ConfirmModal";

export default function RelatorioScreen() {
    const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
    const [load,      setLoad]      = useState(false);
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim,    setDataFim]    = useState("");
    const [status,     setStatus]     = useState("Todos");
    const [baixando, setBaixando] = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);

    const gerar = async () => {
        setLoad(true);
        try {
            const data = await getRelatorio({
                inicio: dataInicio ? parseDateToISO(dataInicio) : undefined,
                fim:    dataFim    ? parseDateToISO(dataFim)    : undefined,
                status: status !== "Todos" ? status : undefined,
            });
            setRelatorio(data);
        } catch (e: any) {
            setConfirm({
                titulo:      "Erro",
                mensagem:    e.message || "Erro ao gerar relatório.",
                confirmText: "OK",
                perigoso:    false,
                apenasAviso: true,
                onConfirm:   () => setConfirm(null),
            });
        } finally {
            setLoad(false);
        }
    };

    const baixarPdf = async () => {
        setBaixando(true);
        try {
            const token = await getToken();
            const url   = getRelatorioPdfUrl({
                inicio: dataInicio ? parseDateToISO(dataInicio) : undefined,
                fim:    dataFim    ? parseDateToISO(dataFim)    : undefined,
                status: status !== "Todos" ? status : undefined,
            });

            if (Platform.OS === "web") {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Erro ao baixar PDF");

                const blob     = await response.blob();
                const blobUrl  = URL.createObjectURL(blob);
                const link     = document.createElement("a");
                link.href      = blobUrl;
                link.download  = `relatorio-florihub.pdf`;
                link.click();
                URL.revokeObjectURL(blobUrl);
                return;
            }

            const destino = FileSystem.cacheDirectory + "relatorio-florihub.pdf";

            const { uri } = await FileSystem.downloadAsync(url, destino, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const podCompartilhar = await Sharing.isAvailableAsync();
            if (podCompartilhar) {
                await Sharing.shareAsync(uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Relatório FloriHub",
                });
            } else {
                setConfirm({
                    titulo:      "Sucesso",
                    mensagem:    "PDF gerado com sucesso.",
                    confirmText: "OK",
                    perigoso:    false,
                    apenasAviso: true,
                    onConfirm:   () => setConfirm(null),
                });
            }

        } catch (e: any) {
            setConfirm({
                titulo:      "Erro",
                mensagem:    e.message || "Erro ao baixar PDF.",
                confirmText: "OK",
                perigoso:    false,
                apenasAviso: true,
                onConfirm:   () => setConfirm(null),
            });
        } finally {
            setBaixando(false);
        }
    };



    return (
        <View style={styles.container}>
            {confirm && (
                <ConfirmModal
                    visible={true}
                    titulo={confirm.titulo}
                    mensagem={confirm.mensagem}
                    confirmText={confirm.confirmText}
                    perigoso={confirm.perigoso}
                    apenasAviso={confirm.apenasAviso}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleVoltar} activeOpacity={0.8} style={styles.voltarBtn}>
                    <Text style={styles.voltarSeta}>‹</Text>
                    <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📊 Relatório de Vendas</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

                {/* Filtros */}
                <View style={styles.filtrosBox}>
                    <Text style={styles.filtroLabel}>Período</Text>
                    <View style={styles.datas}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Início DD/MM/AAAA"
                            placeholderTextColor={colors.muted}
                            value={dataInicio}
                            onChangeText={t => setDataInicio(mascaraData(t))}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Fim DD/MM/AAAA"
                            placeholderTextColor={colors.muted}
                            value={dataFim}
                            onChangeText={t => setDataFim(mascaraData(t))}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                    </View>

                    <Text style={styles.filtroLabel}>Status</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
                        {["Todos", "ABERTA", "FINALIZADA", "CANCELADA"].map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.statusBtn, status === s && styles.statusBtnAtivo]}
                                onPress={() => setStatus(s)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.statusText, status === s && styles.statusTextAtivo]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.gerarBtn} onPress={gerar} activeOpacity={0.8}>
                        <Text style={styles.gerarBtnText}>
                            {load ? "Gerando…" : "Gerar Relatório"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {load && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />}

                {/* Resultado */}
                {relatorio && !load && (
                    <>
                        {/* Métricas */}
                        <View style={styles.metricas}>
                            <View style={[styles.metricaCard, { borderTopColor: colors.primary }]}>
                                <Text style={styles.metricaLabel}>Total de Vendas</Text>
                                <Text style={styles.metricaValue}>{relatorio.totalVendas}</Text>
                            </View>
                            <View style={[styles.metricaCard, { borderTopColor: "#B8922A" }]}>
                                <Text style={styles.metricaLabel}>Receita Total</Text>
                                <Text style={styles.metricaValue}>{brl(relatorio.valorTotal)}</Text>
                            </View>
                            <View style={[styles.metricaCard, { borderTopColor: colors.rose }]}>
                                <Text style={styles.metricaLabel}>Ticket Médio</Text>
                                <Text style={styles.metricaValue}>{brl(relatorio.ticketMedio)}</Text>
                            </View>
                        </View>

                        {/* Top Produtos */}
                        {relatorio.topProdutos.length > 0 && (
                            <View style={styles.secao}>
                                <Text style={styles.secaoTitulo}>🌸 Top Produtos</Text>
                                {relatorio.topProdutos.map((p, i) => (
                                    <View key={i} style={styles.topRow}>
                                        <View style={styles.topPos}>
                                            <Text style={styles.topPosText}>{i + 1}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.topNome}>{p.nomeProduto}</Text>
                                            <Text style={styles.topQtd}>{p.quantidadeVendida} unidades vendidas</Text>
                                        </View>
                                        <Text style={styles.topValor}>{brl(p.valorTotal)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Vendas do período */}
                        {relatorio.vendas.length > 0 && (
                            <View style={styles.secao}>
                                <Text style={styles.secaoTitulo}>🌺 Vendas do Período</Text>
                                {relatorio.vendas.map((v, i) => {
                                    const sc = STATUS_CORES[v.status] ?? { bg: "#eee", text: "#666" };
                                    return (
                                        <View key={i} style={styles.vendaRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.vendaNome}>{v.cliente || "Consumidor Final"}</Text>
                                                <Text style={styles.vendaInfo}>
                                                    {v.vendedor} • {new Date(v.dataVenda).toLocaleDateString("pt-BR")}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: "flex-end" }}>
                                                <Text style={styles.vendaValor}>{brl(v.valorTotal)}</Text>
                                                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                                                    <Text style={[styles.badgeText, { color: sc.text }]}>{v.status}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <Text style={styles.geradoEm}>
                            Gerado em {new Date(relatorio.geradoEm).toLocaleString("pt-BR")}
                        </Text>
                    </>
                )}

                {/* Botão flutuante de baixar PDF */}
                {!!relatorio && !load && (
                    <TouchableOpacity
                        style={[styles.fab, baixando && { opacity: 0.7 }]}
                        onPress={baixarPdf}
                        disabled={baixando}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.fabText}>
                            {baixando ? "⏳ Baixando…" : "📄 Baixar PDF"}
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Layout base
    container:       { flex: 1, backgroundColor: colors.background },

    // Header
    header:          { backgroundColor: colors.primaryDark, padding: 24, paddingTop: 56 },
    headerTitle:     { fontSize: 22, fontWeight: "700", color: "#fff" },
    voltarBtn:       { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
    voltarSeta:      { fontSize: 28, color: colors.primaryLight, lineHeight: 30, fontWeight: "300" },
    voltarTexto:     { fontSize: 14, color: colors.primaryLight, fontWeight: "500" },

    // Filtros
    filtrosBox:      { backgroundColor: "#fff", margin: 16, borderRadius: 12, padding: 16, elevation: 2 },
    filtroLabel:     { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8, marginTop: 8 },
    datas:           { flexDirection: "row", gap: 8 },
    input:           { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 13, color: colors.text },
    statusRow:       { flexDirection: "row", gap: 8, paddingVertical: 4 },
    statusBtn:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.background },
    statusBtnAtivo:  { backgroundColor: colors.primary },
    statusText:      { fontSize: 12, color: colors.muted, fontWeight: "500" },
    statusTextAtivo: { color: "#fff" },
    gerarBtn:        { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center", marginTop: 16 },
    gerarBtnText:    { color: "#fff", fontWeight: "700", fontSize: 15 },

    // Métricas
    metricas:        { flexDirection: "row", padding: 16, gap: 8 },
    metricaCard:     { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 12, borderTopWidth: 4, elevation: 2 },
    metricaLabel:    { fontSize: 10, color: colors.muted, textTransform: "uppercase", marginBottom: 4 },
    metricaValue:    { fontSize: 14, fontWeight: "700", color: colors.primaryDark },

    // Seções (top produtos e vendas)
    secao:           { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16, elevation: 2 },
    secaoTitulo:     { fontSize: 16, fontWeight: "700", color: colors.primaryDark, marginBottom: 12 },

    // Top Produtos
    topRow:          { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.background, gap: 10 },
    topPos:          { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
    topPosText:      { fontSize: 13, fontWeight: "700", color: colors.primaryDark },
    topNome:         { fontSize: 13, fontWeight: "600", color: colors.primaryDark },
    topQtd:          { fontSize: 11, color: colors.muted, marginTop: 2 },
    topValor:        { fontSize: 13, fontWeight: "700", color: colors.primaryDark },

    // Vendas do período
    vendaRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.background },
    vendaNome:       { fontSize: 13, fontWeight: "600", color: colors.primaryDark },
    vendaInfo:       { fontSize: 11, color: colors.muted, marginTop: 2 },
    vendaValor:      { fontSize: 14, fontWeight: "700", color: colors.primaryDark },
    badge:           { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 4 },
    badgeText:       { fontSize: 10, fontWeight: "600" },
    geradoEm:        { textAlign: "center", color: colors.muted, fontSize: 11, margin: 16 },

    // Botão flutuante PDF
    fab:             { position: "absolute", bottom: 32, right: 24, left: 24, backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    fabText:         { color: "#fff", fontWeight: "700", fontSize: 15 },
});