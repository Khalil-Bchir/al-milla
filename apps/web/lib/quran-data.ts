export type NarrationId = 'qalun' | 'warsh' | 'hafs';

export interface AyahEntry {
  number: number;
  textAr: string;
  translationEn: string;
  translationFr: string;
  transliteration: string;
  qalunNote?: string;
}

export interface SurahEntry {
  id: number;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  revelationTypeAr: 'مكية' | 'مدنية';
  totalAyahs: number;
  juz: number;
  hizb: number;
  pageStart: number;
  ayahs: AyahEntry[];
}

export interface TafsirWordNote {
  word: string;
  meaningAr: string;
  meaningEn: string;
  meaningFr: string;
}

export interface MutashabihatDrill {
  id: string;
  primarySurahId: number;
  primarySurahName: string;
  primaryAyahRange: string;
  primaryHizb: number;
  primaryText: string;
  primaryHighlight: string;
  primaryNoteQalun: string;
  secondarySurahId: number;
  secondarySurahName: string;
  secondaryAyahRange: string;
  secondaryHizb: number;
  secondaryText: string;
  secondaryHighlight: string;
  divergenceNote: string;
  mnemonicTitle: string;
  mnemonicBody: string;
  maghrebiPoem: string;
  quizPrompt: string;
  quizOptions: {
    id: string;
    label: string;
    isCorrect: boolean;
  }[];
  quizExplanation: string;
}

export interface SurahMasterySummary {
  surahId: number;
  nameAr: string;
  totalAyahs: number;
  memorizedCount: number;
  hizb: number;
  percent: number;
  statusLabelAr: string;
  lastActivityAr: string;
  needsCare?: boolean;
  careNoteAr?: string;
}

