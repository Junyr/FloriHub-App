import { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform,
} from "react-native";
import { router } from "expo-router";
import { colors } from "@/styles/global";
import { login } from "@/api/api";
import {ConfirmState} from "@/utils/helpers";
import ConfirmModal from "@/components/ConfirmModal";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [load,  setLoad]  = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);


    const handleLogin = async () => {
        if (!email || !senha) {
            setConfirm({
                titulo:      "Atenção",
                mensagem:    "Preencha e-mail e senha.",
                confirmText: "OK",
                perigoso:    false,
                apenasAviso: true,
                onConfirm:   () => setConfirm(null),
            });
            return;
        }
        setLoad(true);
        try {
            await login(email, senha);
            router.replace("/dashboard");
        } catch (e: any) {
            setConfirm({
                titulo:      "Erro",
                mensagem:    e.message || "Credenciais inválidas.",
                confirmText: "OK",
                perigoso:    false,
                apenasAviso: true,
                onConfirm:   () => setConfirm(null),
            });
        } finally {
            setLoad(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
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
            {/* Logo */}
            <View style={styles.logoArea}>
                <Text style={styles.emoji}>🌺</Text>
                <Text style={styles.title}>FloriHub</Text>
                <Text style={styles.subtitle}>Sistema de Gestão · Floricultura</Text>
            </View>

            {/* Formulário */}
            <View style={styles.form}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>Senha</Text>
                <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.button, load && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={load}
                    activeOpacity={0.8}
                >
                    {load
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.buttonText}>Entrar</Text>
                    }
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    // Layout base
    container:      { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 },

    // Logo
    logoArea:       { alignItems: "center", marginBottom: 40 },
    emoji:          { fontSize: 56, marginBottom: 8 },
    title:          { fontSize: 32, fontWeight: "700", color: colors.primaryDark, marginBottom: 4 },
    subtitle:       { fontSize: 14, color: colors.muted },

    // Formulário
    form:           { backgroundColor: colors.white, borderRadius: 16, padding: 24 },
    label:          { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6 },
    input:          { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 14, color: colors.text, marginBottom: 16 },

    // Botão
    button:         { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: "center", marginTop: 4 },
    buttonDisabled: { opacity: 0.7 },
    buttonText:     { color: "#fff", fontSize: 15, fontWeight: "600" },
});