export const FRUITS = [
  {
    name: "삽밥",
    radius: 12,
    color: "#74b9ff",
    score: 1,
    image: "/faces/1_sabpap.png",
  },
  {
    name: "상호",
    radius: 15,
    color: "#55efc4",
    score: 3,
    image: "/faces/2_sangho.png",
  },
  {
    name: "도준",
    radius: 20,
    color: "#a29bfe",
    score: 6,
    image: "/faces/3_dojun.png",
  },
  {
    name: "양찌",
    radius: 25,
    color: "#ffeaa7",
    score: 10,
    image: "/faces/4_yangzzi.png",
  },
  {
    name: "우영",
    radius: 31,
    color: "#fdcb6e",
    score: 15,
    image: "/faces/5_woyong.png",
  },
  {
    name: "광렬",
    radius: 39,
    color: "#e17055",
    score: 21,
    image: "/faces/6_kanyol.png",
  },
  {
    name: "진우",
    radius: 45,
    color: "#d63031",
    score: 28,
    image: "/faces/7_jinwo.png",
  },
  {
    name: "상민",
    radius: 50,
    color: "#e84393",
    score: 36,
    image: "/faces/8_sangmin.png",
  },
  {
    name: "승우",
    radius: 58,
    color: "#6c5ce7",
    score: 45,
    image: "/faces/9_sunu.png",
  },
  {
    name: "히동",
    radius: 65,
    color: "#00b894",
    score: 55,
    image: "/faces/10_heedong.png",
  },
  {
    name: "용준",
    radius: 75,
    color: "#2d3436",
    score: 66,
    image: "/faces/11_youngjun.png",
  },
];

export const MAX_SPAWN_INDEX = 4; // 체리~감까지만 랜덤 생성

export function randomFruitIndex() {
  return Math.floor(Math.random() * (MAX_SPAWN_INDEX + 1));
}