export const SURAHS: SurahEntry[] = [
  {
    id: 1,
    nameAr: 'سورة الفاتحة',
    nameEn: 'Al-Fatihah',
    nameFr: 'Al-Fatihah',
    revelationTypeAr: 'مكية',
    totalAyahs: 7,
    juz: 1,
    hizb: 1,
    pageStart: 1,
    ayahs: [
      {
        number: 1,
        textAr: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ',
        translationEn: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
        translationFr: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.',
        transliteration: 'Bismi Allāhi ar-Raḥmāni ar-Raḥīm',
      },
      {
        number: 2,
        textAr: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        translationEn: '[All] praise is [due] to Allah, Lord of the worlds -',
        translationFr: 'Louange à Allah, Seigneur de l’univers.',
        transliteration: 'Al-ḥamdu lillāhi rabbi al-ʿālamīn',
      },
      {
        number: 3,
        textAr: 'الرَّحْمَـٰنِ الرَّحِيمِ',
        translationEn: 'The Entirely Merciful, the Especially Merciful,',
        translationFr: 'Le Tout Miséricordieux, le Très Miséricordieux,',
        transliteration: 'Ar-Raḥmāni ar-Raḥīm',
      },
      {
        number: 4,
        textAr: 'مَالِكِ يَوْمِ الدِّينِ',
        translationEn: 'Sovereign of the Day of Recompense.',
        translationFr: 'Maître du Jour de la rétribution.',
        transliteration: 'Māliki yawmi ad-dīn',
        qalunNote: 'يقرأ قالون «مَلِكِ يَوْمِ الدِّينِ» بغير ألف، ويقرأ حفص «مَالِكِ» بالألف.',
      },
      {
        number: 5,
        textAr: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        translationEn: 'It is You we worship and You we ask for help.',
        translationFr: 'C’est Toi [Seul] que nous adorons, et c’est Toi [Seul] dont nous implorons secours.',
        transliteration: 'Iyyāka naʿbudu wa-iyyāka nastaʿīn',
      },
      {
        number: 6,
        textAr: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        translationEn: 'Guide us to the straight path -',
        translationFr: 'Guide-nous dans le droit chemin,',
        transliteration: 'Ihdinā aṣ-ṣirāṭa al-mustaqīm',
      },
      {
        number: 7,
        textAr: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        translationEn:
          'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.',
        translationFr:
          'le chemin de ceux que Tu as comblés de faveurs, non pas de ceux qui ont encouru Ta colère, ni des égarés.',
        transliteration: 'Ṣirāṭa allaḏīna anʿamta ʿalayhim ġayri al-maġḍūbi ʿalayhim wa-lā aḍ-ḍāllīn',
      },
    ],
  },
  {
    id: 18,
    nameAr: 'سورة الكهف',
    nameEn: 'Al-Kahf',
    nameFr: 'Al-Kahf (La Caverne)',
    revelationTypeAr: 'مكية',
    totalAyahs: 110,
    juz: 15,
    hizb: 29,
    pageStart: 293,
    ayahs: [
      {
        number: 1,
        textAr: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا',
        translationEn:
          '[All] praise is [due] to Allah, who has sent down upon His Servant the Book and has not made therein any deviance.',
        translationFr:
          'Louange à Allah qui a fait descendre sur Son serviteur le Livre, et n’y a point introduit de tortuosité [ambiguïté].',
        transliteration:
          'Al-ḥamdu lillāhi allaḏī anzala ʿalā ʿabdihi al-kitāba wa-lam yajʿal lahu ʿiwajā',
        qalunNote:
          'عند قالون عن نافع: لا سكت عند الوصل على «عِوَجًا» بل يُدرجها مع إخفاء التنوين عند القاف في «قَيِّمًا».',
      },
      {
        number: 2,
        textAr:
          'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا',
        translationEn:
          '[He has made it] straight, to warn of severe punishment from Him and to give good tidings to the believers who do righteous deeds that they will have a good reward',
        translationFr:
          '[Un Livre] d’une parfaite droiture pour avertir d’une sévère punition venant de Sa part et pour annoncer aux croyants qui font de bonnes œuvres qu’il y aura pour eux une belle récompense.',
        transliteration:
          'Qayyiman li-yunḏira baʾsan šadīdan min ladunhu wa-yubaššira al-muʾminīna allaḏīna yaʿmalūna aṣ-ṣāliḥāti anna lahum ajran ḥasanā',
      },
      {
        number: 3,
        textAr: 'مَّاكِثِينَ فِيهِ أَبَدًا',
        translationEn: 'In which they will remain forever',
        translationFr: 'Où ils demeureront éternellement,',
        transliteration: 'Mākiṯīna fīhi abadā',
      },
      {
        number: 4,
        textAr: 'وَيُنذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا',
        translationEn: 'And to warn those who say, "Allah has taken a son."',
        translationFr: 'Et pour avertir ceux qui disent : « Allah S’est attribué un enfant. »',
        transliteration: 'Wa-yunḏira allaḏīna qālū ittaḫaḏa Allāhu waladā',
      },
      {
        number: 5,
        textAr:
          'مَّا لَهُم بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ ۚ إِن يَقُولُونَ إِلَّا كَذِبًا',
        translationEn:
          'They have no knowledge of it, nor had their fathers. Grave is the word that comes out of their mouths; they speak not except a lie.',
        translationFr:
          'Ils n’en ont aucune science, ni leurs ancêtres. Quelle monstrueuse parole que celle qui sort de leurs bouches ! Ce qu’ils disent n’est que mensonge.',
        transliteration:
          'Mā lahum bihi min ʿilmin wa-lā li-ābāʾihim kaburat kalimatan taḫruju min afwāhihim in yaqūlūna illā kaḏibā',
      },
    ],
  },
  {
    id: 56,
    nameAr: 'سورة الواقعة',
    nameEn: "Al-Waqi'ah",
    nameFr: "Al-Waqi'ah (L'Événement)",
    revelationTypeAr: 'مكية',
    totalAyahs: 96,
    juz: 27,
    hizb: 54,
    pageStart: 534,
    ayahs: [
      {
        number: 75,
        textAr: 'فَلَا أُقْسِمُ بِمَوَاقِعِ النُّجُومِ',
        translationEn: 'Then I swear by the setting of the stars,',
        translationFr: 'Non ! Je jure par les positions des étoiles (dans le firmament).',
        transliteration: 'Fa-lā uqsimu bi-mawāqiʿi an-nujūm',
        qalunNote: 'يقرأ قالون بالجمع «بِمَوَاقِعِ» (وقراءة حمزة والكسائي وخلف بالإفراد «بِمَوْقِعِ»).',
      },
      {
        number: 76,
        textAr: 'وَإِنَّهُ لَقَسَمٌ لَّوْ تَعْلَمُونَ عَظِيمٌ',
        translationEn: 'And indeed, it is an oath - if you could know - [most] great.',
        translationFr: 'Et c’est vraiment un serment solennel, si vous saviez.',
        transliteration: 'Wa-innahu la-qasamun law taʿlamūna ʿaẓīm',
      },
    ],
  },
  {
    id: 69,
    nameAr: 'سورة الحاقة',
    nameEn: 'Al-Haqqah',
    nameFr: 'Al-Haqqah (Celle qui montre la vérité)',
    revelationTypeAr: 'مكية',
    totalAyahs: 52,
    juz: 29,
    hizb: 57,
    pageStart: 566,
    ayahs: [
      {
        number: 38,
        textAr: 'فَلَا أُقْسِمُ بِمَا تُبْصِرُونَ',
        translationEn: 'So I swear by what you see',
        translationFr: 'Mais non ! Je jure par ce que vous voyez,',
        transliteration: 'Fa-lā uqsimu bimā tubṣirūn',
      },
      {
        number: 39,
        textAr: 'وَمَا لَا تُبْصِرُونَ',
        translationEn: 'And what you do not see',
        translationFr: 'ainsi que par ce que vous ne voyez pas,',
        transliteration: 'Wa-mā lā tubṣirūn',
      },
      {
        number: 40,
        textAr: 'إِنَّهُ لَقَوْلُ رَسُولٍ كَرِيمٍ',
        translationEn: '[That] indeed, the Qur’an is the word of a noble Messenger.',
        translationFr: 'que ceci [le Coran] est la parole d’un noble Messager,',
        transliteration: 'Innahu la-qawlu rasūlin karīm',
      },
    ],
  },
  {
    id: 67,
    nameAr: 'سورة الملك',
    nameEn: 'Al-Mulk',
    nameFr: 'Al-Mulk (La Royauté)',
    revelationTypeAr: 'مكية',
    totalAyahs: 30,
    juz: 29,
    hizb: 57,
    pageStart: 562,
    ayahs: [
      {
        number: 1,
        textAr: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        translationEn: 'Blessed is He in whose hand is dominion, and He is over all things competent -',
        translationFr: 'Béni soit Celui dans la main de qui est la royauté, et Il est Omnipotent.',
        transliteration: 'Tabāraka allaḏī bi-yadihi al-mulku wa-huwa ʿalā kulli šayʾin qadīr',
      },
      {
        number: 2,
        textAr:
          'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ',
        translationEn:
          '[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -',
        translationFr:
          'Celui qui a créé la mort et la vie afin de vous éprouver (et de savoir) qui de vous est le meilleur en œuvre, et c’est Lui le Puissant, le Pardonneur.',
        transliteration:
          'Allaḏī ḫalaqa al-mawta wa-al-ḥayāta li-yabluwakum ayyukum aḥsanu ʿamalan wa-huwa al-ʿazīzu al-ġafūr',
      },
    ],
  },
];

