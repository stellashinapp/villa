// 미니멀 라인 아이콘 컴포넌트.
// 외부 의존성 없이 View 도형으로 구성 — 일관된 두께·라운딩으로 통일감.

import { View } from 'react-native';

export type IconName =
  | 'home'
  | 'message'
  | 'villa'
  | 'settings'
  | 'bills'
  | 'residents'
  | 'parking'
  | 'notice'
  | 'community'
  | 'report';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const STROKE = 2;

export default function Icon({ name, size = 22, color = '#1A1D26' }: IconProps) {
  const s = size;
  const wrap = { width: s, height: s, alignItems: 'center' as const, justifyContent: 'center' as const, position: 'relative' as const };

  switch (name) {
    case 'home': {
      // 빨간 직사각형 바디 + 윗면을 두 개의 회전된 막대로 지붕 표현
      const body = s * 0.62;
      const roofLen = s * 0.42;
      return (
        <View style={wrap}>
          {/* 지붕 (왼쪽) */}
          <View style={{
            position: 'absolute', top: s * 0.18, left: s * 0.06,
            width: roofLen, height: STROKE, backgroundColor: color, borderRadius: STROKE,
            transform: [{ rotate: '-35deg' }],
          }} />
          {/* 지붕 (오른쪽) */}
          <View style={{
            position: 'absolute', top: s * 0.18, right: s * 0.06,
            width: roofLen, height: STROKE, backgroundColor: color, borderRadius: STROKE,
            transform: [{ rotate: '35deg' }],
          }} />
          {/* 본체 */}
          <View style={{
            position: 'absolute', bottom: s * 0.12, left: (s - body) / 2,
            width: body, height: s * 0.5,
            borderWidth: STROKE, borderColor: color, borderRadius: 3, borderTopWidth: 0,
          }} />
        </View>
      );
    }

    case 'message': {
      // 봉투 — 둥근 사각형 + 위쪽 V형 두 막대
      const w = s * 0.78;
      const h = s * 0.58;
      return (
        <View style={wrap}>
          <View style={{
            width: w, height: h,
            borderWidth: STROKE, borderColor: color, borderRadius: 4,
          }}>
            {/* V (왼쪽 절반) */}
            <View style={{
              position: 'absolute', top: -STROKE, left: -STROKE,
              width: w * 0.55, height: STROKE, backgroundColor: color, borderRadius: STROKE,
              transform: [{ rotate: '28deg' }, { translateY: h * 0.18 }, { translateX: w * 0.15 }],
            }} />
            <View style={{
              position: 'absolute', top: -STROKE, right: -STROKE,
              width: w * 0.55, height: STROKE, backgroundColor: color, borderRadius: STROKE,
              transform: [{ rotate: '-28deg' }, { translateY: h * 0.18 }, { translateX: -w * 0.15 }],
            }} />
          </View>
        </View>
      );
    }

    case 'villa': {
      // 두 건물 — 작은 사각 + 큰 사각
      return (
        <View style={wrap}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
            <View style={{
              width: s * 0.28, height: s * 0.55,
              borderWidth: STROKE, borderColor: color, borderRadius: 2,
            }} />
            <View style={{
              width: s * 0.36, height: s * 0.75,
              borderWidth: STROKE, borderColor: color, borderRadius: 2,
            }}>
              {/* 창문 */}
              <View style={{ position: 'absolute', top: s * 0.18, left: s * 0.07, width: s * 0.08, height: s * 0.08, backgroundColor: color, borderRadius: 1 }} />
            </View>
          </View>
        </View>
      );
    }

    case 'settings': {
      // 톱니 — 외곽 원 + 4개 짧은 막대로 톱니 표현
      const r = s * 0.32;
      const tooth = { position: 'absolute' as const, width: STROKE, height: s * 0.14, backgroundColor: color, borderRadius: STROKE };
      return (
        <View style={wrap}>
          {/* 톱니 4방향 */}
          <View style={[tooth, { top: 0, left: '50%', transform: [{ translateX: -STROKE / 2 }] }]} />
          <View style={[tooth, { bottom: 0, left: '50%', transform: [{ translateX: -STROKE / 2 }] }]} />
          <View style={[tooth, { left: 0, top: '50%', transform: [{ translateY: -STROKE / 2 }, { rotate: '90deg' }] }]} />
          <View style={[tooth, { right: 0, top: '50%', transform: [{ translateY: -STROKE / 2 }, { rotate: '90deg' }] }]} />
          {/* 외곽 원 */}
          <View style={{
            width: r * 2, height: r * 2, borderRadius: r,
            borderWidth: STROKE, borderColor: color,
          }} />
          {/* 가운데 점 */}
          <View style={{
            position: 'absolute', width: STROKE * 1.6, height: STROKE * 1.6,
            borderRadius: STROKE, backgroundColor: color,
          }} />
        </View>
      );
    }

    case 'bills': {
      // 동전 — 원 + 가운데 ₩ 대신 두 가로선
      const r = s * 0.42;
      return (
        <View style={wrap}>
          <View style={{
            width: r * 2, height: r * 2, borderRadius: r,
            borderWidth: STROKE, borderColor: color,
            alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            <View style={{ width: r, height: STROKE, backgroundColor: color, borderRadius: STROKE }} />
            <View style={{ width: r, height: STROKE, backgroundColor: color, borderRadius: STROKE }} />
          </View>
        </View>
      );
    }

    case 'residents': {
      // 사람 — 머리 원 + 몸통 반원/사각
      const headR = s * 0.16;
      return (
        <View style={wrap}>
          {/* 머리 */}
          <View style={{
            position: 'absolute', top: s * 0.12,
            width: headR * 2, height: headR * 2, borderRadius: headR,
            borderWidth: STROKE, borderColor: color,
          }} />
          {/* 몸통 */}
          <View style={{
            position: 'absolute', bottom: s * 0.12, left: s * 0.18,
            width: s * 0.64, height: s * 0.36,
            borderWidth: STROKE, borderColor: color,
            borderTopLeftRadius: s * 0.32, borderTopRightRadius: s * 0.32,
            borderBottomWidth: 0,
          }} />
        </View>
      );
    }

    case 'parking': {
      // 사각형 + 'P' 형태 (간소화: 좌측 라인 + 위쪽 곡선)
      const w = s * 0.62;
      const h = s * 0.74;
      return (
        <View style={wrap}>
          <View style={{
            width: w, height: h,
            borderWidth: STROKE, borderColor: color, borderRadius: 4,
            alignItems: 'flex-start', justifyContent: 'flex-start',
            paddingTop: s * 0.13, paddingLeft: s * 0.13,
          }}>
            {/* 'P' — 세로 라인 + 위쪽 D형 */}
            <View style={{ width: STROKE, height: h * 0.6, backgroundColor: color, borderRadius: STROKE }} />
            <View style={{
              position: 'absolute', top: s * 0.13, left: s * 0.13 + STROKE,
              width: s * 0.18, height: s * 0.22,
              borderWidth: STROKE, borderColor: color, borderLeftWidth: 0,
              borderTopRightRadius: s * 0.11, borderBottomRightRadius: s * 0.11,
            }} />
          </View>
        </View>
      );
    }

    case 'notice': {
      // 종 (또는 메가폰) — 사다리꼴 + 점
      return (
        <View style={wrap}>
          {/* 메가폰 — 직사각 + 우측 삼각 (사선) */}
          <View style={{
            width: s * 0.55, height: s * 0.42,
            borderWidth: STROKE, borderColor: color, borderRadius: 3,
          }} />
          {/* 핸들 */}
          <View style={{
            position: 'absolute', bottom: s * 0.18,
            width: s * 0.16, height: s * 0.18,
            borderWidth: STROKE, borderColor: color,
            borderTopWidth: 0, borderRadius: 2,
            transform: [{ translateY: s * 0.18 }],
          }} />
          {/* 사운드 라인 */}
          <View style={{ position: 'absolute', top: s * 0.42, right: s * 0.12, width: s * 0.16, height: STROKE, backgroundColor: color, borderRadius: STROKE }} />
        </View>
      );
    }

    case 'community': {
      // 말풍선 두 개 겹침
      return (
        <View style={wrap}>
          <View style={{
            position: 'absolute', top: s * 0.1, left: s * 0.06,
            width: s * 0.55, height: s * 0.45,
            borderWidth: STROKE, borderColor: color, borderRadius: s * 0.1,
          }} />
          <View style={{
            position: 'absolute', bottom: s * 0.12, right: s * 0.06,
            width: s * 0.55, height: s * 0.4,
            borderWidth: STROKE, borderColor: color, borderRadius: s * 0.1,
            backgroundColor: '#FFFFFF',
          }} />
        </View>
      );
    }

    case 'report': {
      // 깃발 또는 종이 — 사각 + 모서리 접힘
      return (
        <View style={wrap}>
          <View style={{
            width: s * 0.62, height: s * 0.78,
            borderWidth: STROKE, borderColor: color, borderRadius: 2,
            alignItems: 'center', justifyContent: 'center', gap: 3,
          }}>
            <View style={{ width: s * 0.4, height: STROKE, backgroundColor: color, borderRadius: STROKE }} />
            <View style={{ width: s * 0.4, height: STROKE, backgroundColor: color, borderRadius: STROKE }} />
            <View style={{ width: s * 0.25, height: STROKE, backgroundColor: color, borderRadius: STROKE }} />
          </View>
        </View>
      );
    }

    default:
      return <View style={wrap} />;
  }
}
