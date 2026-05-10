import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { store, subscribe, addPost, likePost, addComment } from '@/lib/store';

function PostCard({ post, villaId, resident }: {
  post: (typeof store.villas)[0]['community'][0];
  villaId: string;
  resident: NonNullable<typeof store.loggedResident>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  function handleLike() {
    likePost(villaId, post.id);
  }

  function handleComment() {
    if (!commentText.trim()) return;
    addComment(villaId, post.id, resident.ho, resident.name, commentText.trim());
    setCommentText('');
  }

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorBadge}>
          <Text style={styles.authorHo}>{post.from}</Text>
        </View>
        <Text style={styles.authorName}>{post.fromName}</Text>
        <Text style={styles.postDate}>{post.date}</Text>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postBody}>{post.body}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
          <Text style={styles.actionText}>♥ {post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
          <Text style={styles.actionText}>
            댓글 {post.comments.length}
            {post.comments.length > 0 || expanded ? (expanded ? '  ▲' : '  ▼') : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.commentsSection}>
          {post.comments.map((c, idx) => (
            <View key={idx} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.from} {c.fromName}</Text>
                <Text style={styles.commentDate}>{c.date}</Text>
              </View>
              <Text style={styles.commentBody}>{c.text}</Text>
            </View>
          ))}

          {/* Comment Input */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="댓글 입력..."
              placeholderTextColor="#9CA3AF"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity style={styles.commentSendBtn} onPress={handleComment} activeOpacity={0.8}>
              <Text style={styles.commentSendText}>등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function CommunityScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === store.loggedVillaId);
  const resident = store.loggedResident;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  if (!villa || !resident) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>빌라 정보를 불러올 수 없습니다</Text>
        </View>
      </View>
    );
  }

  function handlePost() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('알림', '제목과 내용을 모두 입력하세요');
      return;
    }
    addPost(villa!.id, resident!.ho, resident!.name, title.trim(), body.trim());
    setTitle('');
    setBody('');
    Alert.alert('등록 완료', '게시글이 등록되었습니다');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>커뮤니티</Text>
        <Text style={styles.headerSub}>{villa.name}</Text>
      </View>

      {/* New Post Card */}
      <View style={styles.newPostCard}>
        <Text style={styles.newPostLabel}>새 글 쓰기</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="제목"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.bodyInput}
          placeholder="내용을 입력하세요"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={body}
          onChangeText={setBody}
        />
        <View style={styles.newPostActions}>
          <View />
          <TouchableOpacity style={styles.submitButton} onPress={handlePost} activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>등록하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts List */}
      <View style={styles.postsSection}>
        {villa.community.length === 0 ? (
          <View style={styles.emptyPostCard}>
            <Text style={styles.emptyPostTitle}>아직 게시글이 없습니다</Text>
            <Text style={styles.emptyPostSub}>첫 번째 글을 작성해 보세요</Text>
          </View>
        ) : (
          villa.community.map(post => (
            <PostCard key={post.id} post={post} villaId={villa.id} resident={resident} />
          ))
        )}
      </View>

      {/* Legal Footer */}
      <View style={styles.legalFooter}>
        <TouchableOpacity onPress={() => router.push('/legal/terms')} activeOpacity={0.6}>
          <Text style={styles.legalLink}>이용약관</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity onPress={() => router.push('/legal/privacy')} activeOpacity={0.6}>
          <Text style={styles.legalLink}>개인정보 처리방침</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: '#1A1D26' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },

  newPostCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  newPostLabel: { fontSize: 15, fontWeight: '800', color: '#1A1D26', marginBottom: 12 },
  titleInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1D26',
    marginBottom: 8,
  },
  bodyInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1A1D26',
    minHeight: 80,
    marginBottom: 12,
  },
  newPostActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submitButton: {
    backgroundColor: '#4263E8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  postsSection: { paddingHorizontal: 16 },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  authorBadge: { backgroundColor: '#E8EEFB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  authorHo: { fontSize: 12, fontWeight: '700', color: '#4263E8' },
  authorName: { fontSize: 13, fontWeight: '600', color: '#1A1D26' },
  postDate: { fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' },
  postTitle: { fontSize: 15, fontWeight: '800', color: '#1A1D26', marginBottom: 6 },
  postBody: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F5F6FA', paddingTop: 10 },
  actionText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

  commentsSection: {
    marginTop: 12,
    backgroundColor: '#F8F9FB',
    borderRadius: 10,
    padding: 12,
  },
  commentCard: { marginBottom: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: '#4263E8' },
  commentDate: { fontSize: 11, color: '#9CA3AF' },
  commentBody: { fontSize: 13, color: '#1A1D26', lineHeight: 18 },

  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1A1D26',
    borderWidth: 1,
    borderColor: '#E8EBF0',
  },
  commentSendBtn: {
    backgroundColor: '#4263E8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  commentSendText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  emptyPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EBF0',
  },
  emptyPostTitle: { fontSize: 15, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  emptyPostSub: { fontSize: 13, color: '#9CA3AF' },

  legalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  legalLink: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  legalDot: { fontSize: 11, color: '#D1D5DB' },
});
