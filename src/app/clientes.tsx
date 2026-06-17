import { useEffect, useState } from "react";
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity, Modal, ScrollView,
    KeyboardAvoidingView, Platform, TextInput,
} from "react-native";
import { colors } from "@/styles/global";
import { getClientes, createCliente, updateCliente, deleteCliente } from "@/api/api";
import { brl, ConfirmState, handleVoltar } from "@/utils/helpers";
import { Cliente, FormCliente, FORM_VAZIO_CLIENTE } from "@/utils/types/Cliente";
import ConfirmModal from "@/components/ConfirmModal";

// Constantes
const CONSUMIDOR_FINAL_ID = "00000000-0000-0000-0000-000000000001";

export default function ClientesScreen() {
    const [clientes,  setClientes]  = useState<Cliente[]>([]);
    const [busca,     setBusca]     = useState("");
    const [load,      setLoad]      = useState(true);
    const [refresh,   setRefresh]   = useState(false);
    const [modalVis,  setModalVis]  = useState(false);
    const [enderecoVis, setEnderecoVis] = useState(false);
    const [editando,  setEditando]  = useState<Cliente | null>(null);
    const [form,      setForm]      = useState<FormCliente>(FORM_VAZIO_CLIENTE);
    const [salvando,  setSalvando]  = useState(false);
    const [confirm,   setConfirm]   = useState<ConfirmState | null>(null);

    // Carregamento
    const carregar = async (q?: string) => {
        try {
            const data = await getClientes(q);
            setClientes(data.filter((c: Cliente) => c.id !== CONSUMIDOR_FINAL_ID));
        } catch (e: any) {
            setConfirm({
                titulo: "Erro", mensagem: e.message || "Erro ao carregar clientes.",
                confirmText: "OK", perigoso: false, apenasAviso: true,
                onConfirm: () => setConfirm(null),
            });
        } finally {
            setLoad(false);
            setRefresh(false);
        }
    };

    useEffect(() => { carregar(); }, []);

    useEffect(() => {
        const t = setTimeout(() => carregar(busca), 400);
        return () => clearTimeout(t);
    }, [busca]);

    // Handlers do modal
    const abrirCriar = () => {
        setEditando(null);
        setForm(FORM_VAZIO_CLIENTE);
        setModalVis(true);
    };

    const abrirEditar = (c: Cliente) => {
        setEditando(c);
        setForm({
            nome:        c.nome,
            cpfCnpj:     c.cpfCnpj        || "",
            telefone:    c.telefone       || "",
            email:       c.email          || "",
            observacoes: c.observacoes    || "",
            cep:         c.endereco?.cep         || "",
            logradouro:  c.endereco?.logradouro  || "",
            numero:      c.endereco?.numero      || "",
            complemento: c.endereco?.complemento || "",
            bairro:      c.endereco?.bairro      || "",
            cidade:      c.endereco?.cidade      || "",
            uf:          c.endereco?.uf          || "",
        });
        setModalVis(true);
    };

    // CRUD
    const salvar = async () => {
        if (!form.nome.trim()) {
            setConfirm({
                titulo: "Atenção", mensagem: "Nome é obrigatório.",
                confirmText: "OK", perigoso: false, apenasAviso: true,
                onConfirm: () => setConfirm(null),
            });
            return;
        }
        setSalvando(true);
        try {
            const dados = {
                nome:        form.nome,
                cpfCnpj:     form.cpfCnpj     || null,
                telefone:    form.telefone    || null,
                email:       form.email       || null,
                observacoes: form.observacoes || null,
                endereco: {
                    cep:         form.cep         || null,
                    logradouro:  form.logradouro  || null,
                    numero:      form.numero      || null,
                    complemento: form.complemento || null,
                    bairro:      form.bairro      || null,
                    cidade:      form.cidade      || null,
                    uf:          form.uf          || null,
                },
            };
            editando
                ? await updateCliente(editando.id, dados)
                : await createCliente(dados);
            setModalVis(false);
            carregar();
        } catch (e: any) {
            setConfirm({
                titulo: "Erro", mensagem: e.message || "Erro ao salvar cliente.",
                confirmText: "OK", perigoso: false, apenasAviso: true,
                onConfirm: () => setConfirm(null),
            });
        } finally {
            setSalvando(false);
        }
    };

    const desativar = (c: Cliente) =>
        setConfirm({
            titulo:      "Desativar Cliente",
            mensagem:    `Desativar "${c.nome}"?`,
            confirmText: "Desativar",
            perigoso:    true,
            onConfirm:   async () => {
                await deleteCliente(c.id);
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
                        <Text style={styles.headerTitle}>👥 Clientes</Text>
                        <Text style={styles.headerSub}>{clientes.length} cadastrados</Text>
                    </View>
                    <TouchableOpacity style={styles.novoBtn} onPress={abrirCriar} activeOpacity={0.8}>
                        <Text style={styles.novoBtnText}>+ Novo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Busca */}
            <View style={styles.toolbar}>
                <TextInput
                    style={styles.search}
                    placeholder="Buscar por nome ou CPF/CNPJ…"
                    placeholderTextColor={colors.muted}
                    value={busca}
                    onChangeText={setBusca}
                />
            </View>

            {/* Lista */}
            <FlatList
                data={clientes}
                keyExtractor={item => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refresh}
                        onRefresh={() => { setRefresh(true); carregar(busca); }}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={<Text style={styles.empty}>Nenhum cliente encontrado.</Text>}
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item: c }) => (
                    <View style={[styles.card, !c.ativo && styles.inativo]}>
                        {/* Topo */}
                        <View style={styles.cardTop}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {c.nome.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.nome}>{c.nome}</Text>
                                {c.cpfCnpj  ? <Text style={styles.detalhe}>{c.cpfCnpj}</Text>  : null}
                                {c.telefone ? <Text style={styles.detalhe}>{c.telefone}</Text> : null}
                                {c.email    ? <Text style={styles.detalhe}>{c.email}</Text>    : null}
                            </View>
                            {!c.ativo && (
                                <Text style={styles.inativoLabel}>Inativo</Text>
                            )}
                        </View>

                        {/* Ações */}
                        {c.ativo && (
                            <View style={styles.acoes}>
                                <TouchableOpacity style={styles.editarBtn} onPress={() => abrirEditar(c)} activeOpacity={0.8}>
                                    <Text style={styles.editarText}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.desativarBtn} onPress={() => desativar(c)} activeOpacity={0.8}>
                                    <Text style={styles.desativarText}>Desativar</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
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
                                {editando ? "Editar Cliente" : "Novo Cliente"}
                            </Text>

                            <Text style={styles.label}>Nome *</Text>
                            <TextInput style={styles.input} value={form.nome}
                                       onChangeText={t => setForm({ ...form, nome: t })}
                                       placeholder="Nome completo ou razão social"
                                       placeholderTextColor={colors.muted} />

                            <Text style={styles.label}>CPF / CNPJ</Text>
                            <TextInput style={styles.input} value={form.cpfCnpj}
                                       onChangeText={t => setForm({ ...form, cpfCnpj: t })}
                                       placeholder="000.000.000-00"
                                       placeholderTextColor={colors.muted}
                                       keyboardType="numeric" />

                            <Text style={styles.label}>Telefone</Text>
                            <TextInput style={styles.input} value={form.telefone}
                                       onChangeText={t => setForm({ ...form, telefone: t })}
                                       placeholder="(00) 00000-0000"
                                       placeholderTextColor={colors.muted}
                                       keyboardType="phone-pad" />

                            <Text style={styles.label}>E-mail</Text>
                            <TextInput style={styles.input} value={form.email}
                                       onChangeText={t => setForm({ ...form, email: t })}
                                       placeholder="email@exemplo.com"
                                       placeholderTextColor={colors.muted}
                                       keyboardType="email-address"
                                       autoCapitalize="none" />

                            {/* Endereço — expansível */}
                            <TouchableOpacity
                                style={styles.enderecoHeader}
                                onPress={() => setEnderecoVis(!enderecoVis)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.enderecoHeaderText}>Endereço</Text>
                                <Text style={styles.enderecoArrow}>{enderecoVis ? "▲" : "▼"}</Text>
                            </TouchableOpacity>

                            {enderecoVis && (
                                <View style={styles.enderecoBox}>
                                    <Text style={styles.label}>CEP</Text>
                                    <TextInput style={styles.input} value={form.cep}
                                               onChangeText={t => setForm({ ...form, cep: t })}
                                               placeholder="00000-000"
                                               placeholderTextColor={colors.muted}
                                               keyboardType="numeric" maxLength={9} />

                                    <Text style={styles.label}>Logradouro</Text>
                                    <TextInput style={styles.input} value={form.logradouro}
                                               onChangeText={t => setForm({ ...form, logradouro: t })}
                                               placeholder="Rua, Av., etc."
                                               placeholderTextColor={colors.muted} />

                                    <View style={{ flexDirection: "row", gap: 8 }}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.label}>Número</Text>
                                            <TextInput style={styles.input} value={form.numero}
                                                       onChangeText={t => setForm({ ...form, numero: t })}
                                                       placeholder="123"
                                                       placeholderTextColor={colors.muted}
                                                       keyboardType="numeric" />
                                        </View>
                                        <View style={{ flex: 3 }}>
                                            <Text style={styles.label}>Complemento</Text>
                                            <TextInput style={styles.input} value={form.complemento}
                                                       onChangeText={t => setForm({ ...form, complemento: t })}
                                                       placeholder="Apto, Sala…"
                                                       placeholderTextColor={colors.muted} />
                                        </View>
                                    </View>

                                    <Text style={styles.label}>Bairro</Text>
                                    <TextInput style={styles.input} value={form.bairro}
                                               onChangeText={t => setForm({ ...form, bairro: t })}
                                               placeholder="Bairro"
                                               placeholderTextColor={colors.muted} />

                                    <View style={{ flexDirection: "row", gap: 8 }}>
                                        <View style={{ flex: 3 }}>
                                            <Text style={styles.label}>Cidade</Text>
                                            <TextInput style={styles.input} value={form.cidade}
                                                       onChangeText={t => setForm({ ...form, cidade: t })}
                                                       placeholder="Cidade"
                                                       placeholderTextColor={colors.muted} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.label}>UF</Text>
                                            <TextInput style={styles.input} value={form.uf}
                                                       onChangeText={t => setForm({ ...form, uf: t.toUpperCase() })}
                                                       placeholder="GO"
                                                       placeholderTextColor={colors.muted}
                                                       maxLength={2}
                                                       autoCapitalize="characters" />
                                        </View>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.label}>Observações</Text>
                            <TextInput style={[styles.input, styles.textarea]}
                                       value={form.observacoes}
                                       onChangeText={t => setForm({ ...form, observacoes: t })}
                                       placeholder="Notas sobre o cliente…"
                                       placeholderTextColor={colors.muted}
                                       multiline numberOfLines={3} />

                            <View style={styles.modalAcoes}>
                                <TouchableOpacity style={styles.cancelarBtn} onPress={() => {
                                    setModalVis(false);
                                    setEnderecoVis(false);
                                }} activeOpacity={0.8}>
                                    <Text style={styles.cancelarText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.salvarBtn, salvando && { opacity: 0.7 }]}
                                    onPress={salvar} disabled={salvando} activeOpacity={0.8}>
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
    headerRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerTitle:   { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
    headerSub:     { fontSize: 13, color: colors.primaryLight },
    voltarBtn:     { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
    voltarSeta:    { fontSize: 28, color: colors.primaryLight, lineHeight: 30, fontWeight: "300" },
    voltarTexto:   { fontSize: 14, color: colors.primaryLight, fontWeight: "500" },
    novoBtn:       { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    novoBtnText:   { color: "#fff", fontWeight: "600", fontSize: 14 },

    // Toolbar
    toolbar:       { flexDirection: "row", padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border },
    search:        { flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text },
    empty:         { textAlign: "center", color: colors.muted, marginTop: 40, fontSize: 14 },

    // Card
    card:          { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 12, elevation: 2 },
    inativo:       { opacity: 0.5 },
    cardTop:       { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
    avatarText:    { fontSize: 16, fontWeight: "700", color: colors.primaryDark },
    nome:          { fontSize: 15, fontWeight: "700", color: colors.primaryDark },
    detalhe:       { fontSize: 12, color: colors.muted, marginTop: 1 },
    inativoLabel:  { fontSize: 11, color: colors.rose, fontWeight: "600" },

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
    label:         { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 8 },
    input:         { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text, marginBottom: 4 },
    textarea:      { height: 80, textAlignVertical: "top" },

    // Endereço expansível
    enderecoHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 8, backgroundColor: colors.background },
    enderecoHeaderText: { fontSize: 14, fontWeight: "600", color: colors.primaryDark },
    enderecoArrow:      { fontSize: 12, color: colors.muted },
    enderecoBox:        { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginTop: 4, gap: 4 },

    // Ações do modal
    modalAcoes:    { flexDirection: "row", gap: 12, marginTop: 20 },
    cancelarBtn:   { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: "center" },
    cancelarText:  { fontSize: 14, color: colors.muted, fontWeight: "600" },
    salvarBtn:     { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center" },
    salvarText:    { fontSize: 14, color: "#fff", fontWeight: "600" },
});