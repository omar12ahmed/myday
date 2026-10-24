// Arabic lessons for a project's Learning card (data/studyLinks.ts). The Arabic catalogue is large, so this loads on
// demand, away from the first bundle, as Study home's next step does (study/useNextLearning.ts).
import { STATE_LABEL } from '../data/study/mastery';
import type { MyDayData } from '../data/types';
import { lessonIndex } from '../study/arabic/catalogue';
import { arabicState, pathLessons } from '../study/arabic/plan';

// A lesson's title and Study's state for it ("Practised"); null when it isn't in the course any more.
export const arabicLesson = (data: MyDayData, id: string) => (lessonIndex[id] ? { title: lessonIndex[id].title, status: STATE_LABEL[arabicState(data, id)] } : null);
// Your path's lessons in course order, for "Link something".
export const arabicChoices = (data: MyDayData) => pathLessons(data.arabic.pathId).map(id => ({ id, title: lessonIndex[id].title }));
