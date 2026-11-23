export type NarrationId = 'qalun' | 'warsh' | 'hafs';

export type ReciterId =
  | 'hudhaify'
  | 'husary'
  | 'minshawi'
  | 'afasy'
  | 'abdulbasit'
  | 'maher'
  | 'dosari'
  | 'sudais';

export interface ReciterInfo {
  id: ReciterId;
  nameAr: string;
  nameEn: string;
  styleAr: string;
  folder: string;
}

export const RECITERS: ReciterInfo[] = [
  {
    id: 'hudhaify',
    nameAr: 'الشيخ علي بن عبد الرحمن الحذيفي',
    nameEn: 'Ali Al-Hudhaify',
    styleAr: 'ترتيل متأنٍّ واضح المخارج',
    folder: 'Hudhaify_128kbps',
  },
  {
    id: 'husary',
    nameAr: 'الشيخ محمود خليل الحصري',
    nameEn: 'Mahmoud Khalil Al-Husary',
    styleAr: 'معلّم الترتيل والضبط',
    folder: 'Husary_128kbps',
  },
  {
    id: 'minshawi',
    nameAr: 'الشيخ محمد صديق المنشاوي',
    nameEn: 'Mohamed Siddiq Al-Minshawi',
    styleAr: 'ترتيل خاشع متزن',
    folder: 'Minshawy_Murattal_128kbps',
  },
  {
    id: 'afasy',
    nameAr: 'الشيخ مشاري راشد العفاسي',
    nameEn: 'Mishary Rashid Al-Afasy',
    styleAr: 'صوت نديّ سهل المتابعة',
    folder: 'Alafasy_128kbps',
  },
  {
    id: 'abdulbasit',
    nameAr: 'الشيخ عبد الباسط عبد الصمد',
    nameEn: 'Abdul Basit Abdus Samad',
    styleAr: 'المصحف المرتل',
    folder: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'maher',
    nameAr: 'الشيخ ماهر المعيقلي',
    nameEn: 'Maher Al-Muaiqly',
    styleAr: 'ترتيل هادئ مريح',
    folder: 'MaherAlMuaiqly128kbps',
  },
  {
    id: 'dosari',
    nameAr: 'الشيخ ياسر الدوسري',
    nameEn: 'Yasser Al-Dosari',
    styleAr: 'ترتيل مؤثر متقن',
    folder: 'Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'sudais',
    nameAr: 'الشيخ عبد الرحمن السديس',
    nameEn: 'Abdurrahman As-Sudais',
    styleAr: 'تلاوة الحرم المكي',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
  },
];

export interface AyahEntry {
  number: number;
  textAr: string;
  translationEn: string;
  translationFr: string;
  transliteration: string;
}