export const KAHF_TAFSIR_WORDS: TafsirWordNote[] = [
  {
    word: 'عِوَجًا',
    meaningAr: 'الميل والانحراف والتناقض واللبس؛ فنفى الله عن كتابه أي اختلاف شكلاً أو مضموناً.',
    meaningEn: 'Crookedness, deviation, or contradiction — Allah negated any flaw from His Book.',
    meaningFr: 'Tortuosité, contradiction ou ambiguïté — Allah a écarté tout défaut de Son Livre.',
  },
  {
    word: 'قَيِّمًا',
    meaningAr: 'مستقيماً معتدلاً في ذاته، وقيّماً ومهيمناً على مصالح العباد وسائر الكتب السماوية السابقة.',
    meaningEn: 'Straight and balanced in itself, guarding the welfare of servants and previous scriptures.',
    meaningFr: 'Droit et équilibré en soi, veillant sur l’intérêt des serviteurs et des Écritures antérieures.',
  },
];

export const MUTASHABIHAT_DRILLS: MutashabihatDrill[] = [
  {
    id: 'waqiah-haqqah',
    primarySurahId: 56,
    primarySurahName: 'سورة الواقعة',
    primaryAyahRange: 'الآية ٧٥ - ٧٦',
    primaryHizb: 54,
    primaryText: 'فَلَا أُقْسِمُ بِمَوَاقِعِ النُّجُومِ ۞ وَإِنَّهُ لَقَسَمٌ لَّوْ تَعْلَمُونَ عَظِيمٌ',
    primaryHighlight: 'بِمَوَاقِعِ',
    primaryNoteQalun: 'رواية قالون عن نافع: بالجمع «بِمَوَاقِعِ» (وقراءة حمزة والكسائي وخلف العاشر بالإفراد «بِمَوْقِعِ»).',
    secondarySurahId: 69,
    secondarySurahName: 'سورة الحاقة',
    secondaryAyahRange: 'الآية ٣٨ - ٤٠',
    secondaryHizb: 57,
    secondaryText: 'فَلَا أُقْسِمُ بِمَا تُبْصِرُونَ ۞ وَمَا لَا تُبْصِرُونَ ۞ إِنَّهُ لَقَوْلُ رَسُولٍ كَرِيمٍ',
    secondaryHighlight: 'بِمَا تُبْصِرُونَ',
    divergenceNote: 'الافتراق يبدأ بعد: «فَلَا أُقْسِمُ» — الحاقة: الرؤية والإبصار.',
    mnemonicTitle: 'قاعدة: مُجانسة الواو بالواو',
    mnemonicBody:
      'سورة «الْوَاقِعَة» تبتدئ بحرف الواو، فاقترن قسمها بلفظ «بِمَوَاقِعِ» المشتمل أيضاً على حرف الواو. بينما في «الْحَاقَّة» التي تُقرّر الحساب والجزاء، جاء القَسَم بما هو مشاهد ومُدْرَك: «بِمَا تُبْصِرُونَ».',
    maghrebiPoem: '«وَفِي كِتَابِ اللَّهِ لَفْظُ الْمَوْقِعِ ... فِي غَيْرِ وَاقِعَةٍ فَسَمِّ وَارْفَعِ»',
    quizPrompt: 'أكمل قول الحق تعالى في سورة «الواقعة»: ( فَلَا أُقْسِمُ .......... )',
    quizOptions: [
      { id: 'a', label: 'بِمَوَاقِعِ النُّجُومِ', isCorrect: true },
      { id: 'b', label: 'بِمَا تُبْصِرُونَ', isCorrect: false },
    ],
    quizExplanation: 'أحسنت! تذكّر دائماً: واو الواقعة مقترنة بمواقع النجوم.',
  },
];

