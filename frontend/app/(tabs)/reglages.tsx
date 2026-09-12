import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Button } from '@/src/components/Button';
import { Icon, IconName } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';

export default function Reglages() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, buildExport, buildSummary, deleteAll } = useStore();

  const [toast, setToast] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const onExportJson = async () => {
    try {
      const json = JSON.stringify(buildExport(), null, 2);
      const file = new File(Paths.cache, 'childeric-sauvegarde.json');
      if (file.exists) file.delete();
      file.create();
      file.write(json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Sauvegarde Childeric',
        });
      } else {
        showToast('Le partage n\'est pas disponible sur cet appareil.');
      }
    } catch {
      showToast('La sauvegarde n\'a pas pu être créée.');
    }
  };

  const onExportSummary = async () => {
    try {
      await Share.share({ message: buildSummary() });
    } catch {
      showToast('Le partage a été interrompu.');
    }
  };

  const onConfirmDelete = () => {
    sheetRef.current?.dismiss();
    deleteAll();
    router.replace('/');
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    []
  );

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Txt variant="display">Réglages</Txt>
      </View>

      <View style={{ padding: spacing.xl, gap: spacing.lg, flex: 1 }}>
        {/* Privacy */}
        <View style={s.privacy}>
          <View style={s.privacyHead}>
            <Icon name="lock" size={18} color={colors.brandPrimary} strokeWidth={2} />
            <Txt variant="subtitle">Vos données vous appartiennent</Txt>
          </View>
          <Txt variant="small" style={{ marginTop: spacing.sm }}>
            Tout est stocké uniquement sur ce téléphone. Rien n'est envoyé en ligne. Vous
            décidez seul(e) de partager ou non.
          </Txt>
        </View>

        {/* Reminder info */}
        <Row
          icon="calendar"
          title="Point quotidien"
          subtitle={state.settings?.reminderTime ? `Chaque jour vers ${state.settings.reminderTime}` : '—'}
        />

        {/* Export */}
        <View style={s.group}>
          <Txt variant="overline" color={colors.muted} style={{ marginBottom: spacing.sm }}>
            Exporter
          </Txt>
          <ActionRow
            testID="export-json-button"
            icon="download"
            title="Sauvegarde complète"
            subtitle="Fichier JSON de toutes vos données"
            onPress={onExportJson}
          />
          <View style={s.sep} />
          <ActionRow
            testID="export-summary-button"
            icon="share"
            title="Résumé partageable"
            subtitle="Texte clair à envoyer où vous voulez"
            onPress={onExportSummary}
          />
        </View>

        {/* Delete */}
        <Pressable
          testID="delete-data-button"
          onPress={() => sheetRef.current?.present()}
          style={s.deleteRow}
        >
          <Icon name="trash" size={18} color={colors.error} strokeWidth={2} />
          <Txt variant="bodyStrong" color={colors.error}>
            Supprimer toutes mes données
          </Txt>
        </Pressable>

        <Txt variant="small" color={colors.muted} center style={{ marginTop: 'auto' }}>
          Childeric · un pas après l'autre
        </Txt>
      </View>

      {toast ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOut}
          style={[s.toast, { bottom: insets.bottom + spacing.xl }]}
        >
          <Txt variant="bodyStrong" color={colors.onSurfaceInverse} center>
            {toast}
          </Txt>
        </Animated.View>
      ) : null}

      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
        backgroundStyle={{ backgroundColor: colors.surface }}
      >
        <BottomSheetView style={[s.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
          <View style={s.sheetIcon}>
            <Icon name="trash" size={26} color={colors.error} strokeWidth={2} />
          </View>
          <Txt variant="title" center>
            Tout supprimer ?
          </Txt>
          <Txt variant="body" center style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
            Votre bilan, votre plan et votre suivi seront effacés définitivement de cet
            appareil. Cette action est irréversible.
          </Txt>
          <Button
            testID="confirm-delete-button"
            label="Oui, tout supprimer"
            onPress={onConfirmDelete}
            haptic="medium"
          />
          <View style={{ height: spacing.md }} />
          <Button
            testID="cancel-delete-button"
            label="Annuler"
            variant="ghost"
            onPress={() => sheetRef.current?.dismiss()}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

function Row({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Icon name={icon} size={20} color={colors.onSurfaceSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" color={colors.muted}>
          {subtitle}
        </Txt>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  testID,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [s.actionRow, pressed && { opacity: 0.6 }]}
    >
      <View style={s.rowIcon}>
        <Icon name={icon} size={20} color={colors.brandPrimary} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        <Txt variant="small" color={colors.muted}>
          {subtitle}
        </Txt>
      </View>
      <Icon name="chevron-right" size={20} color={colors.muted} />
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  privacy: { backgroundColor: c.brandTertiary, borderRadius: radius.lg, padding: spacing.lg },
  privacyHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  group: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: c.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: 1, backgroundColor: c.divider, marginVertical: spacing.sm },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: c.error,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: c.surfaceInverse,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  sheet: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, alignItems: 'stretch' },
  sheetIcon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
}));
