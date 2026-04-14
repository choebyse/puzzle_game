export const FRUITS = [
  { name: '삽밥',  radius: 12,  color: '#74b9ff', score: 1,  image: '/faces/sabpap.png' },
  { name: '상호',  radius: 17,  color: '#55efc4', score: 3  },
  { name: '도준',  radius: 23,  color: '#a29bfe', score: 6  },
  { name: '양찌',  radius: 29,  color: '#ffeaa7', score: 10 },
  { name: '우영',  radius: 36,  color: '#fdcb6e', score: 15 },
  { name: '광렬',  radius: 44,  color: '#e17055', score: 21 },
  { name: '진우',  radius: 51,  color: '#d63031', score: 28 },
  { name: '상민',  radius: 60,  color: '#e84393', score: 36 },
  { name: '승우',  radius: 71,  color: '#6c5ce7', score: 45 },
  { name: '히동',  radius: 84,  color: '#00b894', score: 55 },
  { name: '용준',  radius: 97,  color: '#2d3436', score: 66 },
];

export const MAX_SPAWN_INDEX = 4; // 체리~감까지만 랜덤 생성

export function randomFruitIndex() {
  return Math.floor(Math.random() * (MAX_SPAWN_INDEX + 1));
}
