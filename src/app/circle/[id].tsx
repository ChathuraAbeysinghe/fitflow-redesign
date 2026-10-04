import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Empty, Page, PrivacyBadge, SectionTitle } from '../../components/ui';
import { useApp } from '../../data/AppState';
import { timeAgo } from '../../logic/dates';
import { colors, type } from '../../theme/theme';

export default function CircleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, leaveCircle, postToCircle, cheer } = useApp();
  const [text, setText] = useState('');
  const circle = data.circles.find((c) => c.id === id);

  if (!circle || !circle.joined) {
    return (
      <Page back title="Circle not found">
        <Empty text="This circle is no longer available." />
        <Button label="Back to community" onPress={() => router.navigate('/community')} />
      </Page>
    );
  }

  const feed = data.feed.filter((f) => f.circleId === circle.id);
  const share = () => Share.share({ message: `Join my FitFlow circle "${circle.name}" with code ${circle.code}` });
  const leave = () =>
    Alert.alert(`Leave ${circle.name}?`, circle.createdByMe ? 'You created this circle, so it will be deleted.' : 'You can rejoin later with the code.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => { leaveCircle(circle.id); router.back(); } },
    ]);

  return (
    <Page back title={circle.name} sub={`Invite code ${circle.code}`}>
      <Card>
        <Text style={type.h2}>Privacy</Text>
        <View style={{ marginTop: 6 }}><PrivacyBadge visibility={data.visibility} /></View>
        <Text style={[type.small, { marginTop: 6 }]}>
          {data.visibility === 'private' ? 'Your workouts are not posted here. Change this in the Feed tab.' : 'Your finished workouts are posted here automatically.'}
        </Text>
        <Button label="Share invite code" variant="ghost" onPress={share} style={{ marginTop: 10 }} />
      </Card>

      <SectionTitle>Members</SectionTitle>
      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {[...circle.members, `${data.profile.name} (you)`].map((m) => (
          <View key={m} style={{ alignItems: 'center', width: 64 }}>
            <View style={styles.avatar}><Text style={{ color: '#fff', fontWeight: '800' }}>{m[0]}</Text></View>
            <Text style={[type.small, { textAlign: 'center' }]} numberOfLines={1}>{m}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>Activity</SectionTitle>
      <Card>
        <TextInput value={text} onChangeText={setText} placeholder="Share an update or encourage someone" placeholderTextColor={colors.muted} style={styles.input} multiline accessibilityLabel="Post an update" />
        <Button label="Post" disabled={!text.trim()} onPress={() => { postToCircle(circle.id, text); setText(''); }} />
      </Card>
      {feed.length === 0 ? <Empty text="No activity yet. Finish a workout or post an update." /> : feed.map((f) => (
        <Card key={f.id} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.avatar, f.mine && { backgroundColor: colors.sky }]}><Text style={{ color: '#fff', fontWeight: '800' }}>{f.author[0]}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text }}><Text style={{ fontWeight: '800' }}>{f.mine ? 'You' : f.author}</Text> {f.text}</Text>
            <Text style={type.small}>{timeAgo(f.ts)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={f.cheered ? 'Remove cheer' : 'Cheer'} onPress={() => cheer(f.id)} hitSlop={8} style={{ alignItems: 'center' }}>
            <Ionicons name={f.cheered ? 'heart' : 'heart-outline'} size={22} color={f.cheered ? colors.amber : colors.muted} />
            <Text style={type.small}>{f.cheers}</Text>
          </Pressable>
        </Card>
      ))}

      <Button label={circle.createdByMe ? 'Delete circle' : 'Leave circle'} variant="danger" onPress={leave} style={{ marginTop: 16 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 15, color: colors.text, minHeight: 56 },
});
