import type { Locale, Localized } from "@/lib/types";

export type QuizLevel = 1 | 2 | 3;
export const QUIZ_LEVELS: QuizLevel[] = [1, 2, 3];

/** Points per correct answer are multiplied by the level. */
export const LEVEL_MULTIPLIER: Record<QuizLevel, number> = { 1: 1, 2: 2, 3: 3 };

export const LEVEL_NAME: Record<QuizLevel, Localized> = {
  1: { ka: "დაწყებითი", hy: "Սկսնակ", en: "Beginner" },
  2: { ka: "საშუალო", hy: "Միջին", en: "Intermediate" },
  3: { ka: "ექსპერტი", hy: "Փորձագետ", en: "Expert" },
};

export interface QuizQuestion {
  id: string;
  level: QuizLevel;
  /** Index into `options` of the right answer. */
  correct: number;
  prompt: Localized;
  options: Localized[];
  explanation: Localized;
}

const loc = (ka: string, hy: string, en: string): Localized => ({ ka, hy, en });

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ------------------------------------------------------------ Level 1
  {
    id: "b1",
    level: 1,
    correct: 1,
    prompt: loc(
      "სოციალურ ქსელში ათასობით გაზიარების მქონე პოსტი „სასწაულებრივ წამალს“ გვპირდება. რა არის პირველი სწორი ნაბიჯი?",
      "Սոցցանցում հազարավոր կիսումներով գրառումը «հրաշք դեղ» է խոստանում։ Ո՞րն է առաջին ճիշտ քայլը։",
      "A post with thousands of shares promises a “miracle cure”. What is the right first step?",
    ),
    options: [
      loc("გავუზიარო მეგობრებს, რომ გააფრთხილო", "Կիսվել ընկերների հետ՝ նախազգուշացնելու համար", "Share it with friends to warn them"),
      loc("შევამოწმო, ვინ დაწერა და წერს თუ არა ამაზე სანდო მედია", "Ստուգել՝ ով է հեղինակը և գրում են արդյոք վստահելի լրատվամիջոցները", "Check who wrote it and whether credible outlets report the same"),
      loc("ვენდო, რადგან ბევრმა გააზიარა", "Վստահել, քանի որ շատերն են կիսվել", "Trust it because so many people shared it"),
    ],
    explanation: loc(
      "გაზიარებების რაოდენობა სიმართლეს არ ადასტურებს. ჯერ წყარო და დამოუკიდებელი დადასტურება გადაამოწმეთ და მხოლოდ ამის შემდეგ გაუზიარეთ სხვას.",
      "Կիսումների թիվը ճշմարտության ապացույց չէ։ Նախ ստուգեք աղբյուրը և անկախ հաստատումը, հետո միայն կիսվեք։",
      "Share counts prove nothing about accuracy. Check the source and look for independent confirmation first, then decide whether to share.",
    ),
  },
  {
    id: "b2",
    level: 1,
    correct: 0,
    prompt: loc(
      "სათაური: „შოკი! გააზიარე, სანამ წაშლიან!!!“ რომელი ნიშანია ყველაზე საეჭვო?",
      "Վերնագիր․ «Շոկ։ Կիսվիր, մինչև ջնջեն։։։» Ո՞ր նշանն է առավել կասկածելի։",
      "Headline: “SHOCKING! Share before they delete it!!!” Which sign is the biggest red flag?",
    ),
    options: [
      loc("დაჩქარება და ემოციური წნეხი", "Շտապեցումը և հուզական ճնշումը", "Urgency and emotional pressure"),
      loc("სათაურს თარიღი აქვს", "Վերնագիրն ամսաթիվ ունի", "The headline has a date"),
      loc("ტექსტი ქართულადაა დაწერილი", "Տեքստը գրված է հայերեն", "The text is written in my language"),
    ],
    explanation: loc(
      "დეზინფორმაცია ხშირად გვაჩქარებს და გვაშინებს, რომ შესამოწმებლად დრო არ გვქონდეს. სანდო ცნობა არ გვთხოვს „სასწრაფოდ გაზიარებას“.",
      "Ապատեղեկատվությունը հաճախ շտապեցնում և վախեցնում է, որ ստուգելու ժամանակ չունենանք։ Հավաստի հաղորդագրությունը չի պահանջում «անհապաղ կիսվել»։",
      "Disinformation rushes and scares you so you won't have time to check. Reliable reporting never demands that you share immediately.",
    ),
  },
  {
    id: "b3",
    level: 1,
    correct: 2,
    prompt: loc(
      "რისთვის გამოიყენება სურათის უკუძიებნა (reverse image search)?",
      "Ինչի՞ համար է օգտագործվում նկարի հակադարձ որոնումը (reverse image search)։",
      "What is a reverse image search used for?",
    ),
    options: [
      loc("სურათის ხარისხის გასაუმჯობესებლად", "Նկարի որակը բարելավելու համար", "To improve the quality of a photo"),
      loc("სურათზე ადამიანების ასაკის დასადგენად", "Նկարում մարդկանց տարիքը որոշելու համար", "To find out the age of people in a photo"),
      loc("სურათის პირველი გამოჩენის, თარიღისა და წყაროს მოსაძებნად", "Նկարի առաջին հայտնվելը, ամսաթիվը և աղբյուրը գտնելու համար", "To find where and when a photo first appeared"),
    ],
    explanation: loc(
      "Google Images ან TinEye გაჩვენებთ ფოტოს ყველაზე ადრეულ გამოჩენას. ასე ადვილად ვხვდებით, როცა ძველ ფოტოს ახალი წარწერით ავრცელებენ.",
      "Google Images-ը կամ TinEye-ը ցույց են տալիս լուսանկարի ամենավաղ հայտնվելը։ Այդպես հեշտ է բացահայտել, երբ հին նկարը նոր մակագրությամբ են տարածում։",
      "Google Images or TinEye show the earliest known appearance of a photo. It is the quickest way to catch an old picture reshared with a new caption.",
    ),
  },
  {
    id: "b4",
    level: 1,
    correct: 0,
    prompt: loc(
      "ერთსა და იმავე მოვლენაზე ორი პოსტია. A: ასახელებს წყაროს, თარიღსა და ბმულს. B: „ჩემმა ბიძაშვილმა მეგობრისგან გაიგო“. რომელია უფრო სანდო?",
      "Նույն իրադարձության մասին երկու գրառում կա։ A․ նշում է աղբյուրը, ամսաթիվը և հղումը։ B․ «Զարմիկս ընկերոջից լսել է»։ Ո՞րն է ավելի վստահելի։",
      "Two posts cover the same event. A names a source, a date and a link. B says “my cousin heard it from a friend”. Which is more reliable?",
    ),
    options: [
      loc("A — მისი შემოწმება შესაძლებელია", "A՝ այն կարելի է ստուգել", "A — it can be verified"),
      loc("B — პირადი ისტორია უფრო ნამდვილია", "B՝ անձնական պատմությունն ավելի իրական է", "B — a personal story feels more real"),
      loc("ორივე ერთნაირად სანდოა", "Երկուսն էլ հավասարապես վստահելի են", "Both are equally reliable"),
    ],
    explanation: loc(
      "ინფორმაციის ძალა მისი შემოწმებადობაა. წყარო, თარიღი და ბმული საშუალებას გვაძლევს, თავად გადავამოწმოთ. „ვიღაცისგან გაგონილი“ შესამოწმებელი არ არის.",
      "Տեղեկության ուժը նրա ստուգելիությունն է։ Աղբյուրը, ամսաթիվը և հղումը թույլ են տալիս ինքներս ստուգել։ «Ինչ-որ մեկից լսածը» ստուգելի չէ։",
      "Information is only as strong as it is checkable. A source, date and link let you verify it yourself; “somebody heard it” cannot be checked.",
    ),
  },
  {
    id: "b5",
    level: 1,
    correct: 1,
    prompt: loc(
      "საიტი, რომელიც თავს სატირულად აცხადებს, აქვეყნებს: „მთავრობა ორშაბათებს კრძალავს“. რას წარმოადგენს ეს?",
      "Իրեն երգիծական հայտարարող կայքը հրապարակում է․ «Կառավարությունն արգելում է երկուշաբթիները»։ Սա ի՞նչ է։",
      "A site that calls itself satire publishes: “Government to ban Mondays”. What is this?",
    ),
    options: [
      loc("რეალური ახალი ამბავი", "Իրական լուր", "Real news"),
      loc("სატირა, რომელიც კონტექსტის გარეშე გაზიარებისას შეიძლება შეცდომაში შეგვიყვანოს", "Երգիծանք, որը համատեքստից դուրս կիսվելիս կարող է մոլորեցնել", "Satire — a joke that can mislead when shared without context"),
      loc("გატეხილი ანგარიში", "Կոտրված հաշիվ", "A hacked account"),
    ],
    explanation: loc(
      "სატირა დეზინფორმაცია არ არის, მაგრამ ხშირად ჩნდება „ახალი ამბის“ სახით, როცა წარწერა და კონტექსტი იკარგება. გადაამოწმეთ, რას წარმოადგენს საიტი.",
      "Երգիծանքը ապատեղեկատվություն չէ, բայց հաճախ «լուրի» տեսքով է շրջանառվում, երբ կորչում են մակագրությունը և համատեքստը։ Ստուգեք, թե ինչ կայք է դա։",
      "Satire isn't disinformation, but it often circulates as “news” once the label and context are lost. Check what kind of site you are looking at.",
    ),
  },

  // ------------------------------------------------------------ Level 2
  {
    id: "i1",
    level: 2,
    correct: 1,
    prompt: loc(
      "„დღევანდელი“ წყალდიდობის ფოტო სინამდვილეში 2015 წელს გამოჩნდა. როგორ ჰქვია ამ ტექნიკას?",
      "«Այսօրվա» ջրհեղեղի լուսանկարն իրականում հայտնվել է 2015-ին։ Ինչպե՞ս է կոչվում այս տեխնիկան։",
      "A “today’s flood” photo actually appeared in 2015. What is this technique called?",
    ),
    options: [
      loc("დიპფეიკი", "Դիփֆեյք", "A deepfake"),
      loc("ცრუ კონტექსტი: ნამდვილი მედია, არასწორი წარწერა", "Կեղծ համատեքստ՝ իրական նյութ, սխալ մակագրություն", "False context — real media, wrong caption"),
      loc("სატირა", "Երգիծանք", "Satire"),
    ],
    explanation: loc(
      "ეს ყველაზე გავრცელებული ხრიკია: ფოტო ნამდვილია, მაგრამ დრო ან ადგილი სხვაა. ამიტომ მნიშვნელოვანია თარიღისა და ადგილის გადამოწმება.",
      "Սա ամենատարածված հնարքն է. լուսանկարը իրական է, բայց ժամանակը կամ վայրը՝ այլ։ Դրա համար կարևոր է ստուգել ամսաթիվը և վայրը։",
      "This is the most common trick: the photo is genuine, but the time or place is not. Always verify the date and location.",
    ),
  },
  {
    id: "i2",
    level: 2,
    correct: 2,
    prompt: loc(
      "„დანაშაული 200%-ით გაიზარდა!“ — ციფრი 1 შემთხვევიდან 3-მდე ზრდას ეფუძნება. რა აკლია განცხადებას?",
      "«Հանցագործությունն աճել է 200%-ով։» Թիվը հիմնված է 1 դեպքից 3-ի աճի վրա։ Ի՞նչ է պակասում հայտարարությանը։",
      "“Crime is up 200%!” The figure comes from 1 case rising to 3. What is missing?",
    ),
    options: [
      loc("ფერადი დიაგრამა", "Գունավոր գծապատկեր", "A colourful chart"),
      loc("მეტი ემოცია", "Ավելի շատ հույզ", "More emotion"),
      loc("საბაზისო რიცხვი, ნიმუშის ზომა და პერიოდი", "Բազային թիվը, ընտրանքի չափը և ժամանակահատվածը", "The base number, sample size and time period"),
    ],
    explanation: loc(
      "პროცენტი მცირე რიცხვებზე ძალიან დიდად გამოიყურება. ყოველთვის იკითხეთ: რა იყო საწყისი რიცხვი, რამდენი შემთხვევაა და რა პერიოდია აღებული?",
      "Տոկոսը փոքր թվերի դեպքում շատ մեծ է թվում։ Միշտ հարցրեք՝ որն էր սկզբնական թիվը, քանի դեպք կա և ինչ ժամանակահատված է վերցված։",
      "Percentages look huge on tiny numbers. Always ask: what was the starting number, how many cases, and over what period?",
    ),
  },
  {
    id: "i3",
    level: 2,
    correct: 0,
    prompt: loc(
      "სტატია ციტირებს „მაღალჩინოსან ექსპერტს“ სახელის გარეშე. რა არის საუკეთესო მოქმედება?",
      "Հոդվածը մեջբերում է անանուն «բարձրաստիճան փորձագետի»։ Ո՞րն է լավագույն քայլը։",
      "An article quotes “a senior expert” with no name. What is the best move?",
    ),
    options: [
      loc("ვეძებ სახელიან, გადამოწმებად ექსპერტსა და პირველად დოკუმენტს", "Փնտրել անվանական, ստուգելի փորձագետ և առաջնային փաստաթուղթ", "Look for a named, verifiable expert and the primary document"),
      loc("ვიღებ, რადგან „ექსპერტი“ წერია", "Ընդունել, քանի որ գրված է «փորձագետ»", "Accept it — it says “expert”"),
      loc("ვუყურებ, რამდენი ადამიანი კითხულობს სტატიას", "Նայել՝ քանի մարդ է կարդում հոդվածը", "Check how many people read the article"),
    ],
    explanation: loc(
      "უსახელო ავტორიტეტი ვერ გადამოწმდება. სანდო ტექსტი სახელს, თანამდებობასა და პირველად წყაროს — კვლევას ან დოკუმენტს — მიუთითებს.",
      "Անանուն հեղինակությունը չի ստուգվում։ Հավաստի տեքստը նշում է անունը, պաշտոնը և առաջնային աղբյուրը՝ հետազոտությունը կամ փաստաթուղթը։",
      "An anonymous authority can't be checked. Reliable writing names the person, their role and the primary source — the study or document.",
    ),
  },
  {
    id: "i4",
    level: 2,
    correct: 1,
    prompt: loc(
      "უცნობი საიტი „Caucasus Truth Daily“ პროფესიონალურად გამოიყურება. როგორ შევაფასოთ?",
      "Անծանոթ «Caucasus Truth Daily» կայքը պրոֆեսիոնալ տեսք ունի։ Ինչպե՞ս գնահատել։",
      "An unfamiliar site, “Caucasus Truth Daily”, looks very professional. How do you judge it?",
    ),
    options: [
      loc("დიზაინი კარგია, ესეც საკმარისია", "Դիզայնը լավ է, դա բավական է", "The design is good, that is enough"),
      loc("საიტიდან გავდივარ და ვეძებ, რას წერენ მასზე სხვები (ლატერალური კითხვა)", "Դուրս եմ գալիս կայքից և փնտրում, թե ինչ են գրում նրա մասին ուրիշները (կողմնակի ընթերցում)", "Leave the site and search what others say about it (lateral reading)"),
      loc("ვკითხულობ მხოლოდ მათ „ჩვენ შესახებ“ გვერდს", "Կարդում եմ միայն նրանց «Մեր մասին» էջը", "Read only their own “About us” page"),
    ],
    explanation: loc(
      "პროფესიონალური დიზაინი ადვილად იკოპირება. ფაქტ-ჩექერები საიტიდან გადიან და სხვა წყაროებში ამოწმებენ, ვინ დგას მის უკან — ამას ლატერალური კითხვა ჰქვია.",
      "Պրոֆեսիոնալ դիզայնը հեշտ է կրկնօրինակել։ Փաստ-ստուգողները դուրս են գալիս կայքից և այլ աղբյուրներում ստուգում, թե ով է նրա հետևում․ սա կոչվում է կողմնակի ընթերցում։",
      "Polished design is easy to copy. Fact-checkers leave the site and check other sources to see who is behind it — this is called lateral reading.",
    ),
  },
  {
    id: "i5",
    level: 2,
    correct: 2,
    prompt: loc(
      "რომელი ნიშანი მიუთითებს ყველაზე დამაჯერებლად, რომ სურათი AI-ით არის შექმნილი?",
      "Ո՞ր նշանն է ամենահամոզիչ կերպով վկայում, որ նկարը ստեղծվել է AI-ով։",
      "Which sign most strongly suggests an image is AI-generated?",
    ),
    options: [
      loc("მაღალი გარჩევადობა", "Բարձր թույլատրելիություն", "High resolution"),
      loc("შავ-თეთრი ფერები", "Սև ու սպիտակ գույները", "Black-and-white colours"),
      loc("დამახინჯებული თითები და გაურკვეველი წარწერები ფონზე", "Աղավաղված մատներ և անընթեռնելի գրություններ ֆոնին", "Distorted fingers and garbled text in the background"),
    ],
    explanation: loc(
      "გენერატორები ხშირად ცდებიან ხელებში, კბილებში, ანარეკლებსა და ტექსტში. ერთი ნიშანი საკმარისი არ არის, ამიტომ წყაროც შეამოწმეთ.",
      "Գեներատորները հաճախ սխալվում են ձեռքերի, ատամների, արտացոլումների և տեքստի մեջ։ Մեկ նշանը բավական չէ, ուստի ստուգեք նաև աղբյուրը։",
      "Generators often slip on hands, teeth, reflections and text. One sign isn't proof, so check the source too.",
    ),
  },

  // ------------------------------------------------------------ Level 3
  {
    id: "e1",
    level: 3,
    correct: 0,
    prompt: loc(
      "ხედავთ ცნობილი გამოცემის „სტატიის“ სქრინშოტს მკვეთრი განცხადებით. როგორ გადაამოწმოთ?",
      "Տեսնում եք հայտնի պարբերականի «հոդվածի» սքրինշոթ՝ կտրուկ հայտարարությամբ։ Ինչպե՞ս ստուգել։",
      "You see a screenshot of a “headline” from a well-known outlet with a sharp claim. How do you verify it?",
    ),
    options: [
      loc("გამოცემის საიტზე თავად ვეძებ, ან არქივში ვამოწმებ", "Ինքս եմ փնտրում պարբերականի կայքում կամ ստուգում արխիվում", "Search the outlet’s own site or an archive yourself"),
      loc("ვენდობი, რადგან ლოგო ნამდვილია", "Վստահում եմ, քանի որ լոգոն իրական է", "Trust it because the logo looks real"),
      loc("ვეკითხები კომენტარებში მყოფებს", "Հարցնում եմ մեկնաբանություններում", "Ask people in the comments"),
    ],
    explanation: loc(
      "სქრინშოტის გაყალბება წუთებში შეიძლება. თუ ტექსტი ნამდვილია, გამოცემის საიტზე ან არქივში ვიპოვით. თუ ვერ ვპოულობთ, ეს თავისთავად საეჭვოა.",
      "Սքրինշոթը կարելի է կեղծել րոպեների ընթացքում։ Եթե տեքստն իրական է, այն կգտնվի պարբերականի կայքում կամ արխիվում։ Եթե չենք գտնում, դա արդեն կասկածելի է։",
      "A screenshot can be faked in minutes. If it is real, it will exist on the outlet’s site or in an archive; if you can’t find it, that is a warning sign.",
    ),
  },
  {
    id: "e2",
    level: 3,
    correct: 2,
    prompt: loc(
      "გავრცელდა პოლიტიკოსის „ხმოვანი ჩანაწერი“, რომელიც სკანდალურ რამეს ამბობს. გაზიარებამდე რა უნდა გააკეთოთ?",
      "Տարածվել է քաղաքական գործչի «ձայնագրություն», որտեղ նա սկանդալային բան է ասում։ Ի՞նչ անել կիսվելուց առաջ։",
      "An “audio recording” of a politician saying something scandalous is spreading. What should you do before sharing?",
    ),
    options: [
      loc("ყურით მოვუსმენ და თუ ხმა მისია, გავაზიარებ", "Ականջով կլսեմ, և եթե ձայնը նրանն է, կկիսվեմ", "Listen closely and share if it sounds like them"),
      loc("დაველოდები, სანამ ბევრი გააზიარებს", "Կսպասեմ, մինչև շատերը կիսվեն", "Wait until lots of people share it"),
      loc("ვამოწმებ ოფიციალურ არხებსა და სანდო მედიას, ვეძებ ჩანაწერის პირველ წყაროს", "Ստուգում եմ պաշտոնական ալիքները և վստահելի լրատվամիջոցները, փնտրում եմ ձայնագրության առաջին աղբյուրը", "Check official channels and credible outlets, and look for the recording’s first source"),
    ],
    explanation: loc(
      "ხმის კლონირება დღეს იაფი და დამაჯერებელია, ყურით ამოცნობა კი არასანდოა. მთავარია წყარო, კონტექსტი და ოფიციალური დადასტურება ან უარყოფა.",
      "Ձայնի կլոնավորումն այսօր էժան է և համոզիչ, իսկ ականջով ճանաչելը՝ անվստահելի։ Կարևոր են աղբյուրը, համատեքստը և պաշտոնական հաստատումը կամ հերքումը։",
      "Voice cloning is now cheap and convincing, and judging by ear is unreliable. Source, context and official confirmation or denial matter most.",
    ),
  },
  {
    id: "e3",
    level: 3,
    correct: 1,
    prompt: loc(
      "დიაგრამაზე ღერძი 90-დან იწყება და 92% და 95% ძალიან განსხვავებული ჩანს. რა ტექნიკაა ეს?",
      "Գծապատկերում առանցքը սկսվում է 90-ից, և 92%-ն ու 95%-ը շատ տարբեր են թվում։ Ի՞նչ տեխնիկա է սա։",
      "On a chart the axis starts at 90, so 92% and 95% look wildly different. What technique is this?",
    ),
    options: [
      loc("ლოგარითმული შკალა — ნორმალური პრაქტიკაა", "Լոգարիթմական սանդղակ՝ նորմալ պրակտիկա է", "A log scale — perfectly normal"),
      loc("შეკვეცილი ღერძი, რომელიც მცირე სხვაობას გადაჭარბებულად აჩვენებს", "Կտրված առանցք, որը փոքր տարբերությունը չափազանցված է ցույց տալիս", "A truncated axis that exaggerates a small difference"),
      loc("ფერის შეცდომა", "Գույնի սխալ", "A colour error"),
    ],
    explanation: loc(
      "შეკვეცილი ღერძი ვიზუალურად ზრდის სხვაობას. ყოველთვის შეხედეთ, ნულიდან იწყება თუ არა ღერძი და რა ციფრებია მიწერილი.",
      "Կտրված առանցքը տեսողականորեն մեծացնում է տարբերությունը։ Միշտ նայեք՝ առանցքը զրոյից է սկսվում, թե ոչ, և ինչ թվեր են նշված։",
      "A truncated axis visually inflates a gap. Always check whether the axis starts at zero and read the actual numbers.",
    ),
  },
  {
    id: "e4",
    level: 3,
    correct: 1,
    prompt: loc(
      "სტატიაში ყველა ფაქტი ნამდვილია, მაგრამ მნიშვნელოვანი კონტექსტი გამოტოვებულია და მკითხველი ცრუ დასკვნამდე მიდის. როგორ შეაფასებდით?",
      "Հոդվածում բոլոր փաստերը իրական են, բայց կարևոր համատեքստը բաց է թողնված, և ընթերցողը հանգում է կեղծ եզրակացության։ Ինչպե՞ս կգնահատեիք։",
      "Every fact in an article is accurate, but key context is left out and readers reach a false conclusion. How would you rate it?",
    ),
    options: [
      loc("მართალია, რადგან ყველა ფაქტი ზუსტია", "Ճիշտ է, քանի որ բոլոր փաստերը ճշգրիտ են", "True, because every fact is accurate"),
      loc("მანიპულაციური: ზუსტი ფრაგმენტები შეცდომაში შესაყვანადაა დალაგებული", "Մանիպուլյատիվ՝ ճշգրիտ հատվածները դասավորված են մոլորեցնելու համար", "Manipulative — accurate pieces arranged to mislead"),
      loc("ყალბი, რადგან ყველა წინადადება გამოგონილია", "Կեղծ, քանի որ բոլոր նախադասությունները հորինված են", "Fake, because every sentence is invented"),
    ],
    explanation: loc(
      "სწორედ ამიტომ არსებობს TrustLab-ის „მანიპულაციური“ ვერდიქტი: ზუსტი ფაქტებიც შეიძლება შეცდომაში შეგვიყვანოს, თუ კონტექსტი ამოღებულია.",
      "Հենց դրա համար է TrustLab-ում «մանիպուլյատիվ» վճիռը․ ճշգրիտ փաստերն էլ կարող են մոլորեցնել, եթե համատեքստը հանված է։",
      "That is why TrustLab has a “Manipulative” verdict: accurate facts can still mislead when the context is stripped away.",
    ),
  },
  {
    id: "e5",
    level: 3,
    correct: 2,
    prompt: loc(
      "გასულ კვირას შექმნილი 50 ანგარიში წუთებში ერთსა და იმავე ტექსტს აქვეყნებს. რას ნიშნავს ეს?",
      "Անցյալ շաբաթ ստեղծված 50 հաշիվ րոպեների ընթացքում նույն տեքստն է հրապարակում։ Ինչ է սա նշանակում։",
      "50 accounts created last week post identical text within minutes. What does this suggest?",
    ),
    options: [
      loc("ორგანული პოპულარობა — ესე იგი სიმართლეა", "Օրգանական ժողովրդականություն՝ ուրեմն ճշմարիտ է", "Organic popularity, so it must be true"),
      loc("უბრალოდ ტრენდული ჰეშთეგი", "Պարզապես թրենդային հեշթեգ", "Just a trending hashtag"),
      loc("კოორდინირებული არაავთენტური ქცევა: პოპულარობა ხელოვნურადაა შექმნილი", "Համակարգված ոչ իրական վարք՝ ժողովրդականությունը արհեստածին է", "Coordinated inauthentic behaviour — the popularity is manufactured"),
    ],
    explanation: loc(
      "ახალი ანგარიშები, იდენტური ტექსტი და ერთდროულობა ხელოვნური გავრცელების ნიშნებია. ასეთი „პოპულარობა“ სიმართლის მტკიცებულება არ არის. შეატყობინეთ პლატფორმას და მოძებნეთ პირველწყარო.",
      "Նոր հաշիվները, նույնական տեքստը և միաժամանակությունը արհեստածին տարածման նշաններ են։ Այդպիսի «ժողովրդականությունը» ճշմարտության ապացույց չէ։ Զեկուցեք հարթակին և գտեք առաջնային աղբյուրը։",
      "New accounts, identical text and tight timing point to artificial amplification. That kind of “popularity” is no evidence of truth. Report it and find the original source.",
    ),
  },
];

export const QUESTIONS_PER_LEVEL = 5;
export const MAX_CORRECT = QUIZ_QUESTIONS.length;

export type BadgeTier = "apprentice" | "investigator" | "analyst" | "master";

/** By number of correct answers out of all questions. */
export function badgeTierForCorrect(correct: number, total: number): BadgeTier {
  const r = total === 0 ? 0 : correct / total;
  if (r >= 0.9) return "master";
  if (r >= 0.65) return "analyst";
  if (r >= 0.4) return "investigator";
  return "apprentice";
}

/** Streak adds +20% of the base points per consecutive correct answer beyond the first (max +80%). */
export function pointsFor(level: QuizLevel, streakAfterAnswer: number): number {
  const bonus = Math.min(Math.max(streakAfterAnswer - 1, 0), 4) * 0.2;
  return Math.round(10 * LEVEL_MULTIPLIER[level] * (1 + bonus));
}

export const pick = (l: Localized, locale: Locale) => l[locale];
