import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  analyzeJobDescription,
  type JobMatchResult,
  type MatchLevel,
} from '@/api/job';
import { useJobContext } from '@/context/job-context';

type SkillListProps = {
  title: string;
  skills: string[];
  emptyMessage: string;
  tone: 'success' | 'warning';
};

function SkillList({ title, skills, emptyMessage, tone }: SkillListProps) {
  const textStyle = tone === 'success' ? styles.matchText : styles.missingText;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {skills.length === 0 ? (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      ) : (
        skills.map((skill) => (
          <Text key={skill} style={[styles.skillText, textStyle]}>
            {tone === 'success' ? '✓' : '–'} {skill}
          </Text>
        ))
      )}
    </View>
  );
}

const matchLabels: Record<MatchLevel, string> = {
  full: 'Full match',
  partial: 'Partial match',
  missing: 'Missing',
};

export default function AnalyzeScreen() {
  const router = useRouter();
  const { jobDescription, setJobDescription } = useJobContext();
  const [result, setResult] = useState<JobMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function submitJobDescription() {
    if (isAnalyzing) {
      return;
    }

    Keyboard.dismiss();
    setError(null);
    setResult(null);
    setIsAnalyzing(true);

    try {
      setResult(await analyzeJobDescription(jobDescription));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Job analysis fail hua.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Resume</Text>
        </Pressable>

        <Text style={styles.step}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Job description check karo</Text>
        <Text style={styles.description}>
          Puri job description paste karo. Result sirf uploaded resume ke proof par banega.
        </Text>

        <TextInput
          accessibilityLabel="Job description"
          multiline
          onChangeText={(value) => {
            setJobDescription(value);
            setError(null);
          }}
          placeholder="Job responsibilities aur required skills yahan paste karo…"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          textAlignVertical="top"
          value={jobDescription}
        />
        <Text style={styles.characterCount}>{jobDescription.trim().length} / 30,000</Text>

        <Pressable
          accessibilityRole="button"
          disabled={isAnalyzing}
          onPress={submitJobDescription}
          style={({ pressed }) => [
            styles.analyzeButton,
            isAnalyzing && styles.analyzeButtonDisabled,
            pressed && !isAnalyzing && styles.pressed,
          ]}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.analyzeButtonText}>Analyze match</Text>
          )}
        </Pressable>

        {error && (
          <View accessibilityRole="alert" style={[styles.messageCard, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.scoreCard}>
              <Text style={styles.score}>{result.score}%</Text>
              <Text style={styles.scoreLabel}>resume match</Text>
              <Text style={styles.summary}>{result.summary}</Text>
            </View>

            <SkillList
              emptyMessage="Abhi koi clear match nahi mila."
              skills={result.matching_skills}
              title="Match ho raha hai"
              tone="success"
            />
            <SkillList
              emptyMessage="Koi missing requirement nahi mili."
              skills={result.missing_skills}
              title="Missing proof"
              tone="warning"
            />

            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>Requirement-wise reason</Text>
              {result.requirements.map((item, index) => (
                <View key={`${item.requirement}-${index}`} style={styles.requirementCard}>
                  <View style={styles.requirementHeader}>
                    <Text style={styles.requirementTitle}>{item.requirement}</Text>
                    <Text style={[styles.matchBadge, styles[`${item.match_level}Badge`]]}>
                      {matchLabels[item.match_level]}
                    </Text>
                  </View>
                  <Text style={styles.importance}>{item.importance.toUpperCase()}</Text>
                  <Text style={styles.explanation}>{item.explanation}</Text>
                  {item.evidence && <Text style={styles.evidence}>“{item.evidence}”</Text>}
                </View>
              ))}
            </View>

            <View style={styles.methodCard}>
              <Text style={styles.methodTitle}>Score ka hisaab</Text>
              <Text style={styles.methodText}>{result.scoring_method}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/chat')}
              style={({ pressed }) => [styles.chatButton, pressed && styles.pressed]}
            >
              <Text style={styles.chatButtonText}>AI chat kholo →</Text>
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
    padding: 24,
    paddingBottom: 48,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '700',
  },
  step: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 18,
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
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    borderWidth: 1,
    color: '#111827',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 26,
    minHeight: 220,
    padding: 16,
  },
  characterCount: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 7,
    textAlign: 'right',
  },
  analyzeButton: {
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    marginTop: 18,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  analyzeButtonText: {
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
  resultContainer: {
    marginTop: 24,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 24,
  },
  score: {
    color: '#4338CA',
    fontSize: 48,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '700',
  },
  summary: {
    color: '#374151',
    lineHeight: 21,
    marginTop: 12,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    padding: 18,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
  skillText: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: 4,
  },
  matchText: {
    color: '#047857',
  },
  missingText: {
    color: '#B45309',
  },
  emptyText: {
    color: '#6B7280',
    lineHeight: 21,
  },
  requirementsSection: {
    marginTop: 22,
  },
  requirementCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    padding: 16,
  },
  requirementHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  requirementTitle: {
    color: '#111827',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  matchBadge: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  fullBadge: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
  },
  partialBadge: {
    backgroundColor: '#FEF3C7',
    color: '#B45309',
  },
  missingBadge: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  importance: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 10,
  },
  explanation: {
    color: '#4B5563',
    lineHeight: 21,
    marginTop: 8,
  },
  evidence: {
    borderLeftColor: '#A5B4FC',
    borderLeftWidth: 3,
    color: '#4338CA',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 10,
    paddingLeft: 10,
  },
  methodCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginTop: 16,
    padding: 18,
  },
  methodTitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '800',
  },
  methodText: {
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 6,
  },
  chatButton: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    marginTop: 18,
    padding: 16,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
