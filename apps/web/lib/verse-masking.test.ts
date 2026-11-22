import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatCueText, maskVerseByLevel } from './verse-masking.ts';

describe('verse-masking', () => {
  it('handles 1-word verses in cue and progressive hide modes', () => {
    assert.equal(formatCueText('الم'), '•••••');
    assert.equal(maskVerseByLevel('الم', 0), 'الم');
    assert.equal(maskVerseByLevel('الم', 1), '•••••');
    assert.equal(maskVerseByLevel('الم', 3), '•••••');
  });

  it('hides the second word of 2-word verses in cue mode and progresses across levels', () => {
    const verse = 'الرَّحْمَـٰنِ الرَّحِيمِ';
    assert.equal(formatCueText(verse), 'الرَّحْمَـٰنِ •••••');
    assert.equal(maskVerseByLevel(verse, 0), verse);
    assert.equal(maskVerseByLevel(verse, 1), 'الرَّحْمَـٰنِ •••••');
    assert.equal(maskVerseByLevel(verse, 2), '••••• •••••');
    assert.equal(maskVerseByLevel(verse, 3), '••••• •••••');
  });

  it('progressively hides 3-word verses across levels 1, 2, and 3', () => {
    const verse = 'مَـٰلِكِ يَوْمِ الدِّينِ';
    assert.equal(formatCueText(verse), 'مَـٰلِكِ •••••');
    assert.equal(maskVerseByLevel(verse, 1), 'مَـٰلِكِ يَوْمِ •••••');
    assert.equal(maskVerseByLevel(verse, 2), 'مَـٰلِكِ ••••• •••••');
    assert.equal(maskVerseByLevel(verse, 3), '••••• ••••• •••••');
  });

  it('shows 2 opening words in cue mode for longer verses and scales masking', () => {
    const verse = 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ';
    assert.equal(formatCueText(verse), 'إِيَّاكَ نَعْبُدُ ...');
    assert.equal(maskVerseByLevel(verse, 1), 'إِيَّاكَ ••••• وَإِيَّاكَ نَسْتَعِينُ');
    assert.equal(maskVerseByLevel(verse, 2), 'إِيَّاكَ ••••• ••••• نَسْتَعِينُ');
    assert.equal(maskVerseByLevel(verse, 3), 'إِيَّاكَ ••••• ••••• •••••');
  });
});
