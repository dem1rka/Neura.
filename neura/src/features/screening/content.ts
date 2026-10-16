export type Text = readonly [string, string, string];
export const txt = (ru: string, kk: string, en: string): Text => [ru, kk, en];
export const domains = {
  communication: txt("Общение и совместная деятельность", "Қарым-қатынас және бірлескен әрекет", "Communication and shared activities"),
  flexibility: txt("Гибкость в повседневных ситуациях", "Күнделікті жағдайларға бейімделу", "Everyday flexibility"),
  sensory: txt("Сенсорная нагрузка", "Сенсорлық жүктеме", "Sensory load"),
  sleep: txt("Сон и восстановление", "Ұйқы және тынығу", "Sleep and rest"),
  attention: txt("Внимание и активность", "Зейін және белсенділік", "Attention and activity"),
  anxiety: txt("Тревога и эмоциональная нагрузка", "Мазасыздық және эмоциялық жүктеме", "Anxiety and emotional load"),
  daily: txt("Повседневные навыки и питание", "Күнделікті дағдылар және тамақтану", "Daily skills and eating"),
};
export type Domain = keyof typeof domains;
export interface Question { id: string; domain: Domain; text: Text }
export interface FormDefinition { id: "social" | "wellbeing"; title: Text; description: Text; questions: Question[] }
export const forms: FormDefinition[] = [
  {
    id: "social",
    title: txt("Общение и поведение", "Қарым-қатынас және мінез-құлық", "Communication and behaviour"),
    description: txt("8 наблюдений о совместной деятельности и изменениях привычного распорядка.", "Бірлескен әрекет пен күн тәртібінің өзгеруі туралы 8 бақылау.", "8 observations about shared activities and changes to routines."),
    questions: [
      { id: "soc1", domain: "communication", text: txt("В совместном занятии ребёнку нужна дополнительная помощь, чтобы по очереди участвовать со взрослым.", "Бірлескен әрекетте балаға ересекпен кезектесіп қатысу үшін қосымша көмек қажет.", "During a shared activity, the child needs extra support to take turns with an adult.") },
      { id: "soc2", domain: "communication", text: txt("Взрослому трудно понять просьбу ребёнка даже с учётом доступных ему слов, жестов или средств коммуникации.", "Бала қолдана алатын сөздерді, ымдарды немесе қарым-қатынас құралдарын ескергенде де, ересекке оның өтінішін түсіну қиын.", "The adult has difficulty understanding the child's request, even taking their available words, gestures or communication aids into account.") },
      { id: "soc3", domain: "communication", text: txt("Чтобы включиться в подходящее по возрасту занятие с другими детьми, ребёнку требуется дополнительная поддержка.", "Өз жасына сай әрекетке басқа балалармен бірге қатысу үшін балаға қосымша қолдау қажет.", "The child needs extra support to join an age-appropriate activity with other children.") },
      { id: "soc4", domain: "communication", text: txt("При обмене впечатлениями ребёнку и взрослому трудно удерживать общую тему, даже используя удобный ребёнку способ общения.", "Балаға ыңғайлы қарым-қатынас тәсілін қолданғанда да, әсерлерімен бөлісу кезінде бала мен ересекке ортақ тақырыпты жалғастыру қиын.", "When sharing experiences, the child and adult struggle to maintain a shared topic even with the child's preferred communication method.") },
      { id: "flex1", domain: "flexibility", text: txt("Небольшое изменение знакомого распорядка вызывает напряжение, которое мешает продолжить день.", "Таныс күн тәртібіндегі шағын өзгеріс күнделікті әрекеттерді жалғастыруға кедергі келтіретін күйзеліс тудырады.", "A small change to a familiar routine causes distress that disrupts the rest of the day.") },
      { id: "flex2", domain: "flexibility", text: txt("Для завершения любимого занятия ребёнку нужна длительная помощь, даже после понятного предупреждения.", "Түсінікті алдын ала ескертуден кейін де, сүйікті әрекетін аяқтау үшін балаға ұзақ көмек қажет.", "The child needs prolonged support to finish a favourite activity, even after a clear advance warning.") },
      { id: "flex3", domain: "flexibility", text: txt("Повторение одного действия занимает столько времени, что мешает другим нужным ребёнку занятиям.", "Бір әрекетті қайталау баланың басқа қажетті істеріне кедергі келтіретіндей көп уақыт алады.", "Repeating one activity takes enough time to interfere with other activities the child needs.") },
      { id: "flex4", domain: "flexibility", text: txt("Когда привычный способ не получается, ребёнку трудно попробовать предложенную безопасную альтернативу.", "Үйреншікті тәсіл нәтиже бермегенде, балаға ұсынылған қауіпсіз баламаны байқап көру қиын.", "When a familiar approach does not work, the child struggles to try a suggested safe alternative.") },
    ],
  },
  {
    id: "wellbeing",
    title: txt("Самочувствие и повседневная жизнь", "Әл-ауқат және күнделікті өмір", "Wellbeing and daily life"),
    description: txt("10 наблюдений о сне, внимании, тревоге, сенсорной нагрузке и бытовых навыках.", "Ұйқы, зейін, мазасыздық, сенсорлық жүктеме және тұрмыстық дағдылар туралы 10 бақылау.", "10 observations about sleep, attention, anxiety, sensory load and daily skills."),
    questions: [
      { id: "sens1", domain: "sensory", text: txt("Шум, свет или прикосновения вызывают дискомфорт, из-за которого ребёнок прерывает обычное занятие.", "Шу, жарық немесе жанасу жайсыздық туғызып, бала әдеттегі әрекетін тоқтатады.", "Noise, light or touch causes discomfort that interrupts an everyday activity.") },
      { id: "sens2", domain: "sensory", text: txt("После насыщенного звуками или людьми места ребёнку нужно много времени, чтобы восстановиться.", "Дыбысы немесе адамы көп жерде болғаннан кейін балаға қалпына келу үшін көп уақыт қажет.", "After visiting a busy or noisy place, the child needs a long time to recover.") },
      { id: "sleep1", domain: "sleep", text: txt("Трудности с засыпанием или ночные пробуждения мешают ребёнку высыпаться.", "Ұйықтап кетудің қиындығы немесе түнде ояну баланың ұйқысын қандыруға кедергі келтіреді.", "Difficulty falling asleep or waking at night prevents the child from getting enough rest.") },
      { id: "sleep2", domain: "sleep", text: txt("Дневная усталость мешает игре, учёбе или привычному общению.", "Күндізгі шаршау ойынға, оқуға немесе әдеттегі қарым-қатынасқа кедергі келтіреді.", "Daytime tiredness interferes with play, learning or usual interactions.") },
      { id: "att1", domain: "attention", text: txt("Ребёнку трудно удержать внимание на коротком посильном задании даже в спокойной обстановке.", "Тыныш ортада да балаға шамасы келетін қысқа тапсырмаға зейінін сақтау қиын.", "The child struggles to focus on a short manageable task, even in a calm setting.") },
      { id: "att2", domain: "attention", text: txt("Потребность постоянно двигаться или действовать сразу мешает безопасному участию в обычных занятиях.", "Үнемі қозғалу немесе бірден әрекет ету қажеттілігі күнделікті істерге қауіпсіз қатысуға кедергі келтіреді.", "A need to move constantly or act immediately interferes with safe participation in everyday activities.") },
      { id: "anx1", domain: "anxiety", text: txt("Ожидание знакомого события вызывает заметное беспокойство и мешает участию в нём.", "Таныс оқиғаны күту айқын мазасыздық тудырып, оған қатысуға кедергі келтіреді.", "Anticipating a familiar event causes noticeable worry that interferes with participation.") },
      { id: "anx2", domain: "anxiety", text: txt("После расстройства ребёнку долго нужна помощь, чтобы вернуться к комфортному состоянию.", "Ренжігеннен кейін балаға өзін жайлы сезіну үшін ұзақ уақыт көмек қажет.", "After becoming upset, the child needs prolonged support to feel comfortable again.") },
      { id: "day1", domain: "daily", text: txt("При одевании, умывании или других освоенных бытовых действиях ребёнку стало нужно больше помощи.", "Киіну, жуыну немесе бұрын меңгерген басқа тұрмыстық әрекеттер кезінде балаға көбірек көмек қажет бола бастады.", "The child has needed more help with dressing, washing or other previously acquired daily skills.") },
      { id: "day2", domain: "daily", text: txt("Ограниченный выбор еды или трудности во время приёма пищи мешают привычному режиму семьи.", "Тағам таңдауының шектеулілігі немесе тамақтану кезіндегі қиындықтар отбасының әдеттегі тәртібіне кедергі келтіреді.", "Limited food choices or difficulties at mealtimes disrupt the family's usual routine.") },
    ],
  },
];
export const options: Text[] = [
  txt("Не наблюдалось", "Байқалмады", "Not observed"),
  txt("Изредка", "Анда-санда", "Occasionally"),
  txt("Часто", "Жиі", "Often"),
  txt("Почти каждый день", "Күн сайын дерлік", "Almost every day"),
  txt("Не знаю / не применимо", "Білмеймін / қолданылмайды", "Unknown / not applicable"),
];
export const allQuestions = forms.flatMap((form) => form.questions);
export const links = {
  mchat: "https://www.mchatscreen.com/mchat-rf/",
  scoring: "https://www.mchatscreen.com/mchat-rf/scoring/",
  mchatRu: "https://www.mchatscreen.com/wp-content/uploads/2019/12/M-CHAT-R_F_Russian_v3.pdf",
  mchatKk: "https://www.mchatscreen.com/wp-content/uploads/2016/12/M-CHAT-R_F_Kazakh.pdf",
  aq: "https://docs.autismresearchcentre.com/tests/AQ10-Child.pdf",
  arc: "https://www.autismresearchcentre.com/research/tests/",
  cast: "https://www.autismresearchcentre.com/tests/childhood-autism-spectrum-test-cast/",
  cdc: "https://www.cdc.gov/autism/diagnosis/index.html",
  age: "https://www.cdc.gov/ncbddd/actearly/autism/curriculum/documents/screening-autism_508.pdf",
};
