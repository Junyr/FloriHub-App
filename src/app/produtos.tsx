import { useEffect, useState } from "react";
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert, TextInput,
    Modal, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { colors } from "@/styles/global";
import { getProdutos, createProduto, updateProduto, deleteProduto } from "@/api/api";
import {brl, ConfirmState, handleVoltar} from "@/utils/helpers";
import {CATEGORIAS, CATEGORIAS_CORES, FORM_VAZIO, FormProduto, Produto} from "@/utils/types/Produto";
import ConfirmModal from "@/components/ConfirmModal";

const numColunas = Platform.OS === "web" ? 3 : 1;

export default function ProdutosScreen() {
    const [produtos,   setProdutos]   = useState<Produto[]>([]);
    const [filtrados,  setFiltrados]  = useState<Produto[]>([]);
    const [busca,      setBusca]      = useState("");
    const [load,       setLoad]       = useState(true);
    const [refresh,    setRefresh]    = useState(false);
    const [modalVis,   setModalVis]   = useState(false);
    const [editando,   setEditando]   = useState<Produto | null>(null);
    const [form,       setForm]       = useState<FormProduto>(FORM_VAZIO);
    const [salvando,   setSalvando]   = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);


    const carregar = async () => {
        try {
            const data = await getProdutos();
            setProdutos(data);
            setFiltrados(data);
        } finally {
            setLoad(false);
            setRefresh(false);
        }
    };

    useEffect(() => { carregar(); }, []);

    useEffect(() => {
        const q = busca.toLowerCase();
        setFiltrados(
            produtos.filter(p =>
                p.nome.toLowerCase().includes(q) ||
                p.categoria.toLowerCase().includes(q)
            )
        );
    }, [busca, produtos]);

    // Handlers do modal
    const abrirCriar = () => {
        setEditando(null);
        setForm(FORM_VAZIO);
        setModalVis(true);
    };

    const abrirEditar = (p: Produto) => {
        setEditando(p);
        setForm({
            nome:              p.nome,
            descricao:         p.descricao || "",
            preco:             String(p.preco),
            quantidadeEstoque: String(p.quantidadeEstoque),
            categoria:         p.categoria,
        });
        setModalVis(true);
    };

    // CRUD
    const salvar = async () => {
        if (!form.nome || !form.preco || !form.quantidadeEstoque) {
            Alert.alert("Atenção", "Preencha os campos obrigatórios.");
            return;
        }
        setSalvando(true);
        try {
            const dados = {
                nome:              form.nome,
                descricao:         form.descricao,
                preco:             parseFloat(form.preco),
                quantidadeEstoque: parseInt(form.quantidadeEstoque),
                categoria:         form.categoria,
            };
            if (editando) await updateProduto(editando.id, dados);
            else await createProduto(dados);
            setModalVis(false);
            carregar();
        } catch (e: any) {
            Alert.alert("Erro", e.message || "Erro ao salvar produto.");
        } finally {
            setSalvando(false);
        }
    };

    const desativar = (p: Produto) =>
        setConfirm({
            titulo:      "Desativar Produto",
            mensagem:    `Desativar "${p.nome}"? O produto não aparecerá mais nas listagens.`,
            confirmText: "Desativar",
            perigoso:    true,
            onConfirm:   async () => {
                await deleteProduto(p.id);
                setConfirm(null);
                carregar();
            },
        });

    if (load) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    return (
        <View style={styles.container}>
            {confirm && (
                <ConfirmModal
                    visible={true}
                    titulo={confirm.titulo}
                    mensagem={confirm.mensagem}
                    confirmText={confirm.confirmText}
                    perigoso={confirm.perigoso}
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
                <Text style={styles.headerTitle}>🌸 Produtos</Text>
                <Text style={styles.headerSub}>{filtrados.length} produtos</Text>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
                <TextInput
                    style={styles.search}
                    placeholder="Buscar…"
                    placeholderTextColor={colors.muted}
                    value={busca}
                    onChangeText={setBusca}
                />
                <TouchableOpacity style={styles.novoBtn} onPress={abrirCriar} activeOpacity={0.8}>
                    <Text style={styles.novoBtnText}>+ Novo</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de produtos */}
            <FlatList
                data={filtrados}
                keyExtractor={item => item.id}
                numColumns={numColunas}
                key={numColunas}
                columnWrapperStyle={numColunas > 1 ? { gap: 12, paddingHorizontal: 16, alignItems: "stretch"} : undefined}
                refreshControl={
                    <RefreshControl
                        refreshing={refresh}
                        onRefresh={() => { setRefresh(true); carregar(); }}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={ <Text style={styles.empty}>Nenhum produto encontrado.</Text> }
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item: p }) => {
                    const cat      = CATEGORIAS_CORES[p.categoria] ?? { bg: "#eee", text: "#666" };
                    const esgotado = p.quantidadeEstoque === 0;
                    const critico  = p.quantidadeEstoque <= 5 && p.quantidadeEstoque > 0;

                    return (
                        <View style={[styles.card, !p.ativo && styles.inativo]}>
                            <View style={styles.cardTop}>
                                <View style={[styles.badge, { backgroundColor: cat.bg }]}>
                                    <Text style={[styles.badgeText, { color: cat.text }]}>{p.categoria}</Text>
                                </View>
                                {!p.ativo && <Text style={styles.inativoLabel}>Inativo</Text>}
                            </View>

                            <Text style={styles.nome}>{p.nome}</Text>
                            {p.descricao ? <Text style={styles.desc}>{p.descricao}</Text> : null}

                            <View style={styles.cardBottom}>
                                <Text style={styles.preco}>{brl(p.preco)}</Text>
                                <Text style={[
                                    styles.estoque,
                                    esgotado  ? { color: colors.rose } :
                                    critico   ? { color: colors.gold } :
                                    { color: colors.muted },
                                ]}>
                                    {esgotado ? "Esgotado" : `${p.quantidadeEstoque} un.`}
                                </Text>
                            </View>

                            {/* Ações */}
                            {p.ativo && (
                                <View style={styles.acoes}>
                                    <TouchableOpacity style={styles.editarBtn} onPress={() => abrirEditar(p)} activeOpacity={0.8}>
                                        <Text style={styles.editarText}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.desativarBtn} onPress={() => desativar(p)} activeOpacity={0.8}>
                                        <Text style={styles.desativarText}>Desativar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                }}
            />

            {/* Modal criar / editar */}
            <Modal visible={modalVis} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={styles.modalBox}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>
                                {editando ? "Editar Produto" : "Novo Produto"}
                            </Text>

                            <Text style={styles.label}>Nome *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.nome}
                                onChangeText={t => setForm({ ...form, nome: t })}
                                placeholder="Ex: Rosa Vermelha Premium"
                                placeholderTextColor={colors.muted}
                            />

                            <Text style={styles.label}>Preço (R$) *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.preco}
                                onChangeText={t => setForm({ ...form, preco: t })}
                                placeholder="0,00"
                                placeholderTextColor={colors.muted}
                                keyboardType="decimal-pad"
                            />

                            <Text style={styles.label}>Estoque (un.) *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.quantidadeEstoque}
                                onChangeText={t => setForm({ ...form, quantidadeEstoque: t })}
                                placeholder="0"
                                placeholderTextColor={colors.muted}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Categoria</Text>
                            <View style={styles.categorias}>
                                {CATEGORIAS.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.catBtn, form.categoria === c && styles.catBtnAtivo]}
                                        onPress={() => setForm({ ...form, categoria: c })}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.catText, form.categoria === c && styles.catTextAtivo]}>
                                            {c}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Descrição</Text>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                value={form.descricao}
                                onChangeText={t => setForm({ ...form, descricao: t })}
                                placeholder="Descrição opcional…"
                                placeholderTextColor={colors.muted}
                                multiline
                                numberOfLines={3}
                            />

                            <View style={styles.modalAcoes}>
                                <TouchableOpacity
                                    style={styles.cancelarBtn}
                                    onPress={() => setModalVis(false)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cancelarText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.salvarBtn, salvando && { opacity: 0.7 }]}
                                    onPress={salvar}
                                    disabled={salvando}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.salvarText}>
                                        {salvando ? "Salvando…" : editando ? "Salvar" : "Cadastrar"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    // Layout base
    container:     { flex: 1, backgroundColor: colors.background },
    center:        { flex: 1, justifyContent: "center", alignItems: "center" },

    // Header
    header:        { backgroundColor: colors.primaryDark, padding: 24, paddingTop: 56 },
    headerTitle:   { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
    headerSub:     { fontSize: 13, color: colors.primaryLight },
    voltarBtn:     { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
    voltarSeta:    { fontSize: 28, color: colors.primaryLight, lineHeight: 30, fontWeight: "300" },
    voltarTexto:   { fontSize: 14, color: colors.primaryLight, fontWeight: "500" },

    // Toolbar
    toolbar:       { flexDirection: "row", padding: 12, gap: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
    search:        { flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text },
    novoBtn:       { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
    novoBtnText:   { color: "#fff", fontWeight: "600", fontSize: 14 },
    empty:         { textAlign: "center", color: colors.muted, marginTop: 40, fontSize: 14 },

    // Card de produto
    card:          { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginHorizontal: Platform.OS === "web" ? 0 : 16, marginTop: 12, elevation: 2, flex: 1, minHeight: 160, justifyContent: "space-between" },
    inativo:       { opacity: 0.5 },
    cardTop:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    badge:         { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    badgeText:     { fontSize: 11, fontWeight: "600" },
    inativoLabel:  { fontSize: 11, color: colors.rose, fontWeight: "600" },
    nome:          { fontSize: 15, fontWeight: "700", color: colors.primaryDark, marginBottom: 4 },
    desc:          { fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 18 },
    cardBottom:    { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 },
    preco:         { fontSize: 18, fontWeight: "700", color: colors.primaryDark },
    estoque:       { fontSize: 12, fontWeight: "600" },

    // Ações do card
    acoes:         { flexDirection: "row", gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.background, paddingTop: 12 },
    editarBtn:     { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 8, alignItems: "center" },
    editarText:    { fontSize: 13, color: colors.primary, fontWeight: "600" },
    desativarBtn:  { flex: 1, borderWidth: 1, borderColor: colors.rose, borderRadius: 8, padding: 8, alignItems: "center" },
    desativarText: { fontSize: 13, color: colors.rose, fontWeight: "600" },

    // Modal
    modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalBox:      { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
    modalTitle:    { fontSize: 20, fontWeight: "700", color: colors.primaryDark, marginBottom: 20 },
    label:         { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 4 },
    input:         { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text, marginBottom: 4 },
    textarea:      { height: 80, textAlignVertical: "top" },

    // Categorias (modal)
    categorias:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    catBtn:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    catBtnAtivo:   { backgroundColor: colors.primary, borderColor: colors.primary },
    catText:       { fontSize: 13, color: colors.muted },
    catTextAtivo:  { color: "#fff", fontWeight: "600" },

    // Ações do modal
    modalAcoes:    { flexDirection: "row", gap: 12, marginTop: 20 },
    cancelarBtn:   { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: "center" },
    cancelarText:  { fontSize: 14, color: colors.muted, fontWeight: "600" },
    salvarBtn:     { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center" },
    salvarText:    { fontSize: 14, color: "#fff", fontWeight: "600" },
});