export const INITIAL_SURAH_MASTERY: SurahMasterySummary[] = [
  {
    surahId: 67,
    nameAr: 'سورة الملك',
    totalAyahs: 30,
    memorizedCount: 30,
    hizb: 57,
    percent: 100,
    statusLabelAr: '١٠٠٪ متقنة',
    lastActivityAr: 'آخر مراجعة: اليوم بعد الفجر',
  },
  {
    surahId: 32,
    nameAr: 'سورة السجدة',
    totalAyahs: 30,
    memorizedCount: 30,
    hizb: 42,
    percent: 100,
    statusLabelAr: '١٠٠٪ متقنة',
    lastActivityAr: 'آخر تسميع: منذ يومين',
  },
  {
    surahId: 56,
    nameAr: 'سورة الواقعة',
    totalAyahs: 96,
    memorizedCount: 91,
    hizb: 54,
    percent: 95,
    statusLabelAr: '٩٥٪ ضبط متشابه',
    lastActivityAr: 'تنبيه: مراجعة الآية ٧٥ مع خاتمة الحاقة',
    needsCare: true,
    careNoteAr: 'موضع عناية',
  },
  {
    surahId: 18,
    nameAr: 'سورة الكهف',
    totalAyahs: 110,
    memorizedCount: 4,
    hizb: 29,
    percent: 4,
    statusLabelAr: 'الحفظ الجاري',
    lastActivityAr: 'ورد اليوم: الآيات (١ - ٤) برواية قالون',
  },
];

export function getSurahById(id: number): SurahEntry {
  return SURAHS.find((s) => s.id === id) ?? SURAHS[1];
}
