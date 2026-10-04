import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Bar, Button, Card, Empty, inputStyle, Page, PrivacyBadge, SectionTitle, Segmented, Tag } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { Challenge, Visibility } from '../../data/types';
import { colors, radius, type } from '../../theme/theme';

export default function Community() {
  const { data, setVisibility, toggleChallenge, challengeProgress, createChallenge, createCircle, joinCircleByCode } = useApp();
  const [form, setForm] = useState<null | 'circle' | 'join' | 'challenge'>(null);
  const [text, setText] = useState('');
  const [target, setTarget] = useState('3');

  const joined = data.circles.filter((c) => c.joined);
  const close = () => { setForm(null); setText(''); setTarget('3'); };

  const submit = () => {
    if (form === 'join') { if (joinCircleByCode(text)) close(); return; }
    if (!text.trim()) return;
    if (form === 'circle') createCircle(text);
    if (form === 'challenge') createChallenge(text, Math.max(1, Math.min(14, parseInt(target, 10) || 3)));
    close();
  };

  const renderChallenge = (c: Challenge, featured: boolean) => {
    const mine = challengeProgress(c);
    const board = [...c.demo.map((d) => ({ name: d.name, progress: d.progress, me: false })), ...(c.joined ? [{ name: 'You', progress: mine, me: true }] : [])]
      .sort((a, b) => b.progress - a.progress);
    return (
      <Card key={c.id} style={featured ? styles.featured : undefined}>
        {featured && <View style={styles.pill}><Tag color={colors.text}>Featured challenge</Tag></View>}
        <Text style={featured ? styles.featuredTitle : type.h2}>{c.name}</Text>
        <Text style={[type.small, { marginVertical: 4 }]}>
          Finish {c.target} workouts in {c.days} days. {c.demo.length + (c.joined ? 1 : 0)} participants this week.
        </Text>
        <PrivacyBadge visibility={data.visibility} />
        {c.joined && (
          <View style={{ marginTop: 12 }}>
            <Text style={type.small}>Your progress: {Math.min(mine, c.target)} of {c.target}</Text>
            <View style={{ marginTop: 6 }}><Bar value={mine} max={c.target} /></View>
          </View>
        )}
        {board.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Tag color={colors.muted}>Leaderboard (demo members)</Tag>
            {board.map((b, i) => (
              <View key={b.name} style={styles.boardRow}>
                <Text style={[styles.rank, b.me && { color: colors.primaryText }]}>{i + 1}</Text>
                <Text style={{ flex: 1, color: colors.text, fontWeight: b.me ? '800' : '500' }}>{b.name}</Text>
                <Text style={[type.small, { color: colors.primaryText, fontWeight: '700' }]}>{Math.round((Math.min(b.progress, c.target) / c.target) * 100)}% done</Text>
              </View>
            ))}
          </View>
        )}
        {c.joined && mine >= c.target && <Text style={{ color: colors.green, fontWeight: '800', marginTop: 8 }}>Challenge complete. Well done.</Text>}
        <Button label={c.joined ? 'Leave challenge' : 'Join challenge'} variant={c.joined ? 'ghost' : 'primary'} onPress={() => toggleChallenge(c.id)} style={{ marginTop: 14 }} />
      </Card>
    );
  };

  return (
    <Page title="Community Circle" sub="Share your progress and stay inspired" tabbed>
      <Card>
        <Text style={type.h2}>Who can see my activity</Text>
        <View style={{ marginVertical: 10 }}>
          <Segmented<Visibility>
            options={[{ value: 'private', label: 'Only me' }, { value: 'circle', label: 'Private circle' }, { value: 'public', label: 'Everyone' }]}
            value={data.visibility}
            onChange={setVisibility}
          />
        </View>
        <PrivacyBadge visibility={data.visibility} />
        <Text style={[type.small, { marginTop: 8 }]}>
          {data.visibility === 'private' ? 'Nothing is shared. Challenges still count your workouts for you.'
            : data.visibility === 'circle' ? 'Finished workouts are shared with circles you have joined.'
            : 'Anyone in FitFlow can see your finished workouts.'}
        </Text>
      </Card>

      {data.challenges.map((c, i) => renderChallenge(c, i === 0))}

      <SectionTitle>Your Circle</SectionTitle>
      {joined.length === 0 && <Empty text="You are not in a circle yet. Create one or join with a code." />}
      {joined.map((c) => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open ${c.name}`} onPress={() => router.push({ pathname: '/circle/[id]', params: { id: c.id } })}>
          <Card style={styles.circle}>
            <Avatar letter={c.name[0]} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{c.name}</Text>
              <Text style={type.small}>{c.members.length + 1} members, code {c.code}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        </Pressable>
      ))}

      {form ? (
        <Card>
          <Text style={type.h2}>{form === 'circle' ? 'Create a circle' : form === 'join' ? 'Join with a code' : 'Create a challenge'}</Text>
          <TextInput
            value={text} onChangeText={setText} autoCapitalize={form === 'join' ? 'characters' : 'sentences'}
            placeholder={form === 'join' ? 'Circle code (try WALK77)' : form === 'circle' ? 'Circle name' : 'Challenge name'}
            placeholderTextColor={colors.muted} style={[inputStyle, styles.input]} accessibilityLabel="Name or code"
          />
          {form === 'challenge' && (
            <TextInput value={target} onChangeText={setTarget} keyboardType="number-pad" placeholder="Workouts to finish" placeholderTextColor={colors.muted} style={[inputStyle, styles.input]} accessibilityLabel="Workouts to finish" />
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label={form === 'join' ? 'Join' : 'Create'} onPress={submit} style={{ flex: 1 }} />
            <Button label="Cancel" variant="ghost" onPress={close} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          <Button label="Create a circle" variant="ghost" onPress={() => setForm('circle')} />
          <Button label="Join with a code" variant="ghost" onPress={() => setForm('join')} />
          <Button label="Create a challenge" variant="ghost" onPress={() => setForm('challenge')} />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  featured: { backgroundColor: '#14163A', borderColor: '#2E3170', borderRadius: 24, paddingVertical: 20 },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.chip, marginBottom: 14 },
  featuredTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  rank: { width: 20, fontWeight: '800', color: colors.muted },
  circle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  input: { marginVertical: 8 },
});
