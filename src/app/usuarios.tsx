import { useEffect, useState } from "react";
import {
    View, Text, FlatList, StyleSheet, ActivityIndicator,
    RefreshControl, TouchableOpacity, Alert, Modal,
    ScrollView, KeyboardAvoidingView, Platform, TextInput,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@/styles/global";
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "@/api/api";
import {handleVoltar} from "@/utils/helpers";
import {FORM_VAZIO, FormUsuario, ROLE_CORES, Usuario} from "@/utils/types/Usuario";

export default function UsuariosScreen() {
    const [usuarios,  setUsuarios]  = useState<Usuario[]>([]);
    const [load,      setLoad]      = useState(true);
    const [refresh,   setRefresh]   = useState(false);
    const [modalVis,  setModalVis]  = useState(false);
    const [editando,  setEditando]  = useState<Usuario | null>(null);
    const [form,      setForm]      = useState<FormUsuario>(FORM_VAZIO);
    const [salvando,  setSalvando]  = useState(false);
    const [usuarioLogado, setUsuarioLogado] = useState<{ role: string } | null>(null);
    const numColunas = Platform.OS === "web" ? 3 : 1;

    const carregar = async () => {
        try {
            const data = await getUsuarios();
            setUsuarios(data);
        } finally {
            setLoad(false);
            setRefresh(false);
        }
    };

    useEffect(() => {
        AsyncStorage.getItem("florihub_usuario").then((u) => {
            if (u) setUsuarioLogado(JSON.parse(u));
        });
        carregar();
    }, []);

    // Acesso restrito a ADMIN
    if (!load && usuarioLogado?.role !== "ADMIN") {
        return (
            <View style={styles.restrito}>
                <Text style={styles.restritoEmoji}>🔒</Text>
                <Text style={styles.restritoTitulo}>Acesso Restrito</Text>
                <Text style={styles.restritoSub}>Esta área é exclusiva para administradores.</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                    style={styles.voltarBtn}
                >
                    <Text style={styles.voltarSeta}>‹</Text>
                    <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const abrirCriar = () => {
        setEditando(null);
        setForm(FORM_VAZIO);
        setModalVis(true);
    };

    const abrirEditar = (u: Usuario) => {
        setEditando(u);
        setForm({ nome: u.nome, email: u.email, senha: "", role: u.role });
        setModalVis(true);
    };

    const salvar = async () => {
        if (!form.nome || !form.email) {
            Alert.alert("Atenção", "Nome e e-mail são obrigatórios.");
            return;
        }
        if (!editando && !form.senha) {
            Alert.alert("Atenção", "Senha obrigatória para novo usuário.");
            return;
        }
        setSalvando(true);
        try {
            const dados: any = { nome: form.nome, email: form.email, role: form.role };
            if (form.senha) dados.senha = form.senha;

            if (editando) {
                await updateUsuario(editando.id, dados);
            } else {
                await createUsuario(dados);
            }
            setModalVis(false);
            carregar();
        } catch (e: any) {
            Alert.alert("Erro", e.message || "Erro ao salvar usuário.");
        } finally {
            setSalvando(false);
        }
    };

    const desativar = (u: Usuario) => {
        Alert.alert(
            "Confirmar",
            `Desativar "${u.nome}"? O usuário não poderá mais fazer login.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Desativar",
                    style: "destructive",
                    onPress: async () => {
                        await deleteUsuario(u.id);
                        carregar();
                    },
                },
            ]
        );
    };

    if (load) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleVoltar}
                    activeOpacity={0.8}
                    style={styles.voltarBtn}
                >
                    <Text style={styles.voltarSeta}>‹</Text>
                    <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>🌱 Usuários</Text>
                        <Text style={styles.headerSub}>{usuarios.length} cadastrados</Text>
                    </View>
                    <TouchableOpacity style={styles.novoBtn} onPress={abrirCriar} activeOpacity={0.8}>
                        <Text style={styles.novoBtnText}>+ Novo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lista */}
            <FlatList
                data={usuarios}
                keyExtractor={item => item.id}
                numColumns={numColunas}
                key={numColunas}
                columnWrapperStyle={numColunas > 1 ? {
                    gap: 12,
                    paddingHorizontal: 16,
                    alignItems: "stretch",
                } : undefined}
                refreshControl={
                    <RefreshControl
                        refreshing={refresh}
                        onRefresh={() => { setRefresh(true); carregar(); }}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>Nenhum usuário encontrado.</Text>
                }
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item: u }) => {
                    const rc = ROLE_CORES[u.role] ?? { bg: "#eee", text: "#666" };
                    return (
                        <View style={[styles.card, !u.ativo && styles.inativo]}>
                            <View style={styles.cardTop}>
                                {/* Avatar */}
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {u.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                                    </Text>
                                </View>

                                {/* Dados */}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.nome}>{u.nome}</Text>
                                    <Text style={styles.email}>{u.email}</Text>
                                </View>

                                {/* Badge role */}
                                <View style={[styles.badge, { backgroundColor: rc.bg }]}>
                                    <Text style={[styles.badgeText, { color: rc.text }]}>{u.role}</Text>
                                </View>
                            </View>

                            {/* Status */}
                            <View style={styles.cardMid}>
                                <View style={[styles.statusDot, { backgroundColor: u.ativo ? colors.primary : colors.rose }]} />
                                <Text style={[styles.statusText, { color: u.ativo ? colors.primary : colors.rose }]}>
                                    {u.ativo ? "Ativo" : "Inativo"}
                                </Text>
                            </View>

                            {/* Ações */}
                            {u.ativo && (
                                <View style={styles.acoes}>
                                    <TouchableOpacity
                                        style={styles.editarBtn}
                                        onPress={() => abrirEditar(u)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.editarText}>Editar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.desativarBtn}
                                        onPress={() => desativar(u)}
                                        activeOpacity={0.8}
                                    >
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
                                {editando ? "Editar Usuário" : "Novo Usuário"}
                            </Text>

                            <Text style={styles.label}>Nome completo *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.nome}
                                onChangeText={t => setForm({ ...form, nome: t })}
                                placeholder="Nome Sobrenome"
                                placeholderTextColor={colors.muted}
                            />

                            <Text style={styles.label}>E-mail *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.email}
                                onChangeText={t => setForm({ ...form, email: t })}
                                placeholder="email@exemplo.com"
                                placeholderTextColor={colors.muted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={styles.label}>
                                {editando ? "Nova senha (deixe em branco para manter)" : "Senha *"}
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={form.senha}
                                onChangeText={t => setForm({ ...form, senha: t })}
                                placeholder="••••••••"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                            />

                            <Text style={styles.label}>Papel</Text>
                            <View style={styles.roles}>
                                {(["VENDEDOR", "ADMIN"] as const).map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.roleBtn, form.role === r && styles.roleBtnAtivo]}
                                        onPress={() => setForm({ ...form, role: r })}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.roleText, form.role === r && styles.roleTextAtivo]}>
                                            {r}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

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
    container:      { flex: 1, backgroundColor: colors.background },
    center:         { flex: 1, justifyContent: "center", alignItems: "center" },
    header:         { backgroundColor: colors.primaryDark, padding: 24, paddingTop: 56 },
    voltar:         { color: colors.primaryLight, fontSize: 14, marginBottom: 8 },
    headerRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    headerTitle:    { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 2 },
    headerSub:      { fontSize: 13, color: colors.primaryLight },
    novoBtn:        { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    novoBtnText:    { color: "#fff", fontWeight: "600", fontSize: 14 },
    empty:          { textAlign: "center", color: colors.muted, marginTop: 40, fontSize: 14 },
    card:           { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginHorizontal: Platform.OS === "web" ? 0 : 16, marginTop: 12, elevation: 2, flex: 1, minHeight: 160, justifyContent: "space-between" },
    inativo:        { opacity: 0.5 },
    cardTop:        { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
    avatar:         { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: "center", alignItems: "center" },
    avatarText:     { fontSize: 16, fontWeight: "700", color: colors.primaryDark },
    nome:           { fontSize: 15, fontWeight: "700", color: colors.primaryDark },
    email:          { fontSize: 12, color: colors.muted, marginTop: 2 },
    badge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText:      { fontSize: 11, fontWeight: "600" },
    cardMid:        { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    statusDot:      { width: 8, height: 8, borderRadius: 4 },
    statusText:     { fontSize: 12, fontWeight: "600" },
    acoes:          { flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: colors.background, paddingTop: 12 },
    editarBtn:      { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 8, alignItems: "center" },
    editarText:     { fontSize: 13, color: colors.primary, fontWeight: "600" },
    desativarBtn:   { flex: 1, borderWidth: 1, borderColor: colors.rose, borderRadius: 8, padding: 8, alignItems: "center" },
    desativarText:  { fontSize: 13, color: colors.rose, fontWeight: "600" },
    restrito:       { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: 32 },
    restritoEmoji:  { fontSize: 48, marginBottom: 12 },
    restritoTitulo: { fontSize: 20, fontWeight: "700", color: colors.primaryDark, marginBottom: 8 },
    restritoSub:    { fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 },
    voltarBtn:   { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
    voltarSeta:  { fontSize: 28, color: colors.primaryLight, lineHeight: 30, fontWeight: "300" },
    voltarTexto: { fontSize: 14, color: colors.primaryLight, fontWeight: "500" },
    // Modal
    modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalBox:       { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "90%" },
    modalTitle:     { fontSize: 20, fontWeight: "700", color: colors.primaryDark, marginBottom: 20 },
    label:          { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 8 },
    input:          { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text, marginBottom: 4 },
    roles:          { flexDirection: "row", gap: 12, marginBottom: 12 },
    roleBtn:        { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
    roleBtnAtivo:   { backgroundColor: colors.primary, borderColor: colors.primary },
    roleText:       { fontSize: 13, color: colors.muted, fontWeight: "600" },
    roleTextAtivo:  { color: "#fff" },
    modalAcoes:     { flexDirection: "row", gap: 12, marginTop: 20 },
    cancelarBtn:    { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, alignItems: "center" },
    cancelarText:   { fontSize: 14, color: colors.muted, fontWeight: "600" },
    salvarBtn:      { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: "center" },
    salvarText:     { fontSize: 14, color: "#fff", fontWeight: "600" },
});