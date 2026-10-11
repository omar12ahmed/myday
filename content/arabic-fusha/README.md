# Arabic Fuṣḥā curriculum

Modern Standard Arabic curriculum, version 1.1.0: 30 modules, 152 lessons,
304 exercises, 60 practice labs and 18 projects. The 24-module core progresses
from script and sounds to a B2 learning target, with six optional extensions.
These are curriculum targets, not certified proficiency levels.

Start with the [complete curriculum](MyDay_Arabic_Fusha_Curriculum.md) and
[package guide](MyDay_Arabic_README.md). Download
[the HTML reader](MyDay_Arabic_Fusha_Curriculum.html) to read it offline with module navigation.

The [canonical JSON](MyDay_Arabic_Fusha_Curriculum.json), schema, starter materials,
assessment keys and separate adaptive tutor specification are included for future
MyDay integration. Answer keys need an appropriate reveal boundary in the app.
Audio recordings and a deployed tutor are not included.

From the repository root, validate the package with Python 3:

```bash
python3 content/arabic-fusha/validate_arabic_curriculum.py content/arabic-fusha
```

After editing the canonical JSON or architecture introduction, regenerate the readers:

```bash
python3 content/arabic-fusha/authoring/render_curriculum.py
```

Application import, Study screens and progress storage still require implementation.
The package guide documents the data relationships, evidence requirements and review limits.
