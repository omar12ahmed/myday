import type { MyDayData } from '../data/types';
import type { ExploreData, ExploreScene, SceneOf } from './schema';
export interface SceneContext { jump: (id: string) => void; firstChapter: string; data: MyDayData; doc: ExploreData; preview: boolean }
export type SceneProps<T extends ExploreScene['type']> = { scene: SceneOf<T>; context: SceneContext };
