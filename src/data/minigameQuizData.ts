import type { LotteryBallStat } from '../types';

export type QuizQuestionType = 'MULTIPLE_CHOICE' | 'FILL_BLANK';
export type QuizCategory =
  | 'HISTORY'
  | 'KOREA_LOTTO'
  | 'SCIENCE_RULE'
  | 'MATH_FUN';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  category: QuizCategory;
  categoryLabel: string;
  difficulty: '쉬움' | '보통' | '매니아';
  question: string;
  options: string[];
  answer: string;
  acceptedAnswers?: string[];
  funFactTitle: string;
  explanation: string;
}

const QUIZ_SEEN_STORAGE_KEY = 'hactto_minigame_quiz_seen_v1';

/**
 * 잘 알려지지 않은 재미있는 로또 역사·과학·확률 상식 64문항 풀
 * - 빈칸 채우기(FILL_BLANK): 직접 입력 또는 보기 칩 선택 모두 지원
 * - 4지선다 객관식(MULTIPLE_CHOICE)
 */
export const LOTTO_TRIVIA_QUESTIONS: QuizQuestion[] = [
  // =========================================================================
  // 1. 대한민국 로또 6/45 역사 & 진기록 (KOREA_LOTTO)
  // =========================================================================
  {
    id: 'kr-01',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 역사',
    difficulty: '쉬움',
    question:
      '대한민국에 온라인 연합복권 [로또 6/45]가 처음 도입되어 제1회 추첨이 열린 연도는 ㅁㅁㅁㅁ년이다.',
    options: ['1998', '2000', '2002', '2004'],
    answer: '2002',
    acceptedAnswers: ['2002', '2002년'],
    funFactTitle: '2002년 12월 7일, 대한민국 첫 로또 추첨!',
    explanation:
      '대한민국 로또 6/45는 2002년 12월 2일 첫 판매를 시작해 2002년 12월 7일 토요일에 역사적인 제1회 추첨 방송이 진행되었습니다.',
  },
  {
    id: 'kr-02',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 역사',
    difficulty: '보통',
    question:
      '역사적인 대한민국 로또 제1회 추첨(2002년 12월 7일) 당시, 1등 당첨자는 총 ㅁ명이었다.',
    options: ['0', '1', '3', '12'],
    answer: '0',
    acceptedAnswers: ['0', '0명', '영', '없음'],
    funFactTitle: '제1회 로또 추첨에서는 1등 당첨자가 단 한 명도 없었다!',
    explanation:
      '제1회 당첨번호(10, 23, 29, 33, 37, 40)를 맞힌 사람이 아무도 없어 1등 당첨금 약 36억 원이 제2회차로 전액 이월되었습니다.',
  },
  {
    id: 'kr-03',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 진기록',
    difficulty: '보통',
    question:
      '대한민국 로또 역사상 1인당 최고 당첨금은 2003년 제19회차에서 기록된 약 ㅁㅁㅁ억 원이다.',
    options: ['195', '280', '407', '512'],
    answer: '407',
    acceptedAnswers: ['407', '407억', '407억원', '407.2'],
    funFactTitle: '전설의 제19회차 407억 2,295만 원 독식!',
    explanation:
      '2003년 4월 12일 추첨된 제19회차는 직전 18회차 이월금까지 합쳐져 단 1명의 당첨자가 407억 2,295만 9,400원을 수령하며 역대 최고 기록으로 남아 있습니다.',
  },
  {
    id: 'kr-04',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 역사',
    difficulty: '보통',
    question:
      '2002년 로또 출시 초기에는 1게임당 가격이 지금(1,000원)과 달랐습니다. 출시 당시 1게임 가격은 얼마였을까요?',
    options: ['500원', '1,500원', '2,000원', '3,000원'],
    answer: '2,000원',
    funFactTitle: '초기 로또는 한 줄에 2,000원이었다!',
    explanation:
      '출시 당시에는 1게임당 2,000원이었으나, 과열 현상을 완화하고 건전한 여가 문화를 정착시키기 위해 2004년 8월(제90회차)부터 1,000원으로 인하되었습니다.',
  },
  {
    id: 'kr-05',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '쉬움',
    question:
      '과거에는 로또 1등 당첨금이 무제한 이월될 수 있었지만, 현재는 최대 연속 ㅁ회까지만 이월되도록 법으로 제한되어 있다.',
    options: ['1', '2', '3', '5'],
    answer: '2',
    acceptedAnswers: ['2', '2회', '두번', '2번'],
    funFactTitle: '광풍을 막기 위해 도입된 1등 이월 2회 제한!',
    explanation:
      '초기 연속 이월로 인한 전국적 로또 과열을 막기 위해 이월 횟수를 최대 2회로 제한했습니다. 3회 연속 1등이 없을 경우 당첨금은 하위 등수로 배분됩니다.',
  },
  {
    id: 'kr-06',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 진기록',
    difficulty: '매니아',
    question:
      '대한민국 로또 역사상 한 회차에서 1등 당첨자가 가장 많이 쏟아져 나온 회차(제1019회)의 1등 당첨자 수는 몇 명일까요?',
    options: ['25명', '38명', '50명', '63명'],
    answer: '50명',
    funFactTitle: '한 회차에 1등만 무려 50명, 1인당 당첨금은 약 4억 3천만 원!',
    explanation:
      '2022년 6월 11일 제1019회 추첨에서는 수동 선택 당첨자만 42명이 나오면서 총 50명이 1등에 당첨되어 역대 최다 1등 배출 기록을 세웠습니다. (이후 제1128회에서는 63명이 경신하기도 했습니다!)',
  },
  {
    id: 'kr-07',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 진기록',
    difficulty: '매니아',
    question:
      '대한민국 로또 역사상 1인당 1등 당첨금이 가장 적었던 회차(제546회, 30명 당첨)의 1등 실수령 전 세전 당첨금은 약 ㅁ억 원대였다.',
    options: ['1', '4', '7', '10'],
    answer: '4',
    acceptedAnswers: ['4', '4억', '4.05'],
    funFactTitle: '1등에 당첨되고도 세전 4억 593만 원!',
    explanation:
      '2013년 제546회에서는 30명이 동시에 1등에 당첨되어 1인당 세전 약 4억 593만 원(세후 약 2억 9천만 원)을 수령했습니다.',
  },
  {
    id: 'kr-08',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 역사',
    difficulty: '보통',
    question:
      '1947년 대한민국(미군정 시기)에서 런던 올림픽 출전 경비를 마련하기 위해 발행된 우리나라 최초의 복권 이름은 무엇일까요?',
    options: ['주택복권', '올림픽후원권', '애국복권', '무궁화복권'],
    answer: '올림픽후원권',
    funFactTitle: '1948 런던 올림픽 태극전사들을 보낸 우리나라 첫 복권!',
    explanation:
      '1947년 12월 발행된 [올림픽후원권]이 대한민국 최초의 복권입니다. 액면가 100원에 1등 당첨금은 당시 서울 기와집 여러 채 값인 100만 원이었습니다.',
  },
  {
    id: 'kr-09',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 역사',
    difficulty: '보통',
    question:
      '1969년부터 무려 37년간 발행되며 로또 6/45 등장 전까지 대한민국에서 가장 사랑받았던 국민 복권은 무엇일까요?',
    options: ['체육복권', '주택복권', '기술복권', '복지복권'],
    answer: '주택복권',
    funFactTitle: '서민들의 내 집 마련 꿈을 담았던 37년 역사의 주택복권!',
    explanation:
      '1969년 9월 첫 발행된 주택복권은 무주택 서민의 주택 자금 조성을 위해 시작되어 2006년 폐지될 때까지 37년간 국민 복권으로 자리 잡았습니다.',
  },
  {
    id: 'kr-10',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '쉬움',
    question:
      '로또 당첨금의 지급 만료 기한은 지급 개시일로부터 ㅁ년이며, 찾아가지 않은 미수령 당첨금은 전액 복권기금으로 귀속된다.',
    options: ['1', '2', '3', '5'],
    answer: '1',
    acceptedAnswers: ['1', '1년', '일년'],
    funFactTitle: '매년 수백억 원의 미수령 당첨금이 공익사업으로!',
    explanation:
      '지급 개시일로부터 1년이 지나도록 찾아가지 않은 당첨금은 복권 및 복권기금법에 따라 전액 소멸되어 저소득층 주거 안정 등 공익사업에 쓰입니다.',
  },
  {
    id: 'kr-11',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '보통',
    question:
      '로또 1등에 당첨되었을 때 당첨금을 수령하러 가야 하는 유일한 은행 본점 위치는 어디일까요?',
    options: [
      '서울 중구 서대문 NH농협은행 본점',
      '서울 여의도 KB국민은행 본점',
      '서울 명동 한국은행 본점',
      '전국 모든 시중은행 지점',
    ],
    answer: '서울 중구 서대문 NH농협은행 본점',
    funFactTitle:
      '1등은 오직 서대문 NH농협은행 본점에서만, 2·3등은 전국 농협 지점에서!',
    explanation:
      '4·5등은 전국 로또 판매점에서도 바꿀 수 있고, 2·3등은 전국 NH농협은행 각 지점에서, 1등은 오직 서울 서대문역 인근 NH농협은행 본점에서만 지급합니다.',
  },
  {
    id: 'kr-12',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '보통',
    question:
      '현재 대한민국 세법상 로또 당첨금 중 3억 원을 초과하는 금액에 대해 부과되는 기타소득세율(주민세 포함)은 ㅁㅁ%이다.',
    options: ['11', '22', '33', '44'],
    answer: '33',
    acceptedAnswers: ['33', '33%'],
    funFactTitle: '3억 원 이하는 22%, 3억 원 초과분은 33% 세율 적용!',
    explanation:
      '당첨금 200만 원 이하는 비과세이며, 3억 원 이하는 22%(소득세 20%+지방소득세 2%), 3억 원 초과분에는 33%(소득세 30%+지방소득세 3%)가 원천징수됩니다.',
  },
  {
    id: 'kr-13',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '쉬움',
    question:
      '대한민국에서 로또 복권을 구매할 수 있는 법적 연령 기준은 만 ㅁㅁ세 이상이다.',
    options: ['14', '18', '19', '20'],
    answer: '19',
    acceptedAnswers: ['19', '19세', '만19세'],
    funFactTitle:
      '청소년 보호법에 따라 만 19세 미만은 구매 및 당첨금 수령 불가!',
    explanation:
      '복권 및 복권기금법에 따라 만 19세 미만 청소년은 로또를 구매할 수 없으며, 설령 당첨되더라도 당첨금을 지급받을 수 없습니다.',
  },
  {
    id: 'kr-14',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '쉬움',
    question:
      '오프라인 복권 판매점에서 1인당 1회 구매할 수 있는 로또 최대 한도 금액은 ㅁㅁ만 원이다.',
    options: ['1', '5', '10', '50'],
    answer: '10',
    acceptedAnswers: ['10', '10만', '10만원'],
    funFactTitle:
      '오프라인은 1회 10만 원, 동행복권 인터넷 구매는 회차당 5천 원!',
    explanation:
      '사행성 방지를 위해 오프라인 판매점에서는 1회 최대 10만 원(100게임)까지, 인터넷 동행복권 사이트에서는 1회차당 최대 5,000원(5게임)까지만 구매할 수 있습니다.',
  },
  {
    id: 'kr-15',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '보통',
    question:
      '매주 토요일 추첨이 있는 날, 로또 판매가 마감되는 정확한 시각은 언제일까요?',
    options: [
      '토요일 오후 6시 정각',
      '토요일 오후 8시 정각',
      '토요일 오후 8시 30분',
      '토요일 오후 9시 정각',
    ],
    answer: '토요일 오후 8시 정각',
    funFactTitle: '토요일 저녁 8시 정각에 전국의 모든 단말기가 동시 마감!',
    explanation:
      '매주 토요일 오후 8시 00분 00초에 전국의 판매 단말기와 중앙 서버의 발매가 마감되며, 이후 데이터 검증을 거쳐 저녁 8시 35분경 생방송 추첨이 진행됩니다.',
  },
  {
    id: 'kr-16',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 상식',
    difficulty: '보통',
    question:
      '내가 산 로또 복권 1,000원 중 당첨금(1~5등 전체)으로 되돌아가는 총 당첨금 배분 비율은 약 얼마일까요?',
    options: [
      '약 30% (300원)',
      '약 50% (500원)',
      '약 70% (700원)',
      '약 90% (900원)',
    ],
    answer: '약 50% (500원)',
    funFactTitle: '로또 판매액의 절반(50%)은 당첨금, 약 42%는 공익 복권기금!',
    explanation:
      '로또 총 판매액의 50%는 당첨금으로 지급되고, 약 42%는 복권기금으로 조성되어 소외계층 지원에 쓰이며, 나머지는 판매점 수수료 및 운영비로 사용됩니다.',
  },

  // =========================================================================
  // 2. 세계 로또의 기원과 놀라운 역사 (HISTORY)
  // =========================================================================
  {
    id: 'hi-01',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '보통',
    question:
      '오늘날 사용하는 단어 [로또(Lotto)]는 15~16세기 어느 나라의 상원의원 선출 추첨 제도에서 유래했을까요?',
    options: [
      '이탈리아 (제노바 공화국)',
      '프랑스 (파리 왕실)',
      '영국 (런던 의회)',
      '스페인 (마드리드)',
    ],
    answer: '이탈리아 (제노바 공화국)',
    funFactTitle: '90명의 후보 중 5명의 의원을 뽑던 제노바 선거가 로또의 시초!',
    explanation:
      '16세기 이탈리아 제노바에서는 90명의 후보 중 5명의 상원의원을 추첨으로 뽑았는데, 시민들이 누가 뽑힐지 이름을 숫자로 바꿔 내기를 한 것이 현대 로또(Lotto)의 직접적인 기원입니다.',
  },
  {
    id: 'hi-02',
    type: 'FILL_BLANK',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '보통',
    question:
      '어원학적으로 이탈리아어 [Lotto]는 행운·운명·몫을 뜻하는 프랑크어(게르만어)에서 왔으며, 영어 단어 [ㅁㅁㅁ(제비뽑기/운)]와 같은 뿌리를 공유한다.',
    options: ['Lot', 'Luck', 'Dice', 'Win'],
    answer: 'Lot',
    acceptedAnswers: ['Lot', 'lot', 'Lottery', 'lottery'],
    funFactTitle: '영어 Lot(제비/운명)과 이탈리아어 Lotto는 한 형제!',
    explanation:
      '게르만조어 *khlutom(제비, 몫)이 프랑크어를 거쳐 이탈리아어 Lotto, 프랑스어 Lot, 영어 Lot과 Lottery로 발전했습니다.',
  },
  {
    id: 'hi-03',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '보통',
    question:
      '고대 중국 한나라 시절, Keno(키노) 복권의 원형인 백합표 복권을 발행하여 건설 자금을 조달한 것으로 전해지는 거대 건축물은?',
    options: ['만리장성', '자금성', '병마용', '황하 대운하'],
    answer: '만리장성',
    funFactTitle: '만리장성 축조 자금에도 고대 복권이 쓰였다!',
    explanation:
      '기원전 200년경 한나라에서 국방 및 만리장성 보수 자금을 모으기 위해 천자문 글자를 맞추는 키노(Keno) 형태의 복권을 활용했다는 기록이 전해집니다.',
  },
  {
    id: 'hi-04',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '매니아',
    question:
      '유럽 기록상 도시의 수리 비용을 마련하기 위해 연회에서 시민들에게 복권을 판매한 최초의 고대 로마 황제는 누구일까요?',
    options: [
      '아우구스투스',
      '카이사르',
      '콘스탄티누스',
      '마르쿠스 아우렐리우스',
    ],
    answer: '아우구스투스',
    funFactTitle: '로마 제국 초대 황제 아우구스투스의 로마 재건 복권!',
    explanation:
      '초대 황제 아우구스투스는 로마 시내 보수 기금을 모으기 위해 복권을 판매했고, 네로 황제는 연회 손님들에게 노예, 집, 배를 경품으로 건 무료 복권을 나눠주곤 했습니다.',
  },
  {
    id: 'hi-05',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '매니아',
    question:
      '18세기 프랑스 국왕 루이 15세에게 "세금 저항 없이 국가 재정을 확충하는 가장 완벽한 방법은 왕립 로또입니다"라고 설득해 프랑스 국가 로또를 탄생시킨 전설적인 인물은?',
    options: [
      '자코모 카사노바',
      '나폴레옹 보나파르트',
      '루소',
      '노스트라다무스',
    ],
    answer: '자코모 카사노바',
    funFactTitle: '바람둥이로만 알려진 카사노바는 사실 수학·복권의 천재였다!',
    explanation:
      '베네치아 감옥을 탈출해 파리로 간 카사노바는 뛰어난 수학 지식으로 루이 15세와 사관학교 설립자들에게 왕립 로또를 제안해 채택되었고, 본인도 판매권을 얻어 막대한 부를 쌓았습니다.',
  },
  {
    id: 'hi-06',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '매니아',
    question:
      '1729년 프랑스 파리의 시채권 복권에서 발행 구조의 수학적 허점을 계산해 모든 복권을 사들여 떼돈을 번 프랑스의 대문호이자 철학자는?',
    options: ['볼테르 (Voltaire)', '빅토르 위고', '데카르트', '파스칼'],
    answer: '볼테르 (Voltaire)',
    funFactTitle:
      '계몽주의 철학자 볼테르, 복권의 수학적 허점을 뚫어 백만장자가 되다!',
    explanation:
      '볼테르는 수학자 라 콩다민과 함께 파리 시가 발행한 채권 복권의 총 당첨금이 복권 전체 구매 비용보다 크다는 허점을 발견해 신디케이트를 꾸려 당첨금을 싹쓸이했고, 평생 돈 걱정 없이 집필에 몰두했습니다.',
  },
  {
    id: 'hi-07',
    type: 'FILL_BLANK',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '매니아',
    question:
      '1566년 영국 역사상 최초의 공식 국가 복권을 승인하여 항구 보수 자금을 모은 여왕은 [ㅁㅁㅁㅁ 1세] 여왕이다.',
    options: ['엘리자베스', '빅토리아', '메리', '앤'],
    answer: '엘리자베스',
    acceptedAnswers: ['엘리자베스', '엘리자베스 1세', '엘리자베스1세'],
    funFactTitle: '꽝이 없었던 엘리자베스 1세의 영국 최초 국가 복권!',
    explanation:
      '엘리자베스 1세는 1566년 항구와 국방 시설 보수를 위해 총 40만 장의 복권을 발행했으며, 구매자에게 체포 면책 특권까지 부여할 정도로 파격적이었습니다.',
  },
  {
    id: 'hi-08',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '보통',
    question:
      '미국 건국 초기, 다음 중 실제로 복권(Lottery) 발행 수익금을 통해 설립·건축 기금을 조달했던 미국의 명문 대학교들은 어디일까요?',
    options: [
      '하버드, 예일, 프린스턴, 컬럼비아 대학 모두',
      '하버드 대학 한 곳뿐',
      '미국에서는 대학 설립에 복권을 쓴 적이 없다',
      '20세기 이후 주립대학들만',
    ],
    answer: '하버드, 예일, 프린스턴, 컬럼비아 대학 모두',
    funFactTitle: '아이비리그 명문대 기숙사와 도서관을 지은 것도 복권 수익금!',
    explanation:
      '18세기 미국 식민지 시절에는 은행과 세금 시스템이 부족해 하버드, 예일, 프린스턴, 컬럼비아 등 아이비리그 대학들이 모두 공식 복권을 발행해 건물을 지었습니다.',
  },
  {
    id: 'hi-09',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '매니아',
    question:
      '2022년 미국 파워볼(Powerball)에서 단일 티켓 1장으로 터진 세계 기네스북 역대 최고 복권 당첨금은 한화로 약 얼마 수준일까요?',
    options: [
      '약 20억 달러 (한화 약 2조 8,000억 원)',
      '약 1억 달러 (한화 약 1,400억 원)',
      '약 5억 달러 (한화 약 7,000억 원)',
      '약 100억 달러 (한화 약 14조 원)',
    ],
    answer: '약 20억 달러 (한화 약 2조 8,000억 원)',
    funFactTitle: '1등 한 명에게 무려 20억 4천만 달러(약 2조 8천억 원)!',
    explanation:
      '2022년 11월 미국 캘리포니아주에서 판매된 파워볼 복권 1장이 20억 4,000만 달러에 당첨되며 전 세계 복권 역사상 단일 당첨금 최고 기록을 세웠습니다.',
  },
  {
    id: 'hi-10',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 문화',
    difficulty: '보통',
    question:
      '1812년부터 매년 12월 22일 크리스마스에 열리며, 총 당첨금 규모만 3조 원이 넘어 온 마을이 번호를 나눠 사는 것으로 유명한 스페인의 전통 복권 이름은?',
    options: [
      '엘 고르도 (El Gordo)',
      '메가 밀리언',
      '유로 밀리언',
      '라 프리미티바',
    ],
    answer: '엘 고르도 (El Gordo)',
    funFactTitle:
      '스페인어로 "뚱보(El Gordo)"라 불리는 세계 최대 총상금 크리스마스 복권!',
    explanation:
      '스페인의 성탄절 복권 엘 고르도는 한 사람에게 몰아주기보다 티켓을 10분의 1(데시모)로 쪼개 마을 주민이나 직장 동료들이 함께 당첨의 기쁨을 나누는 축제 문화로 유명합니다.',
  },
  {
    id: 'hi-11',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 문화',
    difficulty: '보통',
    question:
      '대만(타이완)에서 탈세를 막고 세수를 늘리기 위해 모든 상점의 "이것"에 8자리 복권 번호를 인쇄해 두 달마다 추첨하는 독특한 제도는 무엇일까요?',
    options: [
      '영수증 (통일발표)',
      '버스 승차권',
      '전기요금 고지서',
      '신분증 번호',
    ],
    answer: '영수증 (통일발표)',
    funFactTitle: '편의점 껌 한 통 영수증이 최고 4억 원짜리 복권이 되는 대만!',
    explanation:
      '대만은 1951년부터 영수증 복권(통일발표) 제도를 도입해 시민들이 자발적으로 영수증을 챙기게 함으로써 상점의 매출 누락을 막고 세수를 획기적으로 늘렸습니다.',
  },
  {
    id: 'hi-12',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 역사',
    difficulty: '매니아',
    question:
      '1992년 루마니아 출신 경제학자 스테판 만델(Stefan Mandel)은 어떤 방법으로 복권 1등에 무려 14번이나 합법적으로 당첨되었을까요?',
    options: [
      '이월 당첨금이 전체 조합 비용의 3배를 넘을 때 모든 조합을 인쇄해 구매',
      '추첨기 제조사의 알고리즘을 해킹',
      '역대 최다 출현 번호만 20년간 반복 구매',
      '방송국 시계를 조작',
    ],
    answer:
      '이월 당첨금이 전체 조합 비용의 3배를 넘을 때 모든 조합을 인쇄해 구매',
    funFactTitle: '모든 번호 조합을 통째로 사버린 수학자의 합법적 잭팟!',
    explanation:
      '스테판 만델은 투자자 펀드를 모아 당첨금이 모든 경우의 수 구매 비용보다 훨씬 커진 주(버지니아주 등)의 복권 700만 장을 컴퓨터로 인쇄해 사들여 1~5등을 싹쓸이했습니다. 이 사건 이후 전 세계 복권에 집에서 인쇄한 용지 사용 금지 규정이 생겼습니다.',
  },
  {
    id: 'hi-13',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 진기록',
    difficulty: '보통',
    question:
      '2005년 미국 파워볼 추첨에서 무려 110명이 동시에 2등에 당첨되어 복권국이 사기 사건을 의심해 조사에 나섰으나, 알고 보니 당첨자 전원이 "이것"에서 나온 번호를 적었던 해프닝이 있었습니다. 무엇이었을까요?',
    options: [
      '중국집 포춘쿠키(Fortune Cookie) 속 행운의 숫자 종이',
      '전날 방영된 심슨 가족 만화의 번호',
      '대통령의 생년월일',
      '유명 신문의 오타 번호',
    ],
    answer: '중국집 포춘쿠키(Fortune Cookie) 속 행운의 숫자 종이',
    funFactTitle: '포춘쿠키 공장에서 대량 인쇄된 행운 번호가 실제로 터졌다!',
    explanation:
      '뉴욕의 한 포춘쿠키 공장에서 납품한 쿠키 속 행운 번호(22, 28, 32, 33, 39)가 실제 당첨번호와 일치하면서 미국 전역의 중국집 손님 110명이 동시에 당첨되는 진풍경이 벌어졌습니다.',
  },
  {
    id: 'hi-14',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 진기록',
    difficulty: '보통',
    question:
      '2009년 불가리아 국영 로또(6/49)에서는 수학적으로 400만 분의 1 확률인 기적 같은 일이 벌어져 정부 조사까지 진행되었습니다. 어떤 일이었을까요?',
    options: [
      '직전 회차(9월 6일)에 나온 6개 당첨번호가 다음 회차(9월 10일)에 토씨 하나 안 틀리고 또 나왔다',
      '1, 2, 3, 4, 5, 6 연속 번호가 나왔다',
      '추첨기 안에서 공 6개가 동시에 터졌다',
      '당첨자 100명의 이름이 모두 같았다',
    ],
    answer:
      '직전 회차(9월 6일)에 나온 6개 당첨번호가 다음 회차(9월 10일)에 토씨 하나 안 틀리고 또 나왔다',
    funFactTitle: '4, 15, 23, 24, 35, 42가 4일 만에 또 나온 불가리아 로또!',
    explanation:
      '9월 6일에는 1등이 없었는데, 나흘 뒤 9월 10일에 똑같은 6개 번호가 또 추첨되면서 이번엔 무려 18명이 1등에 당첨되었습니다. 조사 결과 조작이 아닌 순수 확률의 기적으로 밝혀졌습니다.',
  },
  {
    id: 'hi-15',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 진기록',
    difficulty: '보통',
    question:
      '2020년 남아프리카공화국 파워볼 추첨에서 실제로 당첨번호로 뽑혀 전 세계 뉴스에 보도된 놀라운 번호 조합은 무엇이었을까요?',
    options: [
      '5, 6, 7, 8, 9 그리고 파워볼 10 (완벽한 6연속 숫자)',
      '10, 20, 30, 40, 50, 60',
      '7, 7, 7, 7, 7, 7',
      '1, 11, 21, 31, 41, 51',
    ],
    answer: '5, 6, 7, 8, 9 그리고 파워볼 10 (완벽한 6연속 숫자)',
    funFactTitle: '5, 6, 7, 8, 9, 10! 연속 번호를 찍은 20명이 실제로 1등 당첨!',
    explanation:
      '2020년 12월 1일 남아공 파워볼에서 5, 6, 7, 8, 9와 보너스 10이 실제로 추첨되었고, 놀랍게도 이 연속 번호를 구매한 20명이 1등 당첨금을 나눠 가졌습니다.',
  },
  {
    id: 'hi-16',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 진기록',
    difficulty: '보통',
    question:
      '1999년 호주의 빌 모건(Bill Morgan) 씨는 심장마비로 14분간 임상적 사망 상태였다가 기적적으로 깨어난 것을 기념해 즉석복권을 샀다가 당첨되었습니다. 이후 방송국에서 "당첨 순간을 재연해 달라"며 카메라 앞에서 긁은 복권에서 또 어떤 일이 벌어졌을까요?',
    options: [
      '카메라 생중계 중에 25만 달러(약 3억 원) 최고 당첨금이 또 터졌다',
      '복권이 바람에 날아가 버렸다',
      '오타가 인쇄된 불량 복권이 나왔다',
      '방송국 PD가 당첨되었다',
    ],
    answer: '카메라 생중계 중에 25만 달러(약 3억 원) 최고 당첨금이 또 터졌다',
    funFactTitle:
      '당첨 재연 촬영 중에 진짜 1등이 또 터진 세계에서 가장 운 좋은 사나이!',
    explanation:
      '뉴스 리포터가 "그때처럼 한 번 긁어보세요"라고 부탁해 카메라 앞에서 실제로 복권을 긁었는데, 그 자리에서 25만 호주달러 1등에 또 당첨되는 장면이 고스란히 녹화되었습니다.',
  },

  // =========================================================================
  // 3. 추첨기 과학, 로또 볼의 비밀 & 색상 규칙 (SCIENCE_RULE)
  // =========================================================================
  {
    id: 'sc-01',
    type: 'FILL_BLANK',
    category: 'SCIENCE_RULE',
    categoryLabel: '추첨기 과학',
    difficulty: '보통',
    question:
      '대한민국 로또 6/45 추첨 방송에서 사용하고 있는 프랑스 아카니스(Akanis)사의 공기 혼합 방식 추첨기 모델 이름은 [ㅁㅁㅁ(Venus)]이다.',
    options: ['비너스', '아폴로', '할로겐', '매그넘'],
    answer: '비너스',
    acceptedAnswers: ['비너스', 'Venus', 'venus', '비너스추첨기'],
    funFactTitle: '강력한 공기 제트로 공을 섞는 프랑스제 비너스(Venus) 추첨기!',
    explanation:
      '초기에는 독일제 할로겐 추첨기를 사용하다가 현재는 프랑스 아카니스 테크놀로지사의 비너스(Venus) 추첨기 3대(본 추첨용 1대, 예비용 2대)를 사용하고 있습니다.',
  },
  {
    id: 'sc-02',
    type: 'FILL_BLANK',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 볼의 비밀',
    difficulty: '보통',
    question:
      '로또 6/45 추첨에 사용되는 공 1개의 지름은 45mm이며, 무게는 탁구공(2.7g)보다 조금 더 무거운 약 ㅁg이다.',
    options: ['2', '4', '10', '25'],
    answer: '4',
    acceptedAnswers: ['4', '4g', '4그램'],
    funFactTitle: '지름 45mm, 무게 4g, 허용 오차는 불과 ±0.05g 이내!',
    explanation:
      '추첨의 공정성을 위해 모든 공은 지름 45mm, 무게 4g의 발포 폴리우레탄 재질로 제작되며, 매주 방송 전 경찰관과 참관인 입회하에 전자저울로 무게와 크기를 정밀 측정합니다.',
  },
  {
    id: 'sc-03',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 볼의 비밀',
    difficulty: '보통',
    question:
      '로또 추첨 볼은 부딪혀도 깨지지 않고 탄성과 무게가 균일해야 합니다. 로또 추첨 볼의 주된 소재는 무엇일까요?',
    options: [
      '발포 폴리우레탄 (고밀도 스펀지 수지)',
      '강화 유리',
      '천연 나무',
      '알루미늄 합금',
    ],
    answer: '발포 폴리우레탄 (고밀도 스펀지 수지)',
    funFactTitle: '속이 빈 플라스틱이 아니라 속이 꽉 찬 발포 폴리우레탄!',
    explanation:
      '과거 할로겐 추첨기는 속이 빈 고무공을 썼으나, 비너스 추첨기는 속이 꽉 찬 발포 폴리우레탄 공을 사용해 장시간 부딪혀도 찌그러지거나 무게 중심이 변하지 않습니다.',
  },
  {
    id: 'sc-04',
    type: 'FILL_BLANK',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 볼의 비밀',
    difficulty: '매니아',
    question:
      '로또 추첨 볼 정중앙 내부에는 외부에서 보이지 않지만 위·변조 방지와 번호 자동 인식을 위해 초소형 전자칩인 [ㅁㅁㅁㅁ] 태그가 내장되어 있다.',
    options: ['RFID', 'GPS', 'WIFI', 'LED'],
    answer: 'RFID',
    acceptedAnswers: ['RFID', 'rfid'],
    funFactTitle: '공 한가운데 숨겨진 RFID 무선 인식 칩!',
    explanation:
      '공을 만들 때 정중앙에 극소형 RFID 칩을 넣어 성형합니다. 추첨 전 전용 리더기로 1번부터 45번까지 고유 암호 코드를 대조해 외부인이 공을 바꿔치기하는 것을 원천 봉쇄합니다.',
  },
  {
    id: 'sc-05',
    type: 'FILL_BLANK',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 볼의 비밀',
    difficulty: '보통',
    question:
      '생방송 추첨 직전, 경찰관과 방청객이 직접 추첨에 사용할 볼 세트를 고르기 위해 준비되어 있는 로또 볼 가방은 총 ㅁ세트이다.',
    options: ['1', '3', '5', '10'],
    answer: '5',
    acceptedAnswers: ['5', '5세트', '다섯'],
    funFactTitle:
      '봉인된 5개의 볼 세트 가방 중 현장에서 무작위로 추첨용/예비용 선택!',
    explanation:
      '매주 추첨 방송 전 엄격히 봉인·검수된 5세트의 볼 가방 중 방청객이 현장에서 직접 1세트를 추첨용으로, 1세트를 예비용으로 무작위 선정합니다.',
  },
  {
    id: 'sc-06',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 색상 규칙',
    difficulty: '쉬움',
    question:
      '대한민국 로또 6/45에서 1번부터 10번까지의 공은 어떤 색상으로 칠해져 있을까요?',
    options: [
      '노란색 (Yellow)',
      '파란색 (Blue)',
      '빨간색 (Red)',
      '초록색 (Green)',
    ],
    answer: '노란색 (Yellow)',
    funFactTitle: '1~10번은 행운의 노란색 볼!',
    explanation:
      '한국 로또 볼 색상은 1~10번 노란색, 11~20번 파란색, 21~30번 빨간색, 31~40번 회색(검정), 41~45번 초록색의 5개 구간으로 나뉩니다.',
  },
  {
    id: 'sc-07',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 색상 규칙',
    difficulty: '쉬움',
    question:
      '대한민국 로또 6/45에서 11번부터 20번까지의 공은 어떤 색상일까요?',
    options: [
      '파란색 (Blue)',
      '노란색 (Yellow)',
      '빨간색 (Red)',
      '회색 (Gray)',
    ],
    answer: '파란색 (Blue)',
    funFactTitle: '11~20번 구간은 시원한 파란색 볼!',
    explanation:
      '시청자가 TV 화면에서 공이 나오는 순간 번호 대역을 직관적으로 알아볼 수 있도록 10단위마다 서로 다른 보색 계열 색상을 배정했습니다.',
  },
  {
    id: 'sc-08',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 색상 규칙',
    difficulty: '쉬움',
    question:
      '대한민국 로또 6/45에서 다른 색상 구간은 모두 10개씩의 번호를 가지지만, 유일하게 5개의 번호(41~45번)만 속해 있는 볼의 색상은?',
    options: [
      '초록색 (Green)',
      '보라색 (Purple)',
      '주황색 (Orange)',
      '노란색 (Yellow)',
    ],
    answer: '초록색 (Green)',
    funFactTitle: '41~45번 단 5개만 존재하는 희귀한 초록색 볼!',
    explanation:
      '41번부터 45번까지는 단 5개뿐인 초록색 구간입니다. 따라서 한 회차에서 초록색 공이 3개 이상 동시에 나오는 경우는 확률적으로 매우 드뭅니다.',
  },
  {
    id: 'sc-09',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 볼의 비밀',
    difficulty: '보통',
    question:
      '로또 공이 회전할 때 6번과 9번을 헷갈리지 않도록 숫자 아래에 밑줄이 그어져 있습니다. 그런데 공 한 개에는 같은 숫자가 총 몇 군데에 인쇄되어 있을까요?',
    options: ['2군데', '6군데', '12군데', '24군데'],
    answer: '12군데',
    funFactTitle: '카메라가 어느 각도에서 찍어도 숫자가 보이도록 12면에 인쇄!',
    explanation:
      '공이 트레이에 멈췄을 때 어느 방향을 향하든 방송 카메라와 참관인이 즉시 숫자를 읽을 수 있도록 구면의 12군데에 숫자가 정밀 인쇄되어 있습니다.',
  },
  {
    id: 'sc-10',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 용지의 비밀',
    difficulty: '보통',
    question:
      '로또 영수증(감열지)을 지갑 속에 오래 두거나 다리미·라이터 열을 가하면 글씨가 까맣게 변합니다. 그 이유는 무엇일까요?',
    options: [
      '잉크로 인쇄하는 것이 아니라 열에 반응하는 화학 코팅 용지(감열지)이기 때문',
      '위조 방지용 자외선 잉크가 녹기 때문',
      '종이 속에 자석 가루가 들어 있기 때문',
      '공기 중의 산소와 반응하기 때문',
    ],
    answer:
      '잉크로 인쇄하는 것이 아니라 열에 반응하는 화학 코팅 용지(감열지)이기 때문',
    funFactTitle: '로또 단말기에는 잉크가 없다! 열로 글씨를 새기는 감열지!',
    explanation:
      '빠른 인쇄와 고장 방지를 위해 열에 반응하는 감열지를 사용합니다. 따라서 당첨 티켓을 코팅기(열 코팅)에 넣으면 영수증 전체가 새까맣게 타버리니 절대 주의해야 합니다!',
  },
  {
    id: 'sc-11',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '추첨기 과학',
    difficulty: '매니아',
    question:
      '비너스 추첨기 상단의 추출구에서 송풍구 공기가 빠르게 흐르면서 압력이 낮아져 공이 위로 빨려 올라가는 유체역학 원리는 무엇일까요?',
    options: [
      '베르누이 정리 및 벤투리 효과 (Venturi Effect)',
      '아르키메데스의 부력 원리',
      '도플러 효과',
      '파스칼의 원리',
    ],
    answer: '베르누이 정리 및 벤투리 효과 (Venturi Effect)',
    funFactTitle: 'Hactto 3D 추첨기에도 구현된 벤투리(Venturi) 공기역학 원리!',
    explanation:
      '유체의 속력이 빨라지면 압력이 낮아진다는 베르누이 정리(벤투리 효과)에 의해 추출관 입구의 기압 차가 발생하면서 4g짜리 로또 볼이 추출 트랩으로 포획됩니다.',
  },
  {
    id: 'sc-12',
    type: 'FILL_BLANK',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 슬립 규칙',
    difficulty: '쉬움',
    question:
      '로또 판매점에 비치된 OMR 마킹 용지(슬립) 1장에는 A부터 E까지 최대 ㅁ게임을 동시에 마킹할 수 있다.',
    options: ['3', '5', '6', '10'],
    answer: '5',
    acceptedAnswers: ['5', '5게임', '다섯'],
    funFactTitle: 'A, B, C, D, E 총 5게임(5,000원)이 한 장의 슬립!',
    explanation:
      '로또 슬립지 한 장은 A~E의 5개 게임 구역으로 구성되어 있으며, 수동·자동·반자동(일부만 마킹 후 자동 선택)을 자유롭게 섞어서 구매할 수 있습니다.',
  },
  {
    id: 'sc-13',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 규정',
    difficulty: '쉬움',
    question:
      '내가 마킹한 번호 중 일부(예: 2~3개)만 직접 고르고, 나머지 번호는 단말기 컴퓨터가 무작위로 채워주도록 구매하는 방식을 무엇이라고 할까요?',
    options: ['반자동', '수동', '완전자동', '이월선택'],
    answer: '반자동',
    funFactTitle: '내가 좋아하는 고정수 + 컴퓨터의 행운을 합치는 반자동!',
    explanation:
      '6개 미만의 번호를 마킹한 뒤 [자동선택] 칸에 함께 마킹하면, 내가 고른 번호는 고정하고 부족한 개수만 단말기가 난수로 채워주는 반자동 방식으로 발권됩니다.',
  },
  {
    id: 'sc-14',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '추첨기 역사',
    difficulty: '매니아',
    question:
      '한국 로또 초기(제1회~제261회)에 사용되었던 독일제 투명 아크릴 구형 추첨기로, 두 개의 회전 날개가 공을 물리적으로 섞어주던 추첨기 이름은?',
    options: [
      '할로겐 (Halogen)',
      '비너스 (Venus)',
      '토네이도 (Tornado)',
      '쥬피터 (Jupiter)',
    ],
    answer: '할로겐 (Halogen)',
    funFactTitle: '초기 로또의 상징이었던 독일 핀란(WinTV)사의 할로겐 추첨기!',
    explanation:
      '1기 로또 시절에는 회전 막대가 공을 섞고 아래쪽으로 공이 떨어지는 할로겐 추첨기를 사용했으며, 2기(제262회)부터 공기 혼합식 비너스 추첨기로 교체되었습니다.',
  },
  {
    id: 'sc-15',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '당첨 확인 과학',
    difficulty: '쉬움',
    question:
      '로또 용지 우측 상단에 인쇄된 정사각형 모양의 격자 바코드로, 스마트폰 카메라로 비추면 즉시 당첨 여부를 확인할 수 있는 코드는?',
    options: ['QR 코드', 'RFID 태그', '모스 부호', '홀로그램 스티커'],
    answer: 'QR 코드',
    funFactTitle: '회차, 구매 번호, 고유 검증 번호가 담긴 QR 코드!',
    explanation:
      '용지 상단의 QR 코드에는 회차와 구매 조합 정보가 담겨 있어 일일이 번호를 대조하지 않아도 1초 만에 당첨 등수를 확인할 수 있습니다.',
  },
  {
    id: 'sc-16',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '사기 방지 역사',
    difficulty: '매니아',
    question:
      '1980년 미국 펜실베이니아 복권 추첨 조작 사건(The Triple Six Fix)에서 범인들이 특정 숫자(4와 6)만 위로 떠오르게 하기 위해 다른 모든 공에 몰래 주입한 물질은?',
    options: ['흰색 라텍스 페인트 (주사기로 주입)', '수은', '철가루', '설탕물'],
    answer: '흰색 라텍스 페인트 (주사기로 주입)',
    funFactTitle: '주사기로 흰 페인트를 넣어 공을 무겁게 만든 희대의 사건!',
    explanation:
      '방송 진행자 닉 페리 일당이 4번과 6번을 제외한 공에 흰색 페인트를 주입해 무겁게 만들어 6-6-6이 뽑히게 조작했다가 발각되었습니다. 이 사건 이후 전 세계 모든 복권 추첨에서 방송 직전 전자저울 정밀 계량이 의무화되었습니다.',
  },

  // =========================================================================
  // 4. 로또 수학, 확률 & 통계의 재미있는 비밀 (MATH_FUN)
  // =========================================================================
  {
    id: 'ma-01',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '보통',
    question:
      '45개의 숫자 중 순서와 상관없이 6개의 숫자를 고르는 로또 6/45의 전체 조합 경우의 수는 총 [ㅁ,145,060]가지이다.',
    options: ['4', '6', '8', '10'],
    answer: '8',
    acceptedAnswers: ['8', '8,145,060', '8145060'],
    funFactTitle: '45C6 = 8,145,060가지! 약 814만 분의 1의 확률!',
    explanation:
      '(45 × 44 × 43 × 42 × 41 × 40) ÷ (6 × 5 × 4 × 3 × 2 × 1) = 8,145,060가지입니다. 모든 조합을 1,000원씩 다 사려면 81억 4,506만 원이 필요합니다.',
  },
  {
    id: 'ma-02',
    type: 'MULTIPLE_CHOICE',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '쉬움',
    question:
      '로또 6/45에서 2등에 당첨되기 위한 정확한 번호 일치 조건은 무엇일까요?',
    options: [
      '1등 당첨번호 6개 중 5개 일치 + 보너스 볼 1개 일치',
      '1등 당첨번호 6개 중 5개만 일치',
      '1등 당첨번호 6개 중 4개 일치 + 보너스 볼 1개 일치',
      '보너스 볼을 포함해 아무거나 6개 일치',
    ],
    answer: '1등 당첨번호 6개 중 5개 일치 + 보너스 볼 1개 일치',
    funFactTitle: '보너스 볼은 오직 2등과 3등을 가리기 위해서만 존재한다!',
    explanation:
      '본 번호 5개를 맞혔을 때 나머지 1개가 보너스 볼과 일치하면 2등(확률 1/1,357,510), 일치하지 않으면 3등(확률 1/35,724)이 됩니다. 4등이나 5등 판정에는 보너스 볼이 적용되지 않습니다.',
  },
  {
    id: 'ma-03',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '쉬움',
    question:
      '로또 6/45에서 고정 당첨금 5,000원을 받는 5등에 당첨되려면 본 번호 6개 중 ㅁ개가 일치해야 한다.',
    options: ['2', '3', '4', '5'],
    answer: '3',
    acceptedAnswers: ['3', '3개', '세개'],
    funFactTitle: '본 번호 3개 일치 시 5등(5,000원), 확률은 약 45분의 1!',
    explanation:
      '본 번호 3개가 일치하면 5등(5,000원, 확률 1/45), 4개가 일치하면 4등(50,000원, 확률 1/733)의 고정 당첨금을 받습니다.',
  },
  {
    id: 'ma-04',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '보통',
    question:
      '1부터 45까지의 모든 자연수를 전부 더하면 총합은 ㅁㅁㅁㅁ이 된다.',
    options: ['990', '1035', '1080', '1125'],
    answer: '1035',
    acceptedAnswers: ['1035', '1,035'],
    funFactTitle: '가우스의 덧셈 공식: 45 × 46 ÷ 2 = 1,035!',
    explanation:
      '1부터 45까지의 합은 1,035이며, 공 1개의 평균값은 23입니다. 따라서 공 6개를 뽑았을 때 이론적인 평균 총합은 23 × 6 = 138이 됩니다!',
  },
  {
    id: 'ma-05',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '보통',
    question:
      '로또 번호 6개의 합계(총합)가 가질 수 있는 이론상 최솟값(1+2+3+4+5+6)은 21이고, 최댓값(40+41+42+43+44+45)은 ㅁㅁㅁ이다.',
    options: ['240', '255', '265', '270'],
    answer: '255',
    acceptedAnswers: ['255'],
    funFactTitle: '최소 합계 21과 최대 합계 255의 정중앙이 바로 평균 합계 138!',
    explanation:
      '(21 + 255) ÷ 2 = 138입니다. 실제 역대 로또 당첨번호에서도 총합이 100~175 사이에 분포하는 경우가 전체의 약 70% 이상을 차지합니다.',
  },
  {
    id: 'ma-06',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '보통',
    question:
      '1부터 45까지의 숫자 중 홀수는 23개, 짝수는 ㅁㅁ개로 홀수가 짝수보다 1개 더 많다.',
    options: ['21', '22', '23', '24'],
    answer: '22',
    acceptedAnswers: ['22', '22개'],
    funFactTitle:
      '홀수 23개 vs 짝수 22개! 그래서 홀짝 3:3과 4:2가 가장 흔하다!',
    explanation:
      '1로 시작해 45(홀수)로 끝나기 때문에 홀수가 23개, 짝수가 22개입니다. 이 때문에 6개를 뽑을 때 홀수 3개:짝수 3개 조합이 약 33%로 가장 높은 비중을 차지합니다.',
  },
  {
    id: 'ma-07',
    type: 'MULTIPLE_CHOICE',
    category: 'MATH_FUN',
    categoryLabel: '로또 통계 분석',
    difficulty: '보통',
    question:
      'Hactto의 당첨통계 차트에서도 다루는 [AC값(Arithmetic Complexity, 산술적 복잡도)]이 10으로 만점이 나왔다는 것은 어떤 의미일까요?',
    options: [
      '6개 번호 사이의 모든 두 수의 차이값(총 15쌍)이 단 하나도 겹치지 않고 모두 다르다',
      '6개 번호가 모두 연속된 숫자(예: 1, 2, 3, 4, 5, 6)이다',
      '6개 번호가 모두 소수(Prime Number)이다',
      '6개 번호의 합계가 정확히 100이다',
    ],
    answer:
      '6개 번호 사이의 모든 두 수의 차이값(총 15쌍)이 단 하나도 겹치지 않고 모두 다르다',
    funFactTitle: '번호 간격이 얼마나 불규칙하게 퍼져 있는지를 나타내는 AC값!',
    explanation:
      '6개 번호에서 두 수의 차이는 최대 15가지가 나오며, AC값 = (서로 다른 차이값의 개수) - 5로 계산됩니다. 등차수열(1,2,3,4,5,6)이면 AC값은 0이고, 간격이 모두 다르면 최고점인 10이 됩니다.',
  },
  {
    id: 'ma-08',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '매니아',
    question:
      '1부터 45까지의 자연수 중 1과 자기 자신만으로 나누어떨어지는 [소수(Prime Number)]는 총 ㅁㅁ개이다.',
    options: ['11', '12', '14', '16'],
    answer: '14',
    acceptedAnswers: ['14', '14개'],
    funFactTitle:
      '2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43 총 14개의 소수!',
    explanation:
      '참고로 숫자 1은 소수도 합성수도 아닌 단위수입니다. 45개 중 소수가 14개(약 31%)이므로 한 회차 당첨번호 6개에는 평균적으로 1~3개의 소수가 포함됩니다.',
  },
  {
    id: 'ma-09',
    type: 'MULTIPLE_CHOICE',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '보통',
    question:
      '수학적 확률로 볼 때, [1, 2, 3, 4, 5, 6]이 1등으로 뽑힐 확률과 [3, 14, 22, 29, 38, 44]가 1등으로 뽑힐 확률을 비교하면 어떨까요?',
    options: [
      '두 조합이 뽑힐 확률은 8,145,060분의 1로 정확히 똑같다',
      '[3, 14, 22, 29, 38, 44]가 뽑힐 확률이 100배 이상 높다',
      '[1, 2, 3, 4, 5, 6]은 기계 구조상 절대 뽑힐 수 없다',
      '짝수가 많은 쪽이 확률이 더 높다',
    ],
    answer: '두 조합이 뽑힐 확률은 8,145,060분의 1로 정확히 똑같다',
    funFactTitle:
      '확률은 똑같지만, 만약 1-2-3-4-5-6이 나오면 당첨자가 너무 많아진다!',
    explanation:
      '개별 조합이 뽑힐 확률은 모두 1/8,145,060로 동일합니다. 다만 매주 [1, 2, 3, 4, 5, 6]을 수동으로 마킹하는 사람이 전국에 약 1만 명에 달해 실제로 당첨되면 1등 당첨금이 몇십만 원으로 줄어듭니다!',
  },
  {
    id: 'ma-10',
    type: 'MULTIPLE_CHOICE',
    category: 'MATH_FUN',
    categoryLabel: '확률 심리학',
    difficulty: '보통',
    question:
      '"지난 15주 동안 7번 볼이 한 번도 안 나왔으니 이번 주에는 7번이 나올 확률이 훨씬 높아졌어!"라고 믿는 심리적 오류를 통계학에서 무엇이라고 부를까요?',
    options: [
      '도박사의 오류 (Gambler’s Fallacy)',
      '생존자 편향 (Survivorship Bias)',
      '나비 효과 (Butterfly Effect)',
      '플라시보 효과 (Placebo Effect)',
    ],
    answer: '도박사의 오류 (Gambler’s Fallacy)',
    funFactTitle: '로또 공에는 기억력이 없다! 매 회차는 독립 시행!',
    explanation:
      '독립 시행에서 과거의 결과가 미래의 단일 시행 확률에 영향을 준다고 착각하는 것을 도박사의 오류라고 합니다. 다만 장기 시행 횟수가 늘어날수록 전체 출현 비율이 이론적 확률에 수렴하는 것은 [큰 수의 법칙]입니다.',
  },
  {
    id: 'ma-11',
    type: 'MULTIPLE_CHOICE',
    category: 'MATH_FUN',
    categoryLabel: '로또 통계 분석',
    difficulty: '쉬움',
    question:
      '로또 분석에서 최근 5~10회차 동안 자주 출현한 번호를 [핫 넘버(온수)]라고 부릅니다. 반대로 오랫동안 출현하지 않은 장기 미출현 번호를 무엇이라고 부를까요?',
    options: [
      '콜드 넘버 (냉수 / Cold Number)',
      '다크 넘버 (Dark Number)',
      '고스트 넘버 (Ghost Number)',
      '제로 넘버 (Zero Number)',
    ],
    answer: '콜드 넘버 (냉수 / Cold Number)',
    funFactTitle: '뜨거운 핫 넘버(온수) vs 차가운 콜드 넘버(냉수)!',
    explanation:
      'Hactto의 번호 온도 분석에서도 최근 출현 빈도에 따라 번호의 온도를 시각화해 핫 넘버와 콜드 넘버의 조화로운 배합을 돕고 있습니다.',
  },
  {
    id: 'ma-12',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 통계 분석',
    difficulty: '쉬움',
    question:
      '1부터 45까지의 로또 번호를 절반(22.5) 기준으로 나눌 때, 1~22번을 [저(Low) 구간], 23~45번을 [ㅁ(High) 구간]이라고 부른다.',
    options: ['고', '상', '대', '중'],
    answer: '고',
    acceptedAnswers: ['고', '고구간', 'High', 'high'],
    funFactTitle: '홀짝 비율만큼 중요한 고저(High-Low) 밸런스!',
    explanation:
      '생일(1~31일) 위주로 번호를 고르는 사람들은 저(Low) 구간 번호만 편식하는 경향이 있어, 고(High) 구간(23~45번) 번호가 많이 섞일수록 1등 당첨 시 독식 확률이 높아집니다.',
  },
  {
    id: 'ma-13',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 통계 분석',
    difficulty: '보통',
    question:
      '당첨번호 6개 중에서 14와 15처럼 바로 이웃한 숫자가 나란히 등장하는 번호 쌍을 로또 분석 용어로 [ㅁㅁ수]라고 부른다.',
    options: ['연속', '동끝', '이월', '대칭'],
    answer: '연속',
    acceptedAnswers: ['연속', '연속수', '연번'],
    funFactTitle:
      '사람들은 연속수를 피하지만, 실제 당첨번호의 절반 이상에는 연속수가 포함된다!',
    explanation:
      '놀랍게도 45개 중 6개를 무작위로 뽑을 때 연속된 두 수가 최소 한 쌍 이상 포함될 수학적 확률은 약 52.4%로, 연속수가 아예 없는 경우(47.6%)보다 오히려 더 높습니다!',
  },
  {
    id: 'ma-14',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 통계 분석',
    difficulty: '보통',
    question:
      '당첨번호 중 3, 13, 23처럼 일의 자리(끝자리) 숫자가 같은 번호들을 로또 분석 용어로 [ㅁㅁ수]라고 부른다.',
    options: ['동끝', '이월', '소수', '이웃'],
    answer: '동끝',
    acceptedAnswers: ['동끝', '동끝수', '끝수'],
    funFactTitle: '끝자리가 같은 동끝수(Same Last Digit)의 높은 출현율!',
    explanation:
      '비둘기집의 원리와 확률 분포에 의해 6개의 공을 뽑을 때 일의 자리가 같은 동끝수가 1쌍 이상 등장할 확률은 약 84.8%에 달합니다.',
  },
  {
    id: 'ma-15',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 통계 분석',
    difficulty: '보통',
    question:
      '바로 직전 회차에 나왔던 1등 당첨번호 중 일부가 이번 회차에 또다시 연속해서 출현하는 번호를 [ㅁㅁ수(Carryover Number)]라고 한다.',
    options: ['이월', '복귀', '쌍둥이', '반전'],
    answer: '이월',
    acceptedAnswers: ['이월', '이월수'],
    funFactTitle: '지난주에 나온 번호가 이번 주에 또 나올 확률은 무려 약 60%!',
    explanation:
      '지난주 당첨번호 6개 중 최소 1개 이상이 이번 주 당첨번호 6개에 다시 포함(이월수)될 수학적 확률은 약 59.8%로, 10번 중 6번꼴로 이월수가 등장합니다.',
  },
  {
    id: 'ma-16',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '보통',
    question:
      '1부터 45까지의 숫자 중 3의 배수(3, 6, 9 ... 45)는 총 ㅁㅁ개이다.',
    options: ['12', '13', '15', '18'],
    answer: '15',
    acceptedAnswers: ['15', '15개'],
    funFactTitle: '45 ÷ 3 = 15! 전체 로또 번호의 정확히 3분의 1이 3의 배수!',
    explanation:
      '45개 중 정확히 3분의 1인 15개가 3의 배수이므로, 6개의 당첨번호를 뽑을 때 평균적으로 2개의 3의 배수가 포함됩니다.',
  },

  // =========================================================================
  // 5. 추가 심화 & 흥미진진한 로또 비하인드 스토리 16문항
  // =========================================================================
  {
    id: 'ex-01',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 상식',
    difficulty: '쉬움',
    question:
      '현재 대한민국에서 기획재정부 복권위원회의 위탁을 받아 로또 6/45와 연금복권720+를 발행·운영하고 있는 수탁사업자 이름은?',
    options: ['동행복권', '나눔로또', '코리아로또', '국민복권'],
    answer: '동행복권',
    funFactTitle:
      '2018년 12월(제836회)부터 수탁사업자가 나눔로또에서 동행복권으로!',
    explanation:
      '1기 코리아로또시스템, 2~3기 나눔로또에 이어 4기(2018년 12월~)부터는 (주)동행복권이 로또 6/45 및 인쇄·전자복권 통합 수탁사업자로 운영하고 있습니다.',
  },
  {
    id: 'ex-02',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 상식',
    difficulty: '보통',
    question:
      '2026년 현재 대한민국 로또 6/45 추첨 생방송을 매주 토요일 저녁에 중계하고 있는 방송사는 어디일까요?',
    options: ['MBC', 'SBS', 'KBS1', 'EBS'],
    answer: 'MBC',
    funFactTitle: 'SBS → MBC로 이어진 토요일 저녁 황금손 추첨 방송!',
    explanation:
      '과거에는 SBS에서 추첨 방송을 진행했으나, 2018년 12월 제836회차부터는 MBC 상암 신사옥 스튜디오에서 [생방송 행복드림 로또 6/45]로 방송되고 있습니다.',
  },
  {
    id: 'ex-03',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 상식',
    difficulty: '쉬움',
    question:
      'MBC 로또 추첨 생방송에서 매주 선행이나 기부, 사회 공헌에 앞장선 인물을 초청해 추첨 버튼을 누르게 하는 코너의 별칭은 [오늘의 ㅁㅁㅁ]이다.',
    options: ['황금손', '행운손', '기적손', '천사손'],
    answer: '황금손',
    acceptedAnswers: ['황금손'],
    funFactTitle: '나눔과 기부의 가치를 전하는 매주 토요일의 황금손!',
    explanation:
      '복권기금의 공익적 취지를 살리기 위해 매주 봉사자, 기부자, 의인 등을 [황금손]으로 초청하여 추첨기 스타트 버튼을 누르고 있습니다.',
  },
  {
    id: 'ex-04',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 슬립의 비밀',
    difficulty: '보통',
    question:
      '로또 마킹 용지(슬립) 한 칸(1~45)은 가로 7칸 × 세로 7칸 격자 형태를 띠고 있습니다. 가로 첫 줄(1~7번)에서 오른쪽 끝 숫자는 무엇일까요?',
    options: ['7번', '5번', '6번', '10번'],
    answer: '7번',
    funFactTitle: '한국 로또 용지는 달력처럼 가로 7열 구조로 배치되어 있다!',
    explanation:
      '달력과 똑같이 가로 7칸(1~7, 8~14, 15~21, 22~28, 29~35, 36~42, 43~45) 배열로 되어 있어 세로줄이나 대각선 패턴으로 마킹하는 유저들도 많습니다.',
  },
  {
    id: 'ex-05',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 슬립 수학',
    difficulty: '매니아',
    question:
      '로또 슬립지(1~45)에서 번호 1과 합쳐서 항상 46이 되는 정반대 위치의 숫자를 [대칭수]라고 한다. 예를 들어 1의 대칭수는 45이고, 10의 대칭수는 ㅁㅁ이다.',
    options: ['34', '35', '36', '37'],
    answer: '36',
    acceptedAnswers: ['36', '36번'],
    funFactTitle: '합이 46이 되는 짝꿍 숫자, 대칭수(Symmetric Number)!',
    explanation:
      '46 - N 공식으로 구하는 대칭수에서 10의 대칭수는 46 - 10 = 36이며, 정중앙 숫자인 23의 대칭수는 자기 자신인 23입니다.',
  },
  {
    id: 'ex-06',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 문화',
    difficulty: '보통',
    question:
      '이탈리아 나폴리에서 발전한 전통 꿈 해몽 사전으로, 꿈에 나온 사물이나 사건을 1부터 90까지의 로또 번호로 변환해 주는 유명한 책의 이름은?',
    options: [
      '라 스모르피아 (La Smorfia)',
      '데카메론 (Decameron)',
      '신곡 (Divina Commedia)',
      '타로 코덱스 (Tarot Codex)',
    ],
    answer: '라 스모르피아 (La Smorfia)',
    funFactTitle:
      '고대 그리스 신 모르페우스에서 유래한 이탈리아의 로또 꿈 해몽서!',
    explanation:
      '한국에 돼지꿈·조상꿈 해몽이 있다면, 로또의 종주국 이탈리아에는 수백 년 역사의 꿈-숫자 변환 사전 [라 스모르피아]가 있어 꿈을 꾸면 이 책을 보고 번호를 고릅니다.',
  },
  {
    id: 'ex-07',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 문화',
    difficulty: '쉬움',
    question:
      '한국의 로또 당첨자 설문조사에서 1등 당첨자들이 당첨 전 가장 많이 꾸었다고 답한 단골 길몽(꿈) 1위는 무엇일까요?',
    options: [
      '조상님이나 돌아가신 부모님이 나타나는 꿈',
      '하늘을 날아 우주로 가는 꿈',
      '이빨이 전부 빠지는 꿈',
      '시험에서 0점을 맞는 꿈',
    ],
    answer: '조상님이나 돌아가신 부모님이 나타나는 꿈',
    funFactTitle:
      '1위는 조상님 꿈, 2위는 동물(돼지·용) 꿈, 3위는 대통령·유명인 꿈!',
    explanation:
      '동행복권의 당첨자 인터뷰 통계에 따르면 돌아가신 조상님이 밝은 표정으로 나타나거나 무언가를 건네주는 꿈이 역대 길몽 1위를 차지하고 있습니다.',
  },
  {
    id: 'ex-08',
    type: 'MULTIPLE_CHOICE',
    category: 'MATH_FUN',
    categoryLabel: '로또 통계 상식',
    difficulty: '보통',
    question:
      '만약 매주 로또를 5,000원(5게임)씩 빠짐없이 산다면, 산술적으로 8,145,060가지 조합을 모두 한 번씩 채우는 데 약 몇 년이 걸릴까요?',
    options: ['약 313년', '약 3,130년', '약 31,327년', '약 31만 년'],
    answer: '약 31,327년',
    funFactTitle:
      '구석기 시대부터 매주 5천 원씩 사야 모든 조합을 한 번씩 산다!',
    explanation:
      '1년(52주)에 260게임을 사므로 8,145,060 ÷ 260 = 약 31,327년이 걸립니다. 그래서 로또는 부담 없는 소액으로 일주일의 즐거움과 희망을 사는 여가로 즐기는 것이 가장 현명합니다.',
  },
  {
    id: 'ex-09',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '보통',
    question:
      '로또 6/45에서 1등부터 5등까지 어느 등수에라도 당첨(최소 5,000원 이상)될 전체 합산 당첨 확률은 약 1 / ㅁㅁ 수준이다.',
    options: ['12', '44', '100', '365'],
    answer: '44',
    acceptedAnswers: ['44', '43', '45'],
    funFactTitle:
      '5,000원(5게임)어치를 사면 그중 1게임이 당첨될 확률은 약 11%!',
    explanation:
      '5등 확률(약 1/45)에 1~4등 확률을 모두 더하면 전체 당첨 확률은 약 1/43.7(약 2.29%)이 됩니다.',
  },
  {
    id: 'ex-10',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '추첨 방송 검증',
    difficulty: '보통',
    question:
      '생방송 추첨 전 리허설(모의 추첨)에서 뽑힌 번호가 만약 그날 실제 본 추첨에서도 똑같이 나오면 어떻게 처리될까요?',
    options: [
      '독립 시행이므로 본 추첨 결과 그대로 100% 유효한 공식 당첨번호로 인정된다',
      '즉시 무효 처리하고 재추첨한다',
      '리허설 번호와 본 추첨 번호를 섞어서 발표한다',
      '다음 주 회차로 연기한다',
    ],
    answer:
      '독립 시행이므로 본 추첨 결과 그대로 100% 유효한 공식 당첨번호로 인정된다',
    funFactTitle: '기계 점검용 모의 추첨과 본 추첨은 완전히 독립된 추첨!',
    explanation:
      '방송 전 기기 정상 작동 여부를 확인하기 위해 참관인 입회하에 모의 추첨을 진행하지만, 본 추첨은 완전히 새롭게 공을 섞어 진행되므로 어떤 번호가 나오든 본 추첨 결과가 공식 당첨번호가 됩니다.',
  },
  {
    id: 'ex-11',
    type: 'MULTIPLE_CHOICE',
    category: 'HISTORY',
    categoryLabel: '세계 로또 진기록',
    difficulty: '매니아',
    question:
      '인기 미국 드라마 [로스트(LOST)]에 등장한 저주받은 숫자 6개(4, 8, 15, 16, 23, 42)가 2011년 미국 메가밀리언 추첨에서 그중 4개가 실제로 일치했을 때 벌어진 일은?',
    options: [
      '드라마 팬 수만 명이 똑같은 번호를 찍어 4만 명 이상이 동시에 당첨되었고 1인당 당첨금은 150달러에 그쳤다',
      '아무도 그 번호를 사지 않았다',
      '드라마 제작사가 당첨금을 전액 기부했다',
      '해당 번호가 영구 결번 처리되었다',
    ],
    answer:
      '드라마 팬 수만 명이 똑같은 번호를 찍어 4만 명 이상이 동시에 당첨되었고 1인당 당첨금은 150달러에 그쳤다',
    funFactTitle:
      '유명 드라마·영화 속 번호를 그대로 따라 찍으면 당첨금을 수만 명과 나눠야 한다!',
    explanation:
      '2011년 1월 4일 메가밀리언에서 4, 8, 15, 25, 47 + 메가볼 42가 나오자 드라마 LOST의 번호(4, 8, 15, 16, 23, 42)를 그대로 산 41,763명이 동시에 당첨되는 진기록이 나왔습니다.',
  },
  {
    id: 'ex-12',
    type: 'FILL_BLANK',
    category: 'KOREA_LOTTO',
    categoryLabel: '한국 로또 규정',
    difficulty: '보통',
    question:
      '로또 1·2·3등은 매주 총 판매액과 당첨자 수에 따라 당첨금이 달라지는 반면, 4등은 ㅁ만 원으로 당첨금이 고정되어 있다.',
    options: ['1', '3', '5', '10'],
    answer: '5',
    acceptedAnswers: ['5', '5만', '5만원', '50000', '50,000'],
    funFactTitle: '5등은 5,000원, 4등은 50,000원 고정 당첨금(비과세)!',
    explanation:
      '4등(본 번호 4개 일치)은 당첨금이 50,000원으로 고정되어 있으며, 200만 원 이하이므로 세금(기타소득세)을 전혀 떼지 않고 5만 원 전액을 현금으로 수령합니다.',
  },
  {
    id: 'ex-13',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 색상 규칙',
    difficulty: '쉬움',
    question:
      '대한민국 로또 6/45에서 21번부터 30번까지의 공은 어떤 색상일까요?',
    options: [
      '빨간색 (Red)',
      '노란색 (Yellow)',
      '파란색 (Blue)',
      '초록색 (Green)',
    ],
    answer: '빨간색 (Red)',
    funFactTitle: '정중앙 대역인 21~30번은 강렬한 빨간색 볼!',
    explanation:
      '1~10 노랑, 11~20 파랑, 21~30 빨강, 31~40 회색, 41~45 초록 순서로 색상이 지정되어 있습니다.',
  },
  {
    id: 'ex-14',
    type: 'MULTIPLE_CHOICE',
    category: 'SCIENCE_RULE',
    categoryLabel: '로또 색상 규칙',
    difficulty: '쉬움',
    question:
      '대한민국 로또 6/45에서 31번부터 40번까지의 공은 어떤 색상 계열일까요?',
    options: [
      '회색/검정 (Gray/Black)',
      '노란색 (Yellow)',
      '주황색 (Orange)',
      '보라색 (Purple)',
    ],
    answer: '회색/검정 (Gray/Black)',
    funFactTitle: '31~40번 구간은 차분한 회색(진회색/검정) 볼!',
    explanation:
      '31번부터 40번까지는 회색(화면 및 그래픽에서는 진회색/퍼플그레이 계열)으로 구분되어 있습니다.',
  },
  {
    id: 'ex-15',
    type: 'FILL_BLANK',
    category: 'MATH_FUN',
    categoryLabel: '로또 수학/확률',
    difficulty: '매니아',
    question:
      '당첨번호 6개가 모두 같은 색상 구간(예: 1~10번 노란색 공에서만 6개 전부)에서 뽑힐 경우의 수는 1~10구간, 11~20구간, 21~30구간, 31~40구간을 모두 합쳐도 총 ㅁㅁㅁ가지뿐이다.',
    options: ['210', '420', '840', '1260'],
    answer: '840',
    acceptedAnswers: ['840', '840가지'],
    funFactTitle:
      '10C6 = 210가지 × 4개 구간 = 840가지! 전체의 0.01%에 불과한 단색 올인!',
    explanation:
      '10개 번호 중 6개를 뽑는 경우의 수는 210가지이며, 41~45번(초록색)은 공이 5개뿐이라 6개가 나올 수 없습니다. 따라서 6개 모두 같은 색상이 나올 확률은 840 / 8,145,060(약 0.01%)으로 극히 희박합니다.',
  },
  {
    id: 'ex-16',
    type: 'MULTIPLE_CHOICE',
    category: 'KOREA_LOTTO',
    categoryLabel: '건전 복권 문화',
    difficulty: '쉬움',
    question:
      '로또 판매 수익금으로 조성된 [복권기금]이 법정 배분 사업 및 공익사업으로 가장 많이 쓰이는 대표 분야는 무엇일까요?',
    options: [
      '저소득층·소외계층 주거 안정 지원 및 장학·복지 사업',
      '프로 스포츠 구단 인수',
      '해외 여행 경비 지원',
      '초고층 빌딩 건설',
    ],
    answer: '저소득층·소외계층 주거 안정 지원 및 장학·복지 사업',
    funFactTitle:
      '내가 산 로또 한 장의 약 420원은 이웃을 돕는 따뜻한 복권기금!',
    explanation:
      '복권기금은 저소득층 임대주택 지원, 한부모·다문화 가정 지원, 국가유공자 복지, 과학기술 진흥 및 문화예술 나눔 사업 등 우리 사회 곳곳의 공익사업에 소중히 사용됩니다.',
  },
];