export interface SurahInfo {
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

export interface MushafPageAyah {
  surahId: number;
  surahNameAr: string;
  ayahNumber: number;
  textAr: string;
  juz: number;
  page: number;
}

type SurahMetaTuple = [number, string, string, string, 1 | 0, number, number, number, number];

const SURAH_CATALOG_TUPLES: SurahMetaTuple[] = [
  [1, 'سورة الفاتحة', 'Al-Fatihah', 'Al-Fatihah', 1, 7, 1, 1, 1],
  [2, 'سورة البقرة', 'Al-Baqarah', 'Al-Baqarah', 0, 286, 1, 1, 2],
  [3, 'سورة آل عمران', 'Ali \'Imran', 'Ali \'Imran', 0, 200, 3, 5, 50],
  [4, 'سورة النساء', 'An-Nisa', 'An-Nisa', 0, 176, 4, 8, 77],
  [5, 'سورة المائدة', 'Al-Ma\'idah', 'Al-Ma\'idah', 0, 120, 6, 11, 106],
  [6, 'سورة الأنعام', 'Al-An\'am', 'Al-An\'am', 1, 165, 7, 13, 128],
  [7, 'سورة الأعراف', 'Al-A\'raf', 'Al-A\'raf', 1, 206, 8, 16, 151],
  [8, 'سورة الأنفال', 'Al-Anfal', 'Al-Anfal', 0, 75, 9, 18, 177],
  [9, 'سورة التوبة', 'At-Tawbah', 'At-Tawbah', 0, 129, 10, 19, 187],
  [10, 'سورة يونس', 'Yunus', 'Yunus', 1, 109, 11, 21, 208],
  [11, 'سورة هود', 'Hud', 'Hud', 1, 123, 11, 23, 221],
  [12, 'سورة يوسف', 'Yusuf', 'Yusuf', 1, 111, 12, 24, 235],
  [13, 'سورة الرعد', 'Ar-Ra\'d', 'Ar-Ra\'d', 0, 43, 13, 26, 249],
  [14, 'سورة إبراهيم', 'Ibrahim', 'Ibrahim', 1, 52, 13, 26, 255],
  [15, 'سورة الحجر', 'Al-Hijr', 'Al-Hijr', 1, 99, 14, 27, 262],
  [16, 'سورة النحل', 'An-Nahl', 'An-Nahl', 1, 128, 14, 27, 267],
  [17, 'سورة الإسراء', 'Al-Isra', 'Al-Isra', 1, 111, 15, 29, 282],
  [18, 'سورة الكهف', 'Al-Kahf', 'Al-Kahf', 1, 110, 15, 29, 293],
  [19, 'سورة مريم', 'Maryam', 'Maryam', 1, 98, 16, 31, 305],
  [20, 'سورة طه', 'Ta-Ha', 'Ta-Ha', 1, 135, 16, 32, 312],
  [21, 'سورة الأنبياء', 'Al-Anbiya', 'Al-Anbiya', 1, 112, 17, 33, 322],
  [22, 'سورة الحج', 'Al-Hajj', 'Al-Hajj', 0, 78, 17, 34, 332],
  [23, 'سورة المؤمنون', 'Al-Mu\'minun', 'Al-Mu\'minun', 1, 118, 18, 35, 342],
  [24, 'سورة النور', 'An-Nur', 'An-Nur', 0, 64, 18, 36, 350],
  [25, 'سورة الفرقان', 'Al-Furqan', 'Al-Furqan', 1, 77, 18, 37, 359],
  [26, 'سورة الشعراء', 'Ash-Shu\'ara', 'Ash-Shu\'ara', 1, 227, 19, 38, 367],
  [27, 'سورة النمل', 'An-Naml', 'An-Naml', 1, 93, 19, 39, 377],
  [28, 'سورة القصص', 'Al-Qasas', 'Al-Qasas', 1, 88, 20, 40, 385],
  [29, 'سورة العنكبوت', 'Al-\'Ankabut', 'Al-\'Ankabut', 1, 69, 20, 41, 396],
  [30, 'سورة الروم', 'Ar-Rum', 'Ar-Rum', 1, 60, 21, 41, 404],
  [31, 'سورة لقمان', 'Luqman', 'Luqman', 1, 34, 21, 42, 411],
  [32, 'سورة السجدة', 'As-Sajdah', 'As-Sajdah', 1, 30, 21, 42, 415],
  [33, 'سورة الأحزاب', 'Al-Ahzab', 'Al-Ahzab', 0, 73, 21, 43, 418],
  [34, 'سورة سبأ', 'Saba', 'Saba', 1, 54, 22, 44, 428],
  [35, 'سورة فاطر', 'Fatir', 'Fatir', 1, 45, 22, 45, 434],
  [36, 'سورة يس', 'Ya-Sin', 'Ya-Sin', 1, 83, 22, 45, 440],
  [37, 'سورة الصافات', 'As-Saffat', 'As-Saffat', 1, 182, 23, 46, 446],
  [38, 'سورة ص', 'Sad', 'Sad', 1, 88, 23, 47, 453],
  [39, 'سورة الزمر', 'Az-Zumar', 'Az-Zumar', 1, 75, 23, 47, 458],
  [40, 'سورة غافر', 'Ghafir', 'Ghafir', 1, 85, 24, 49, 467],
  [41, 'سورة فصلت', 'Fussilat', 'Fussilat', 1, 54, 24, 50, 477],
  [42, 'سورة الشورى', 'Ash-Shuraa', 'Ash-Shuraa', 1, 53, 25, 50, 483],
  [43, 'سورة الزخرف', 'Az-Zukhruf', 'Az-Zukhruf', 1, 89, 25, 51, 489],
  [44, 'سورة الدخان', 'Ad-Dukhan', 'Ad-Dukhan', 1, 59, 25, 52, 496],
  [45, 'سورة الجاثية', 'Al-Jathiyah', 'Al-Jathiyah', 1, 37, 25, 52, 499],
  [46, 'سورة الأحقاف', 'Al-Ahqaf', 'Al-Ahqaf', 1, 35, 26, 53, 502],
  [47, 'سورة محمد', 'Muhammad', 'Muhammad', 0, 38, 26, 53, 507],
  [48, 'سورة الفتح', 'Al-Fath', 'Al-Fath', 0, 29, 26, 54, 511],
  [49, 'سورة الحجرات', 'Al-Hujurat', 'Al-Hujurat', 0, 18, 26, 54, 515],
  [50, 'سورة ق', 'Qaf', 'Qaf', 1, 45, 26, 55, 518],
  [51, 'سورة الذاريات', 'Adh-Dhariyat', 'Adh-Dhariyat', 1, 60, 26, 55, 520],
  [52, 'سورة الطور', 'At-Tur', 'At-Tur', 1, 49, 27, 55, 523],
  [53, 'سورة النجم', 'An-Najm', 'An-Najm', 1, 62, 27, 56, 526],
  [54, 'سورة القمر', 'Al-Qamar', 'Al-Qamar', 1, 55, 27, 56, 528],
  [55, 'سورة الرحمن', 'Ar-Rahman', 'Ar-Rahman', 0, 78, 27, 56, 531],
  [56, 'سورة الواقعة', 'Al-Waqi\'ah', 'Al-Waqi\'ah', 1, 96, 27, 54, 534],
  [57, 'سورة الحديد', 'Al-Hadid', 'Al-Hadid', 0, 29, 27, 57, 537],
  [58, 'سورة المجادلة', 'Al-Mujadila', 'Al-Mujadila', 0, 22, 28, 55, 542],
  [59, 'سورة الحشر', 'Al-Hashr', 'Al-Hashr', 0, 24, 28, 55, 545],
  [60, 'سورة الممتحنة', 'Al-Mumtahanah', 'Al-Mumtahanah', 0, 13, 28, 56, 549],
  [61, 'سورة الصف', 'As-Saff', 'As-Saff', 0, 14, 28, 56, 551],
  [62, 'سورة الجمعة', 'Al-Jumu\'ah', 'Al-Jumu\'ah', 0, 11, 28, 56, 553],
  [63, 'سورة المنافقون', 'Al-Munafiqun', 'Al-Munafiqun', 0, 11, 28, 56, 554],
  [64, 'سورة التغابن', 'At-Taghabun', 'At-Taghabun', 0, 18, 28, 56, 556],
  [65, 'سورة الطلاق', 'At-Talaq', 'At-Talaq', 0, 12, 28, 56, 558],
  [66, 'سورة التحريم', 'At-Tahrim', 'At-Tahrim', 0, 12, 28, 56, 560],
  [67, 'سورة الملك', 'Al-Mulk', 'Al-Mulk', 1, 30, 29, 57, 562],
  [68, 'سورة القلم', 'Al-Qalam', 'Al-Qalam', 1, 52, 29, 57, 564],
  [69, 'سورة الحاقة', 'Al-Haqqah', 'Al-Haqqah', 1, 52, 29, 57, 566],
  [70, 'سورة المعارج', 'Al-Ma\'arij', 'Al-Ma\'arij', 1, 44, 29, 58, 568],
  [71, 'سورة نوح', 'Nuh', 'Nuh', 1, 28, 29, 58, 570],
  [72, 'سورة الجن', 'Al-Jinn', 'Al-Jinn', 1, 28, 29, 58, 572],
  [73, 'سورة المزمل', 'Al-Muzzammil', 'Al-Muzzammil', 1, 20, 29, 58, 574],
  [74, 'سورة المدثر', 'Al-Muddaththir', 'Al-Muddaththir', 1, 56, 29, 58, 575],
  [75, 'سورة القيامة', 'Al-Qiyamah', 'Al-Qiyamah', 1, 40, 29, 58, 577],
  [76, 'سورة الإنسان', 'Al-Insan', 'Al-Insan', 0, 31, 29, 58, 578],
  [77, 'سورة المرسلات', 'Al-Mursalat', 'Al-Mursalat', 1, 50, 29, 58, 580],
  [78, 'سورة النبأ', 'An-Naba', 'An-Naba', 1, 40, 30, 59, 582],
  [79, 'سورة النازعات', 'An-Nazi\'at', 'An-Nazi\'at', 1, 46, 30, 59, 583],
  [80, 'سورة عبس', '\'Abasa', '\'Abasa', 1, 42, 30, 59, 585],
  [81, 'سورة التكوير', 'At-Takwir', 'At-Takwir', 1, 29, 30, 59, 586],
  [82, 'سورة الانفطار', 'Al-Infitar', 'Al-Infitar', 1, 19, 30, 59, 587],
  [83, 'سورة المطففين', 'Al-Mutaffifin', 'Al-Mutaffifin', 1, 36, 30, 59, 587],
  [84, 'سورة الانشقاق', 'Al-Inshiqaq', 'Al-Inshiqaq', 1, 25, 30, 59, 589],
  [85, 'سورة البروج', 'Al-Buruj', 'Al-Buruj', 1, 22, 30, 59, 590],
  [86, 'سورة الطارق', 'At-Tariq', 'At-Tariq', 1, 17, 30, 59, 591],
  [87, 'سورة الأعلى', 'Al-A\'la', 'Al-A\'la', 1, 19, 30, 60, 591],
  [88, 'سورة الغاشية', 'Al-Ghashiyah', 'Al-Ghashiyah', 1, 26, 30, 60, 592],
  [89, 'سورة الفجر', 'Al-Fajr', 'Al-Fajr', 1, 30, 30, 60, 593],
  [90, 'سورة البلد', 'Al-Balad', 'Al-Balad', 1, 20, 30, 60, 594],
  [91, 'سورة الشمس', 'Ash-Shams', 'Ash-Shams', 1, 15, 30, 60, 595],
  [92, 'سورة الليل', 'Al-Layl', 'Al-Layl', 1, 21, 30, 60, 595],
  [93, 'سورة الضحى', 'Ad-Duhaa', 'Ad-Duhaa', 1, 11, 30, 60, 596],
  [94, 'سورة الشرح', 'Ash-Sharh', 'Ash-Sharh', 1, 8, 30, 60, 596],
  [95, 'سورة التين', 'At-Tin', 'At-Tin', 1, 8, 30, 60, 597],
  [96, 'سورة العلق', 'Al-\'Alaq', 'Al-\'Alaq', 1, 19, 30, 60, 597],
  [97, 'سورة القدر', 'Al-Qadr', 'Al-Qadr', 1, 5, 30, 60, 598],
  [98, 'سورة البينة', 'Al-Bayyinah', 'Al-Bayyinah', 0, 8, 30, 60, 598],
  [99, 'سورة الزلزلة', 'Az-Zalzalah', 'Az-Zalzalah', 0, 8, 30, 60, 599],
  [100, 'سورة العاديات', 'Al-\'Adiyat', 'Al-\'Adiyat', 1, 11, 30, 60, 599],
  [101, 'سورة القارعة', 'Al-Qari\'ah', 'Al-Qari\'ah', 1, 11, 30, 60, 600],
  [102, 'سورة التكاثر', 'At-Takathur', 'At-Takathur', 1, 8, 30, 60, 600],
  [103, 'سورة العصر', 'Al-\'Asr', 'Al-\'Asr', 1, 3, 30, 60, 601],
  [104, 'سورة الهمزة', 'Al-Humazah', 'Al-Humazah', 1, 9, 30, 60, 601],
  [105, 'سورة الفيل', 'Al-Fil', 'Al-Fil', 1, 5, 30, 60, 601],
  [106, 'سورة قريش', 'Quraysh', 'Quraysh', 1, 4, 30, 60, 602],
  [107, 'سورة الماعون', 'Al-Ma\'un', 'Al-Ma\'un', 1, 7, 30, 60, 602],
  [108, 'سورة الكوثر', 'Al-Kawthar', 'Al-Kawthar', 1, 3, 30, 60, 602],
  [109, 'سورة الكافرون', 'Al-Kafirun', 'Al-Kafirun', 1, 6, 30, 60, 603],
  [110, 'سورة النصر', 'An-Nasr', 'An-Nasr', 0, 3, 30, 60, 603],
  [111, 'سورة المسد', 'Al-Masad', 'Al-Masad', 1, 5, 30, 60, 603],
  [112, 'سورة الإخلاص', 'Al-Ikhlas', 'Al-Ikhlas', 1, 4, 30, 60, 604],
  [113, 'سورة الفلق', 'Al-Falaq', 'Al-Falaq', 1, 5, 30, 60, 604],
  [114, 'سورة الناس', 'An-Nas', 'An-Nas', 1, 6, 30, 60, 604],
];

export const BUNDLED_VERIFIED_AYAHS: Record<number, AyahEntry[]> = {
  1: [
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
  18: [
    {
      number: 1,
      textAr: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجًا',
      translationEn:
        '[All] praise is [due] to Allah, who has sent down upon His Servant the Book and has not made therein any deviance.',
      translationFr:
        'Louange à Allah qui a fait descendre sur Son serviteur le Livre, et n’y a point introduit de tortuosité [ambiguïté].',
      transliteration:
        'Al-ḥamdu lillāhi allaḏī anzala ʿalā ʿabdihi al-kitāba wa-lam yajʿal lahu ʿiwajā',
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
    {
      number: 6,
      textAr: 'فَلَعَلَّكَ بَاخِعٌ نَّفْسَكَ عَلَىٰ آثَارِهِمْ إِن لَّمْ يُؤْمِنُوا بِهَـٰذَا الْحَدِيثِ أَسَفًا',
      translationEn:
        'Then perhaps you would kill yourself through grief over their footsteps, [O Muhammad], if they do not believe in this message, [and] out of sorrow.',
      translationFr:
        'Tu vas peut-être te consumer de chagrin parce qu’ils se détournent de toi et ne croient pas en ce discours !',
      transliteration: 'Fa-laʿallaka bāḫiʿun nafsaka ʿalā āṯārihim in lam yuʾminū bi-hāḏā al-ḥadīṯi asafā',
    },
    {
      number: 7,
      textAr: 'إِنَّا جَعَلْنَا مَا عَلَى الْأَرْضِ زِينَةً لَّهَا لِنَبْلُوَهُمْ أَيُّهُمْ أَحْسَنُ عَمَلًا',
      translationEn:
        'Indeed, We have made that which is on the earth adornment for it that We may test them [as to] which of them is best in deed.',
      translationFr:
        'Nous avons placé ce qu’il y a sur la terre comme parure pour elle, afin d’éprouver (les hommes et afin de savoir) qui d’entre eux sont les meilleurs dans leurs actions.',
      transliteration: 'Innā jaʿalnā mā ʿalā al-arḍi zīnatan lahā li-nabluwahum ayyuhum aḥsanu ʿamalā',
    },
    {
      number: 8,
      textAr: 'وَإِنَّا لَجَاعِلُونَ مَا عَلَيْهَا صَعِيدًا جُرُزًا',
      translationEn: 'And indeed, We will make that which is upon it [into] a barren ground.',
      translationFr: 'Puis Nous allons sûrement réduire tout ce qui s’y trouve à un sol aride.',
      transliteration: 'Wa-innā la-jāʿilūna mā ʿalayhā ṣaʿīdan juruzā',
    },
    {
      number: 9,
      textAr: 'أَمْ حَسِبْتَ أَنَّ أَصْحَابَ الْكَهْفِ وَالرَّقِيمِ كَانُوا مِنْ آيَاتِنَا عَجَبًا',
      translationEn:
        'Or have you thought that the companions of the cave and the inscription were, among Our signs, a wonder?',
      translationFr:
        'Penses-tu que les gens de la Caverne et d’ar-Raqîm ont constitué une chose extraordinaire d’entre Nos prodiges ?',
      transliteration: 'Am ḥasibta anna aṣḥāba al-kahfi wa-ar-raqīmi kānū min āyātinā ʿajabā',
    },
    {
      number: 10,
      textAr:
        'إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا',
      translationEn:
        '[Mention] when the youths retreated to the cave and said, "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance."',
      translationFr:
        'Quand les jeunes gens se furent réfugiés dans la caverne, ils dirent : « Ô notre Seigneur, donne-nous de Ta part une miséricorde ; et assure-nous la droiture dans tout ce qui nous concerne. »',
      transliteration:
        'Iḏ awā al-fityatu ilā al-kahfi fa-qālū rabbanā ātinā min ladunka raḥmatan wa-hayyiʾ lanā min amrinā rašadā',
    },
  ],
  112: [
    {
      number: 1,
      textAr: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      translationEn: 'Say, "He is Allah, [who is] One,',
      translationFr: 'Dis : « Il est Allah, Unique.',
      transliteration: 'Qul huwa Allāhu aḥad',
    },
    {
      number: 2,
      textAr: 'اللَّهُ الصَّمَدُ',
      translationEn: 'Allah, the Eternal Refuge.',
      translationFr: 'Allah, Le Seul à être imploré pour ce que nous désirons.',
      transliteration: 'Allāhu aṣ-ṣamad',
    },
    {
      number: 3,
      textAr: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
      translationEn: 'He neither begets nor is born,',
      translationFr: 'Il n’a jamais engendré, n’a pas été engendré non plus.',
      transliteration: 'Lam yalid wa-lam yūlad',
    },
    {
      number: 4,
      textAr: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
      translationEn: 'Nor is there to Him any equivalent."',
      translationFr: 'Et nul n’est égal à Lui. »',
      transliteration: 'Wa-lam yakun lahu kufuwan aḥad',
    },
  ],
  113: [
    {
      number: 1,
      textAr: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
      translationEn: 'Say, "I seek refuge in the Lord of daybreak',
      translationFr: 'Dis : « Je cherche protection auprès du Seigneur de l’aube naissante,',
      transliteration: 'Qul aʿūḏu bi-rabbi al-falaq',
    },
    {
      number: 2,
      textAr: 'مِن شَرِّ مَا خَلَقَ',
      translationEn: 'From the evil of that which He created',
      translationFr: 'contre le mal des êtres qu’Il a créés,',
      transliteration: 'Min šarri mā ḫalaq',
    },
    {
      number: 3,
      textAr: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
      translationEn: 'And from the evil of darkness when it settles',
      translationFr: 'contre le mal de l’obscurité quand elle s’approfondit,',
      transliteration: 'Wa-min šarri ġāsiqin iḏā waqab',
    },
    {
      number: 4,
      textAr: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
      translationEn: 'And from the evil of the blowers in knots',
      translationFr: 'contre le mal de celles qui soufflent sur les nœuds,',
      transliteration: 'Wa-min šarri an-naffāṯāti fī al-ʿuqad',
    },
    {
      number: 5,
      textAr: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
      translationEn: 'And from the evil of an envier when he envies."',
      translationFr: 'et contre le mal de l’envieux quand il envie. »',
      transliteration: 'Wa-min šarri ḥāsidin iḏā ḥasad',
    },
  ],
  114: [
    {
      number: 1,
      textAr: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
      translationEn: 'Say, "I seek refuge in the Lord of mankind,',
      translationFr: 'Dis : « Je cherche protection auprès du Seigneur des hommes.',
      transliteration: 'Qul aʿūḏu bi-rabbi an-nās',
    },
    {
      number: 2,
      textAr: 'مَلِكِ النَّاسِ',
      translationEn: 'The Sovereign of mankind,',
      translationFr: 'Le Souverain des hommes,',
      transliteration: 'Maliki an-nās',
    },
    {
      number: 3,
      textAr: 'إِلَـٰهِ النَّاسِ',
      translationEn: 'The God of mankind,',
      translationFr: 'Dieu des hommes,',
      transliteration: 'Ilāhi an-nās',
    },
    {
      number: 4,
      textAr: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
      translationEn: 'From the evil of the retreating whisperer -',
      translationFr: 'contre le mal du mauvais conseiller, furtif,',
      transliteration: 'Min šarri al-waswāsi al-ḫannās',
    },
    {
      number: 5,
      textAr: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
      translationEn: 'Who whispers [evil] into the breasts of mankind -',
      translationFr: 'qui souffle le mal dans les poitrines des hommes,',
      transliteration: 'Allaḏī yuwaswisu fī ṣudūri an-nās',
    },
    {
      number: 6,
      textAr: 'مِنَ الْجِنَّةِ وَالنَّاسِ',
      translationEn: 'From among the jinn and mankind."',
      translationFr: 'qu’il (le conseiller) soit un djinn, ou un être humain. »',
      transliteration: 'Mina al-jinnati wa-an-nās',
    },
  ],
};

export const SURAHS: SurahInfo[] = SURAH_CATALOG_TUPLES.map(
  ([id, nameAr, nameEn, nameFr, isMeccan, totalAyahs, juz, hizb, pageStart]) => ({
    id,
    nameAr,
    nameEn,
    nameFr,
    revelationTypeAr: isMeccan === 1 ? 'مكية' : 'مدنية',
    totalAyahs,
    juz,
    hizb,
    pageStart,
    ayahs: BUNDLED_VERIFIED_AYAHS[id] ?? [],
  }),
);

export function getSurahById(id: number): SurahInfo {
  return SURAHS.find((s) => s.id === id) ?? SURAHS[17] ?? SURAHS[0]!;
}

export function stripLeadingBasmalah(
  surahId: number,
  ayahNumber: number,
  text: string,
): string {
  if (surahId === 1 || surahId === 9 || ayahNumber !== 1) return text;
  const prefixes = [
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
    'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ ',
    'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ',
  ];
  for (const prefix of prefixes) {
    if (text.startsWith(prefix)) {
      return text.slice(prefix.length).trimStart();
    }
  }
  return text;
}

export function getEveryAyahAudioUrl(
  reciter: ReciterId,
  surahId: number,
  ayahNumber: number,
): string {
  const found = RECITERS.find((r) => r.id === reciter) ?? RECITERS[0]!;
  const s = String(surahId).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${found.folder}/${s}${a}.mp3`;
}

export function toArabicDigits(num: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((ch) => digits[Number(ch)] ?? ch)
    .join('');
}
