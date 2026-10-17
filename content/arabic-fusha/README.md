# Arabic Fuṣḥā curriculum

Modern Standard Arabic curriculum, version 1.1.1: 30 modules, 152 lessons,
304 exercises, 60 practice labs and 18 projects. The 24-module core progresses
from script and sounds to a B2 learning target, with six optional extensions.
These are curriculum targets, not certified proficiency levels.

Start studying with the [lesson teaching companion](../teaching/arabic-fusha-lessons.md):
all 152 lessons have explanations, worked examples, guided exercises, explained answers
and specific reading/listening assignments, also shown directly in MyDay.
Arabic screens include a remembered transliteration toggle and a pronunciation key;
see [pronunciation support](../teaching/pronunciation/README.md) for coverage and conventions.
Use the [complete curriculum](MyDay_Arabic_Fusha_Curriculum.md) and
[package guide](MyDay_Arabic_README.md). Download
[the HTML reader](MyDay_Arabic_Fusha_Curriculum.html) to read it offline with module navigation.

The [canonical JSON](MyDay_Arabic_Fusha_Curriculum.json), schema, starter materials,
assessment keys and separate adaptive tutor specification are included. MyDay's Study
screens support lessons, sessions and revision, with answers revealed on request.
Audio is linked from providers, not bundled; a deployed adaptive tutor is not included.

From the repository root, validate the package with Python 3:

```bash
python3 content/arabic-fusha/validate_arabic_curriculum.py content/arabic-fusha
```

After editing the canonical JSON or architecture introduction, regenerate the readers:

```bash
python3 content/arabic-fusha/authoring/render_curriculum.py
```

The [teaching guide](../teaching/README.md) documents companion generation and source checks.
The package guide documents the data relationships, evidence requirements and review limits.