/**
 * 실시간 역대 로또 볼 통계를 바탕으로 동적 통계 퀴즈 생성
 */
export function buildDynamicStatsQuestions(
  ballStatsList?: LotteryBallStat[],
): QuizQuestion[] {
  if (!ballStatsList || ballStatsList.length < 45) return [];

  const sortedByCount = [...ballStatsList].sort(
    (a, b) => b.totalCount - a.totalCount,
  );
  const topBall = sortedByCount[0];
  const secondBall = sortedByCount[1];
  const midBall = sortedByCount[22];
  const lowBall = sortedByCount[sortedByCount.length - 1];

  if (!topBall || !lowBall || !secondBall || !midBall) return [];

  const dynamicPool: QuizQuestion[] = [
    {
      id: `dyn-top-${topBall.ball}-${topBall.totalCount}`,
      type: 'MULTIPLE_CHOICE',
      category: 'MATH_FUN',
      categoryLabel: 'Hactto 실시간 통계',
      difficulty: '보통',
      question: `Hactto 역대 당첨번호 실시간 통계 기준, 다음 4개의 번호 중 지금까지 가장 많이 출현(총 ${topBall.totalCount}회)한 최다 출현 번호는 몇 번일까요?`,
      options: [
        `${topBall.ball}번`,
        `${lowBall.ball}번`,
        `${midBall.ball}번`,
        `${sortedByCount[35]?.ball ?? 9}번`,
      ].sort((a, b) => a.localeCompare(b, 'ko')),
      answer: `${topBall.ball}번`,
      funFactTitle: `역대 최다 출현 1위 볼은 바로 ${topBall.ball}번 (${topBall.totalCount}회 출현)!`,
      explanation: `현재까지 누적 통계에서 ${topBall.ball}번 볼이 총 ${topBall.totalCount}회 출현하여 1위를 기록 중이며, 그 뒤를 ${secondBall.ball}번(${secondBall.totalCount}회)이 잇고 있습니다.`,
    },
    {
      id: `dyn-low-${lowBall.ball}-${lowBall.totalCount}`,
      type: 'MULTIPLE_CHOICE',
      category: 'MATH_FUN',
      categoryLabel: 'Hactto 실시간 통계',
      difficulty: '보통',
      question: `Hactto 역대 당첨번호 실시간 통계 기준, 다음 중 지금까지 출현 횟수가 가장 적은(총 ${lowBall.totalCount}회) 번호는 몇 번일까요?`,
      options: [
        `${lowBall.ball}번`,
        `${topBall.ball}번`,
        `${secondBall.ball}번`,
        `${sortedByCount[5]?.ball ?? 27}번`,
      ].sort((a, b) => a.localeCompare(b, 'ko')),
      answer: `${lowBall.ball}번`,
      funFactTitle: `역대 최소 출현 볼은 ${lowBall.ball}번 (${lowBall.totalCount}회 출현)!`,
      explanation: `1위인 ${topBall.ball}번(${topBall.totalCount}회)과 최소 출현인 ${lowBall.ball}번(${lowBall.totalCount}회)은 ${topBall.totalCount - lowBall.totalCount}회의 차이를 보이지만, 큰 수의 법칙에 따라 장기적으로는 격차가 좁혀지는 경향이 있습니다.`,
    },
  ];

  return dynamicPool;
}

