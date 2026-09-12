import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Share, Switch, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
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
import {
  cancelDailyReminder,
  getPermissionStatus,
  requestPermission,
  scheduleDailyReminder,
  sendTestNotification,
} from '@/src/lib/notifications';

const REMINDER_TIMES = ['07:00', '08:00', '12:00', '18:00', '20:00', '21:00', '22:00'];

export default function Reglages() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, saveSettings, buildExport, buildSummary, deleteAll } = useStore();

  const [toast, setToast] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [permGranted, setPermGranted] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    getPermissionStatus().then((r) => {
      setPermGranted(r.granted);
      setCanAskAgain(r.canAskAgain);
    });
  }, []);

  const reminderTime = state.settings?.reminderTime ?? '20:00';
  const reminderEnabled = !!state.settings?.reminderEnabled && permGranted;

  const persistSettings = (patch: Partial<NonNullable<typeof state.settings>>) => {
    if (!state.settings) return;
    saveSettings({ ...state.settings, ...patch });
  };

  const activateReminder = async () => {
    const req = await requestPermission();
    setPermGranted(req.granted);
    setCanAskAgain(req.canAskAgain);
    if (req.granted) {
      await scheduleDailyReminder(reminderTime, state.settings?.firstName);
      persistSettings({ reminderEnabled: true });
    } else {
      showToast('Notifications refusées. Vous pouvez réessayer plus tard.');
    }
  };

  const onToggleReminder = async (value: boolean) => {
    Haptics.selectionAsync();
    if (!value) {
      await cancelDailyReminder();
      persistSettings({ reminderEnabled: false });
      return;
    }
    const status = await getPermissionStatus();
    if (status.granted) {
      await scheduleDailyReminder(reminderTime, state.settings?.firstName);
      persistSettings({ reminderEnabled: true });
      return;
    }
    if (!status.canAskAgain) {
      Alert.alert(
        'Notifications désactivées',
        "Autorisez les notifications dans les réglages de votre téléphone pour recevoir votre rappel quotidien.",
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    Alert.alert(
      'Rappel quotidien',
      "Autorisez les notifications pour recevoir un rappel à l'heure choisie. Tout reste sur cet appareil.",
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Continuer', onPress: activateReminder },
      ]
    );
  };

  const onPickReminderTime = async (t: string) => {
    Haptics.selectionAsync();
    persistSettings({ reminderTime: t });
    if (reminderEnabled) {
      await scheduleDailyReminder(t, state.settings?.firstName);
    }
  };

  const onTestNotification = async () => {
    if (!permGranted) {
      showToast('Activez le rappel pour tester une notification.');
      return;
    }
    setSendingTest(true);
    try {
      await sendTestNotification();
      showToast('Notification envoyée, elle arrive dans 3 secondes.');
    } finally {
      setSendingTest(false);
    }
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

  const onConfirmDelete = async () => {
    sheetRef.current?.dismiss();
    const success = await deleteAll();
    if (success) {
      router.replace('/onboarding');
    } else {
      showToast('La suppression a échoué, vos données sont toujours présentes.');
    }
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
            Tout est stocké uniquement sur ce téléphone. Rien n&apos;est envoyé en ligne. Vous
            décidez seul(e) de partager ou non.
          </Txt>
        </View>

        {/* Reminder */}
        <View style={s.group}>
          <View style={s.reminderHead}>
            <View style={s.rowIcon}>
              <Icon name="bell" size={20} color={colors.brandPrimary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">Rappel quotidien</Txt>
              <Txt variant="small" color={colors.muted}>
                {reminderEnabled
                  ? `Notification chaque jour à ${reminderTime}`
                  : 'Recevez une vraie notification pour ne jamais oublier'}
              </Txt>
            </View>
            <Switch
              testID="reminder-toggle"
              value={reminderEnabled}
              onValueChange={onToggleReminder}
              trackColor={{ false: colors.surfaceTertiary, true: colors.brandPrimary }}
              thumbColor={Platform.OS === 'android' ? colors.surface : undefined}
            />
          </View>

          {!permGranted && !canAskAgain ? (
            <View style={s.warnBox}>
              <Icon name="info" size={16} color={colors.error} />
              <Txt variant="small" color={colors.error} style={{ flex: 1 }}>
                Notifications bloquées dans les réglages du téléphone.
              </Txt>
              <Pressable onPress={() => Linking.openSettings()} testID="open-settings-button">
                <Txt variant="label" color={colors.error}>
                  Réglages
                </Txt>
              </Pressable>
            </View>
          ) : null}

          <Txt variant="label" color={colors.muted} style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
            Heure du rappel
          </Txt>
          <View style={s.chipsWrap}>
            {REMINDER_TIMES.map((t) => {
              const active = t === reminderTime;
              return (
                <Pressable
                  key={t}
                  testID={`settings-reminder-time-${t}`}
                  onPress={() => onPickReminderTime(t)}
                  style={[
                    s.timeChip,
                    { backgroundColor: active ? colors.brandPrimary : colors.surfaceTertiary },
                  ]}
                >
                  <Txt variant="bodyStrong" color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary}>
                    {t}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            testID="test-notification-button"
            onPress={onTestNotification}
            disabled={sendingTest}
            style={[s.testRow, sendingTest && { opacity: 0.5 }]}
          >
            <Icon name="sparkle" size={16} color={colors.brandPrimary} />
            <Txt variant="bodyStrong" color={colors.brandPrimary}>
              Tester le rappel maintenant
            </Txt>
          </Pressable>
          <Txt variant="small" color={colors.muted} style={{ marginTop: spacing.sm }}>
            Une notification locale, sans compte ni serveur. Pour une fiabilité totale au fil
            des jours, générez un build via le bouton Publier.
          </Txt>
        </View>

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
          Childeric · un pas après l&apos;autre
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
  reminderHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
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
