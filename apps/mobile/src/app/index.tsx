import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type IngestResult, uploadResume, validateResume } from '@/api/resume';

function readableFileSize(size?: number) {
  if (!size) {
    return 'Size unavailable';
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResumeUploadScreen() {
  const router = useRouter();
  const [resume, setResume] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function pickResume() {
    setError(null);
    setResult(null);

    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) {
        return;
      }

      const selectedResume = pickerResult.assets[0];
      validateResume(selectedResume);
      setResume(selectedResume);
    } catch (caughtError) {
      setResume(null);
      setError(caughtError instanceof Error ? caughtError.message : 'PDF choose nahi ho paayi.');
    }
  }

  async function submitResume() {
    if (!resume || isUploading) {
      return;
    }

    setError(null);
    setResult(null);
    setIsUploading(true);

    try {
      setResult(await uploadResume(resume));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Resume upload fail hua.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.step}>STEP 1 OF 3</Text>
        <Text style={styles.title}>Apna resume upload karo</Text>
        <Text style={styles.description}>
          PDF se experience niklega aur job matching ke liye securely process hoga.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={pickResume}
          style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
        >
          <Text style={styles.pickerIcon}>PDF</Text>
          <Text style={styles.pickerTitle}>{resume ? resume.name : 'PDF choose karo'}</Text>
          <Text style={styles.pickerHint}>
            {resume ? readableFileSize(resume.size) : 'Maximum file size: 5 MB'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={!resume || isUploading}
          onPress={submitResume}
          style={({ pressed }) => [
            styles.uploadButton,
            (!resume || isUploading) && styles.uploadButtonDisabled,
            pressed && resume && !isUploading && styles.pressed,
          ]}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload resume</Text>
          )}
        </Pressable>

        {error && (
          <View accessibilityRole="alert" style={[styles.messageCard, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={[styles.messageCard, styles.successCard]}>
            <Text style={styles.successTitle}>Resume ready hai ✓</Text>
            <Text style={styles.successText}>
              {result.page_count} pages · {result.chunk_count} chunks · {result.character_count}{' '}
              characters
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/analyze')}
              style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
            >
              <Text style={styles.nextButtonText}>Job analyze karo →</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  step: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 10,
  },
  description: {
    color: '#4B5563',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  picker: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C7D2FE',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 2,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  pickerIcon: {
    color: '#4338CA',
    fontSize: 14,
    fontWeight: '900',
  },
  pickerTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  pickerHint: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 6,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    marginTop: 18,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
  messageCard: {
    borderRadius: 14,
    marginTop: 18,
    padding: 16,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#B91C1C',
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: '#D1FAE5',
  },
  successTitle: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '800',
  },
  successText: {
    color: '#047857',
    lineHeight: 20,
    marginTop: 6,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 12,
    marginTop: 16,
    padding: 14,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
