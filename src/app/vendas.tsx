import { useEffect, useState } from "react";
import {
    View, Text, FlatList, StyleSheet,
    RefreshControl, TouchableOpacity, Modal,
    ScrollView, KeyboardAvoidingView, Platform, TextInput,
} from "react-native";
import { colors } from "@/styles/global";
import { createVenda, getProdutos, getVendas, updateVendaStatus } from "@/api/api";
import {brl, ConfirmState, handleVoltar, mascaraData, parseData} from "@/utils/helpers";
import { FILTROS, ItemForm, STATUS_CORES, Venda } from "@/utils/types/Venda";
import ConfirmModal from "@/components/ConfirmModal";
import { Produto } from "@/utils/types/Produto";

export default function VendasScreen() {
    const [vendas,    setVendas]    = useState<Venda[]>([]);
    const [produtos,  setProdutos]  = useState<Produto[]>([]);
    const [busca,      setBusca]      = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim,    setDataFim]    = useState("");
    const [buscaVis,   setBuscaVis]   = useState(false);
    const [filtro,    setFiltro]    = useState("Todos");
    const [expandida, setExpandida] = useState<string | null>(null);
    const [load,      setLoad]      = useState(true);
    const [refresh,   setRefresh]   = useState(false);

    const [modalVis,  setModalVis]  = useState(false);
    const [itens,     setItens]     = useState<ItemForm[]>([]);
    const [prodSel,   setProdSel]   = useState<Produto | null>(null);
    const [qtd,       setQtd]       = useState(1);
    const [obs,       setObs]       = useState("");
    const [salvando,  setSalvando]  = useState(false);
    const [selVis,    setSelVis]    = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);

    const carregar = async () => {
        try {
            const [v, p] = await Promise.all([getVendas(), getProdutos()]);
            setVendas(v);
            setProdutos(p);
            if (p.length > 0) setProdSel(p[0]);
        } finally {
            setLoad(false);
            setRefresh(false);
        }
    };

    useEffect(() => { carregar(); }, []);

    // Filtros
    const filtradas = vendas
        .filter(v => filtro === "Todos" || v.status === filtro)
        .filter(v => {
            if (!busca) return true;
            return (v.nomeCliente || "Consumidor Final")
                .toLowerCase()
                .includes(busca.toLowerCase());
        })
        .filter(v => {
            if (!dataInicio && !dataFim) return true;

            const data = new Date(v.dataVenda);
            const inicio = dataInicio ? parseData(dataInicio) : null;
            const fim    = dataFim    ? parseData(dataFim, true) : null;

            if (inicio && data < inicio) return false;
            return !(fim && data > fim);

        })

    const totalFin = vendas
        .filter(v => v.status === "FINALIZADA")
        .reduce((s, v) => s + v.valorTotal, 0);

    // Handlers de itens de venda
    const addItem = () => {
        if (!prodSel) return;
        const existe = itens.find(i => i.produto.id === prodSel.id);
        if (existe) {
            setItens(itens.map(i =>
                i.produto.id === prodSel.id
                    ? { ...i, quantidade: i.quantidade + qtd }
                    : i
            ));
        } else {
            setItens([...itens, { produto: prodSel, quantidade: qtd }]);
        }
    };

    const removeItem = (id: string) =>
        setItens(itens.filter(i => i.produto.id !== id));

    const totalVenda = itens.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);

    // CRUD de vendas
    const salvarVenda = async () => {
        if (itens.length === 0) {
            setConfirm({
                titulo:      "Atenção",
                mensagem:    "Adicione pelo menos um item.",
                confirmText: "OK",
                perigoso:    false,
                apenasAviso: true,
                onConfirm:   () => setConfirm(null),
            });
            return;
        }
        setSalvando(true);
        try {
            const payload = {
                observacao: obs || null,
                itens: itens.map(i => ({
                    produtoId:  i.produto.id,
                    quantidade: i.quantidade,
                })),
            };

            await createVenda(payload);
            setModalVis(false);
            setItens([]);
            setObs("");
            carregar();
        } catch (e: any) {
            setConfirm({
                titulo:      "Erro",
                mensagem:    e.message || "Erro ao salvar produto.",
                confirmText: "OK",
                perigoso:    false,
                apenasAviso: true,
                onConfirm:   () => setConfirm(null),
            });
        } finally {
            setSalvando(false);
        }
    };

    const cancelarVenda = (v: Venda) =>
        setConfirm({
            titulo:      "Cancelar Venda",
            mensagem:    `Cancelar a venda de ${brl(v.valorTotal)}? O estoque será restaurado.`,
            confirmText: "Sim, cancelar",
            perigoso:    true,
            onConfirm:   async () => {
                await updateVendaStatus(v.id, "CANCELADA");
                setConfirm(null);
                carregar();
            },
        });

    const finalizarVenda = (v: Venda) =>
        setConfirm({
            titulo:      "Finalizar Venda",
            mensagem:    `Finalizar a venda de ${brl(v.valorTotal)}?`,
            confirmText: "Finalizar",
            perigoso:    false,
            onConfirm:   async () => {
                await updateVendaStatus(v.id, "FINALIZADA");
                setConfirm(null);
                carregar();
            },
        });

    return (
        <View style={styles.container}>
            {/* Modal de confirmação */}
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
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>🌺 Vendas</Text>
                        <Text style={styles.headerSub}>Finalizadas: {brl(totalFin)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity style={[styles.buscaBtn, buscaVis && styles.buscaBtnAtivo]} onPress={() => setBuscaVis(!buscaVis)} activeOpacity={0.8}>
                            <Text style={styles.buscaBtnText}>⌕</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.novoBtn} onPress={() => setModalVis(true)} activeOpacity={0.8}>
                            <Text style={styles.novoBtnText}>+ Nova</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Painel de busca */}
            {buscaVis && (
                <View style={styles.buscaPanel}>
                    <TextInput
                        style={styles.buscaInput}
                        placeholder="Buscar por cliente…"
                        placeholderTextColor={colors.muted}
                        value={busca}
                        onChangeText={setBusca}
                    />
                    <View style={styles.buscaDatas}>
                        <TextInput
                            style={[styles.buscaInput, { flex: 1 }]}
                            placeholder="Início DD/MM/AAAA"
                            placeholderTextColor={colors.muted}
                            value={dataInicio}
                            onChangeText={(t) => setDataInicio(mascaraData(t))}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                        <TextInput
                            style={[styles.buscaInput, { flex: 1 }]}
                            placeholder="Fim DD/MM/AAAA"
                            placeholderTextColor={colors.muted}
                            value={dataFim}
                            onChangeText={(t) => setDataFim(mascaraData(t))}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                    </View>
                    {(busca || dataInicio || dataFim) && (
                        <TouchableOpacity
                            onPress={() => { setBusca(""); setDataInicio(""); setDataFim(""); }}
                            style={styles.limparBtn}
                        >
                            <Text style={styles.limparText}>Limpar filtros</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Filtros por status */}
            <View style={styles.filtrosContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
                    {FILTROS.map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filtroBtn, filtro === f && styles.filtroBtnAtivo]}
                            onPress={() => setFiltro(f)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.filtroText, filtro === f && styles.filtroTextAtivo]}> {f} </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Lista de vendas */}
            <FlatList
                data={filtradas}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refresh}
                        onRefresh={() => { setRefresh(true); carregar(); }}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={ <Text style={styles.empty}>Nenhuma venda encontrada.</Text> }
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item: v }) => {
                    const sc       = STATUS_CORES[v.status] ?? { bg: "#eee", text: "#666" };
                    const aberta   = expandida === v.id;

                    return (
                        <TouchableOpacity style={styles.card} onPress={() => setExpandida(aberta ? null : v.id)} activeOpacity={0.9}>
                            {/* Linha principal */}
                            <View style={styles.cardTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardNome}>
                                        {v.nomeCliente || "Consumidor Final"}
                                    </Text>
                                    <Text style={styles.cardData}>
                                        Vendedor: {v.nomeVendedor} • {new Date(v.dataVenda).toLocaleDateString("pt-BR")}
                                    </Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles.cardValor}>{brl(v.valorTotal)}</Text>
                                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                                        <Text style={[styles.badgeText, { color: sc.text }]}> {v.status} </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Itens expandidos */}
                            {aberta && (
                                <View style={styles.itensBox}>
                                    {(v.itens || []).map((it, j) => (
                                        <View key={j} style={styles.itemRow}>
                                            <Text style={styles.itemNome}> {it.nomeProduto} × {it.quantidade} </Text>
                                            <Text style={styles.itemValor}>{brl(it.subTotal)}</Text>
                                        </View>
                                    ))}

                                    {v.observacao ? (
                                        <Text style={styles.obs}>Obs: {v.observacao}</Text>
                                        ) : null
                                    }

                                    {/* Ações */}
                                    {v.status === "ABERTA" && (
                                        <View style={styles.acoes}>
                                            <TouchableOpacity style={styles.finalizarBtn} onPress={() => finalizarVenda(v)} activeOpacity={0.8}>
                                                <Text style={styles.finalizarText}>Finalizar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.cancelarBtn} onPress={() => cancelarVenda(v)} activeOpacity={0.8}>
                                                <Text style={styles.cancelarText}>Cancelar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Modal nova venda */}
            <Modal visible={modalVis} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.modalBox}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Nova Venda</Text>

                            {/* Seleção de produto */}
                            <Text style={styles.label}>Produto</Text>
                            <TouchableOpacity style={styles.seletor} onPress={() => setSelVis(true)} activeOpacity={0.8}>
                                <Text style={styles.seletorText}>
                                    {prodSel ? `${prodSel.nome} — ${brl(prodSel.preco)}` : "Selecionar…"}
                                </Text>
                                <Text style={styles.seletorArrow}>▼</Text>
                            </TouchableOpacity>

                            {/* Quantidade */}
                            <Text style={styles.label}>Quantidade</Text>
                            <View style={styles.qtdRow}>
                                <TouchableOpacity style={styles.qtdBtn} onPress={() => setQtd(q => Math.max(1, q - 1))}>
                                    <Text style={styles.qtdBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtdVal}> {qtd} </Text>
                                <TouchableOpacity style={styles.qtdBtn} onPress={() => setQtd(q => q + 1)}>
                                    <Text style={styles.qtdBtnText}>+</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.addBtn} onPress={addItem} activeOpacity={0.8}>
                                    <Text style={styles.addBtnText}>+ Adicionar</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Itens adicionados */}
                            {itens.length > 0 && (
                                <View style={styles.itensForm}>
                                    {itens.map(i => (
                                        <View key={i.produto.id} style={styles.itemFormRow}>
                                            <Text style={styles.itemFormNome}> {i.produto.nome} × {i.quantidade} </Text>
                                            <Text style={styles.itemFormValor}> {brl(i.produto.preco * i.quantidade)} </Text>
                                            <TouchableOpacity onPress={() => removeItem(i.produto.id)}>
                                                <Text style={styles.removeItem}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    <Text style={styles.totalForm}>Total: {brl(totalVenda)}</Text>
                                </View>
                            )}

                            {/* Observação */}
                            <Text style={styles.label}>Observação</Text>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                value={obs}
                                onChangeText={setObs}
                                placeholder="Notas sobre a venda…"
                                placeholderTextColor={colors.muted}
                                multiline
                                numberOfLines={3}
                            />

                            <View style={styles.modalAcoes}>
                                <TouchableOpacity style={styles.modalCancelarBtn} onPress={() => { setModalVis(false); setItens([]); }} activeOpacity={0.8}>
                                    <Text style={styles.modalCancelarText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.salvarBtn, salvando && { opacity: 0.7 }]} onPress={salvarVenda} disabled={salvando} activeOpacity={0.8}>
                                    <Text style={styles.salvarText}>
                                        {salvando ? "Salvando…" : "Registrar Venda"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal seleção de produto */}
            <Modal visible={selVis} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Selecionar Produto</Text>
                        <FlatList
                            data={produtos.filter(p => p.ativo && p.quantidadeEstoque > 0)}
                            keyExtractor={item => item.id}
                            renderItem={({ item: p }) => (
                                <TouchableOpacity
                                    style={styles.produtoSelItem}
                                    onPress={() => { setProdSel(p); setSelVis(false); }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.produtoSelNome}>{p.nome}</Text>
                                    <Text style={styles.produtoSelPreco}>{brl(p.preco)}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.modalCancelarBtn} onPress={() => setSelVis(false)}>
                            <Text style={styles.modalCancelarText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    // Layout base
    container:        { flex: 1, backgroundColor: colors.background },
    center:           { flex: 1, justifyContent: "center", alignItems: "center" },

    // Header
    header:           { backgroundColor: colors.primaryDark, padding: 24, paddingTop: 56 },
    headerRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerTitle:      { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
    headerSub:        { fontSize: 13, color: colors.primaryLight },
    voltarBtn:        { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
    voltarSeta:       { fontSize: 28, color: colors.primaryLight, lineHeight: 30, fontWeight: "300" },
    voltarTexto:      { fontSize: 14, color: colors.primaryLight, fontWeight: "500" },
    novoBtn:          { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    novoBtnText:      { color: "#fff", fontSize: 14, lineHeight: 22, textAlign: "center", includeFontPadding: false },

    // Busca
    buscaBtn:         { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, width: 40, height: 40, justifyContent: "center", alignItems: "center", paddingTop: Platform.OS === "web" ? 0 : 2 },
    buscaBtnAtivo:    { backgroundColor: "rgba(255,255,255,0.35)" },
    buscaBtnText:     { color: "#fff", fontSize: 23, lineHeight: 22, textAlign: "center", includeFontPadding: false },
    buscaPanel:       { backgroundColor: "#fff", padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
    buscaInput:       { backgroundColor: colors.background, borderRadius: 8, padding: 10, fontSize: 13, color: colors.text },
    buscaDatas:       { flexDirection: "row", gap: 8 },
    limparBtn:        { alignItems: "center", paddingVertical: 6 },
    limparText:       { fontSize: 12, color: colors.rose, fontWeight: "600" },

    // Filtros por status
    filtrosContainer: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border, height: 52 },
    filtros:          { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: "center" },
    filtroBtn:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.background },
    filtroBtnAtivo:   { backgroundColor: colors.primary },
    filtroText:       { fontSize: 12, color: colors.muted, fontWeight: "500" },
    filtroTextAtivo:  { color: "#fff" },
    empty:            { textAlign: "center", color: colors.muted, marginTop: 40, fontSize: 14 },

    // Card de venda
    card:             { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 12, elevation: 2 },
    cardTop:          { flexDirection: "row", alignItems: "center" },
    cardNome:         { fontSize: 14, fontWeight: "700", color: colors.primaryDark },
    cardData:         { fontSize: 11, color: colors.muted, marginTop: 2 },
    cardValor:        { fontSize: 16, fontWeight: "700", color: colors.primaryDark },
    badge:            { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginTop: 4 },
    badgeText:        { fontSize: 10, fontWeight: "600" },

    // Itens expandidos
    itensBox:         { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.background, paddingTop: 10 },
    itemRow:          { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    itemNome:         { fontSize: 12, color: colors.muted },
    itemValor:        { fontSize: 12, fontWeight: "600", color: colors.primaryDark },
    obs:              { fontSize: 12, color: colors.muted, fontStyle: "italic", marginTop: 6 },

    // Ações do card
    acoes:            { flexDirection: "row", gap: 8, marginTop: 12 },
    finalizarBtn:     { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 8, alignItems: "center" },
    finalizarText:    { fontSize: 13, color: colors.primary, fontWeight: "600" },
    cancelarBtn:      { flex: 1, borderWidth: 1, borderColor: colors.rose, borderRadius: 8, padding: 8, alignItems: "center" },
    cancelarText:     { fontSize: 13, color: colors.rose, fontWeight: "600" },

    // Modal nova venda
    modalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalBox:         { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
    modalTitle:       { fontSize: 20, fontWeight: "700", color: colors.primaryDark, marginBottom: 20 },
    label:            { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 8 },
    input:            { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text },
    textarea:         { height: 80, textAlignVertical: "top" },

    // Seletor e quantidade
    seletor:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 4 },
    seletorText:      { fontSize: 14, color: colors.text, flex: 1 },
    seletorArrow:     { fontSize: 12, color: colors.muted },
    qtdRow:           { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
    qtdBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
    qtdBtnText:       { fontSize: 20, color: colors.primaryDark, fontWeight: "600" },
    qtdVal:           { fontSize: 16, fontWeight: "600", color: colors.primaryDark, minWidth: 30, textAlign: "center" },
    addBtn:           { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginLeft: "auto" },
    addBtnText:       { color: "#fff", fontSize: 13, fontWeight: "600" },

    // Itens do formulário
    itensForm:        { backgroundColor: colors.background, borderRadius: 10, padding: 12, marginBottom: 4 },
    itemFormRow:      { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemFormNome:     { flex: 1, fontSize: 13, color: colors.text },
    itemFormValor:    { fontSize: 13, fontWeight: "600", color: colors.primaryDark, marginRight: 10 },
    removeItem:       { fontSize: 20, color: colors.rose, lineHeight: 22 },
    totalForm:        { textAlign: "right", fontSize: 16, fontWeight: "700", color: colors.primaryDark, marginTop: 8 },

    // Ações do modal
    modalAcoes:       { flexDirection: "row", gap: 12, marginTop: 20 },
    modalCancelarBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: "center" },
    modalCancelarText:{ fontSize: 14, color: colors.muted, fontWeight: "600" },
    salvarBtn:        { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center" },
    salvarText:       { fontSize: 14, color: "#fff", fontWeight: "600" },

    // Modal seleção de produto
    produtoSelItem:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.background },
    produtoSelNome:   { fontSize: 14, color: colors.text, flex: 1 },
    produtoSelPreco:  { fontSize: 14, fontWeight: "600", color: colors.primaryDark },
});