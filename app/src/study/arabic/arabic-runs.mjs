// The Arabic runs displayed by Mixed, also used when authoring voice clips. Keep their exact text and positions.
const RUN = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+(?:[\s،؛؟]+[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+)*/g;
export const arabicRuns = text => [...text.matchAll(RUN)].map(m => ({ text: m[0], index: m.index }));
