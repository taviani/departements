import prefectures from './prefectures.json';

export const prefecturesByNumber = prefectures;

export const getPrefectureName = (number) => prefectures[number]?.name ?? null;
