import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { colors } from "@/styles/global";

interface Props {
    visible:      boolean;
    titulo:       string;
    mensagem:     string;
    confirmText?: string;
    cancelText?:  string;
    perigoso?:    boolean;
    apenasAviso?: boolean;
    onConfirm:    () => void;
    onCancel?:    () => void;
}

export default function ConfirmModal({
                                         visible, titulo, mensagem,
                                         confirmText = "Confirmar",
                                         cancelText  = "Cancelar",
                                         perigoso    = false,
                                         apenasAviso = false,
                                         onConfirm, onCancel,
                                     }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.box}>
                    <Text style={styles.titulo}>{titulo}</Text>
                    <Text style={styles.mensagem}>{mensagem}</Text>
                    <View style={styles.acoes}>
                        {!apenasAviso && (
                            <TouchableOpacity style={styles.cancelarBtn} onPress={onCancel} activeOpacity={0.8}>
                                <Text style={styles.cancelarText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.confirmarBtn,
                                perigoso    && styles.confirmarBtnPerigoso,
                                apenasAviso && styles.confirmarBtnAviso,
                            ]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmarText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay:              { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 32 },
    box:                  { backgroundColor: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    titulo:               { fontSize: 18, fontWeight: "700", color: colors.primaryDark, marginBottom: 8 },
    mensagem:             { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 24 },
    acoes:                { flexDirection: "row", gap: 12 },
    cancelarBtn:          { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, alignItems: "center" },
    cancelarText:         { fontSize: 14, color: colors.muted, fontWeight: "600" },
    confirmarBtn:         { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: "center" },
    confirmarBtnPerigoso: { backgroundColor: colors.rose },
    confirmarBtnAviso:    { backgroundColor: colors.primary },
    confirmarText:        { fontSize: 14, color: "#fff", fontWeight: "600" },
});