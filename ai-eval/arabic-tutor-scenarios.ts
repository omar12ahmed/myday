// A live Arabic tutor (option 2, the owner's study of 30 Oct 2026): 24 questions a learner might ask about a lesson,
// in the style of the owner's example (the forms of a root, why a pronoun is optional, how a command or the jussive is
// made, two look-alike forms, what a particle does). Each is grounded in a real lesson of the Fuṣḥā course (its title,
// objectives, key concepts, explanation, example and course words go with it). None is worded with its lesson's own
// knowledge-check words, so a good answer teaches the point without handing over a check's answer (and the run flags
// any reply that contains one: ai-eval/arabic-tutor.ts).
export interface ArabicTutorScenario { kind: 'arabic-tutor'; id: string; title: string; lessonId: string; question: string }

const Q = (id: string, lesson: string, question: string, title = question): ArabicTutorScenario => ({ kind: 'arabic-tutor', id, title, lessonId: `lesson.arabic-${lesson}`, question });

export const ARABIC_TUTOR_SCENARIOS: ArabicTutorScenario[] = [
  Q('at01-hollow-family', 'weak-verbs', 'Why do عَاشَ, يَعِيشُ and عِشْتُ look so different if they are the same verb?'),
  Q('at02-optional-pronoun', 'present-person', 'If أَكْتُبُ already means "I write", why would I ever add أَنَا?'),
  Q('at03-command', 'requests-imperatives', 'How do you get the command اِجْلِسْ from يَجْلِسُ?'),
  Q('at04-jussive-nun', 'verb-moods', 'Why does لَمْ change يَفْهَمُونَ to يَفْهَمُوا?'),
  Q('at05-past-endings', 'past-suffixes', 'Why does ذَهَبْنَا end in -nā but ذَهَبُوا in -ū?'),
  Q('at06-sun-letters', 'gender-definiteness', 'Why does السَّيَّارَةُ sound like "as-sayyāra" but الْقَلَمُ keeps the l?'),
  Q('at07-adjective-gender', 'adjective-agreement', 'Why is it سَيَّارَةٌ قَدِيمَةٌ but بَيْتٌ قَدِيمٌ?'),
  Q('at08-broken-sound-plural', 'plural-basics', 'Why is the plural of قَلَمٌ أَقْلَامٌ, but of مُعَلِّمٌ مُعَلِّمُونَ?'),
  Q('at09-idafa-genitive', 'idafa-chains', 'In بَابُ الْبَيْتِ, why does بَيْت end in -i?'),
  Q('at10-near-far', 'demonstratives', 'What is the difference between هُنَا and هُنَاكَ, and between هَذَا and ذَلِكَ?'),
  Q('at11-root-patterns', 'root-pattern', 'دَرْسٌ, مُدَرِّسٌ and دِرَاسَةٌ share د ر س. What do the patterns add?'),
  Q('at12-participles', 'participles-masdar', 'What is the difference between قَارِئٌ and مَقْرُوءٌ?'),
  Q('at13-negation', 'negation-system', 'When do I use لَمْ, لَنْ or لَا with a verb?'),
  Q('at14-future', 'future-plans', 'Is there a difference between سَأَذْهَبُ and سَوْفَ أَذْهَبُ?'),
  Q('at15-kana-alif', 'kana-background', 'Why is it كُنْتُ but كَانَ? Where did the alif go?'),
  Q('at16-attached-pronouns', 'pronoun-attachment', 'In رَأَيْتُهُ, which part is "I" and which part is "him"?'),
  Q('at17-subject-object', 'case-roles', 'Why does it say رَأَيْتُ الْمُعَلِّمَ but جَاءَ الْمُعَلِّمُ?'),
  Q('at18-dual', 'dual-sound-plurals', 'Why is it طَالِبَانِ in one sentence and طَالِبَيْنِ in another?'),
  Q('at19-form-two', 'derived-forms', 'How are دَرَسَ and دَرَّسَ different?'),
  Q('at20-initial-waw', 'irregular-families', 'Why does وَقَفَ lose its و in يَقِفُ?'),
  Q('at21-passive-hollow', 'passive-voice', 'How does قِيلَ come from قَالَ?'),
  Q('at22-relative', 'relative-clauses', 'When do I use الَّذِي and when الَّتِي?'),
  Q('at23-asbaha', 'inna-kana', 'Why do we say أَصْبَحَ الْجَوُّ بَارِدًا, with -an at the end of بَارِد?'),
  Q('at24-fa', 'clitic-segmentation', 'In فَذَهَبْتُ, what does the فَ do?'),
];
