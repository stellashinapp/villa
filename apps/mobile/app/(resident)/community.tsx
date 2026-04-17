import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';

type Comment = {
  id: string;
  author: string;
  body: string;
  date: string;
};

type Post = {
  id: string;
  ho: string;
  name: string;
  date: string;
  title: string;
  body: string;
  likes: number;
  comments: Comment[];
};

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    ho: '301호',
    name: '김민수',
    date: '2026.04.16',
    title: '옥상 텃밭 같이 하실 분!',
    body: '날씨가 따뜻해져서 옥상 텃밭을 시작하려고 합니다.\n같이 하실 분 댓글 남겨주세요 🌱',
    likes: 5,
    comments: [
      { id: 'c1', author: '201호 이영희', body: '저도 참여하고 싶어요! 토마토 심고 싶은데 가능할까요?', date: '04.16' },
      { id: 'c2', author: '402호 박준혁', body: '좋은 생각이네요 저도 끼워주세요~', date: '04.17' },
    ],
  },
  {
    id: '2',
    ho: '201호',
    name: '이영희',
    date: '2026.04.14',
    title: '분리수거 요일 정리',
    body: '월: 일반쓰레기\n수: 재활용 (플라스틱, 캔, 종이)\n금: 음식물 쓰레기\n\n다들 요일 잘 지켜주세요!',
    likes: 12,
    comments: [
      { id: 'c3', author: '102호 최수진', body: '정리 감사합니다! 냉장고에 붙여놔야겠어요', date: '04.14' },
    ],
  },
  {
    id: '3',
    ho: '502호',
    name: '정대현',
    date: '2026.04.10',
    title: '1층 현관 비밀번호 변경 안내',
    body: '관리실에서 1층 현관 비밀번호를 변경했다고 합니다.\n새 비밀번호는 각 세대 우편함에 안내문이 있으니 확인해 주세요.',
    likes: 8,
    comments: [],
  },
];

function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorBadge}>
          <Text style={styles.authorHo}>{post.ho}</Text>
        </View>
        <Text style={styles.authorName}>{post.name}</Text>
        <Text style={styles.postDate}>{post.date}</Text>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postBody}>{post.body}</Text>
      <View style={styles.postActions}>
        <Text style={styles.actionText}>❤️ {post.likes}</Text>
        <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
          <Text style={styles.actionText}>
            💬 {post.comments.length}
            {post.comments.length > 0 ? (expanded ? '  ▲' : '  ▼') : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {expanded && post.comments.length > 0 && (
        <View style={styles.commentsSection}>
          {post.comments.map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.author}</Text>
                <Text style={styles.commentDate}>{c.date}</Text>
              </View>
              <Text style={styles.commentBody}>{c.body}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CommunityScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>커뮤니티</Text>
      </View>

      {/* New Post Card */}
      <View style={styles.newPostCard}>
        <Text style={styles.newPostLabel}>✏️ 새 글 쓰기</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="제목"
          placeholderTextColor="#B8BBC2"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.bodyInput}
          placeholder="내용을 입력하세요"
          placeholderTextColor="#B8BBC2"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={body}
          onChangeText={setBody}
        />
        <View style={styles.newPostActions}>
          <TouchableOpacity style={styles.photoButton} activeOpacity={0.7}>
            <Text style={styles.photoButtonText}>📷 사진 첨부</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>등록하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts List */}
      <View style={styles.postsSection}>
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  screenTitle: { fontSize: 22, fontWeight: '900', color: '#181A20' },

  newPostCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAEBEF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  newPostLabel: { fontSize: 15, fontWeight: '800', color: '#181A20', marginBottom: 12 },
  titleInput: {
    backgroundColor: '#F3F4F8',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#181A20',
    marginBottom: 8,
  },
  bodyInput: {
    backgroundColor: '#F3F4F8',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#181A20',
    minHeight: 80,
    marginBottom: 12,
  },
  newPostActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoButton: {
    backgroundColor: '#F3F4F8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  photoButtonText: { fontSize: 13, fontWeight: '600', color: '#7C7F87' },
  submitButton: {
    backgroundColor: '#EC4899',
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
    borderColor: '#EAEBEF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  authorBadge: { backgroundColor: '#E8EEFB', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  authorHo: { fontSize: 12, fontWeight: '700', color: '#3B5BDB' },
  authorName: { fontSize: 13, fontWeight: '600', color: '#181A20' },
  postDate: { fontSize: 12, color: '#B8BBC2', marginLeft: 'auto' },
  postTitle: { fontSize: 15, fontWeight: '800', color: '#181A20', marginBottom: 6 },
  postBody: { fontSize: 13, color: '#7C7F87', lineHeight: 20, marginBottom: 12 },
  postActions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F3F4F8', paddingTop: 10 },
  actionText: { fontSize: 13, color: '#7C7F87', fontWeight: '600' },

  commentsSection: {
    marginTop: 12,
    backgroundColor: '#F8F9FB',
    borderRadius: 10,
    padding: 12,
  },
  commentCard: { marginBottom: 10 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: '#3B5BDB' },
  commentDate: { fontSize: 11, color: '#B8BBC2' },
  commentBody: { fontSize: 13, color: '#181A20', lineHeight: 18 },
});