/**
 * 비복원 셔플 큐(Deck Shuffle) 방식으로 중복 없는 N개의 퀴즈 세트를 추출
 */
export function drawQuizSet(
  count: number = 3,
  ballStatsList?: LotteryBallStat[],
): QuizQuestion[] {
  let seenIds: string[] = [];
  try {
    const raw = localStorage.getItem(QUIZ_SEEN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        seenIds = parsed;
      }
    }
  } catch {
    seenIds = [];
  }

  const dynamicQuestions = buildDynamicStatsQuestions(ballStatsList);
  const allQuestions = [...LOTTO_TRIVIA_QUESTIONS, ...dynamicQuestions];

  const seenSet = new Set(seenIds);
  let unseenPool = allQuestions.filter((q) => !seenSet.has(q.id));

  // 미출제 문항이 count보다 적으면 셔플 큐 초기화(새 덱 시작)
  if (unseenPool.length < count) {
    seenIds = [];
    unseenPool = [...allQuestions];
  }

  // Fisher-Yates 셔플
  const shuffled = [...unseenPool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const picked = shuffled.slice(0, count);
  const updatedSeen = [...seenIds, ...picked.map((q) => q.id)];

  try {
    localStorage.setItem(QUIZ_SEEN_STORAGE_KEY, JSON.stringify(updatedSeen));
  } catch {
    // ignore storage quota errors
  }

  return picked;
}
