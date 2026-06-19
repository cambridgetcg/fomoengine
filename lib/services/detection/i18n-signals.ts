/**
 * i18n-signals.ts — multilingual manipulation detection patterns.
 *
 * Manipulation is global. The shield should be too.
 *
 * This file holds regex signals for every supported language, organised
 * by category (matching the taxonomy CategoryId) and by scam-composite
 * role (impersonation, threat, act-now, isolation). Each language block
 * is self-contained so adding a language never touches existing ones.
 *
 * Design rules (same discipline as the English originals):
 *   - High precision, not recall. False positives erode trust.
 *   - Only patterns a native speaker would recognise as manipulative.
 *   - Unicode-safe regex. No \b word boundaries on CJK (they don't apply).
 *   - One signal per category per language (first match wins per category).
 *
 * Languages covered (by speaker count, top 10 + Cantonese already wired):
 *   zh-Hans  Mandarin Chinese
 *   zh-HK   Cantonese (already in taxonomy.ts — kept here as the canonical home)
 *   es      Spanish
 *   hi      Hindi
 *   ar      Arabic
 *   pt      Portuguese
 *   fr      French
 *   de      German
 *   ja      Japanese
 *   ko      Korean
 *   ru      Russian
 *
 * License intent: CC0 — same as the taxonomy.
 */

import type { CategoryId } from "./taxonomy";

// ── Types ───────────────────────────────────────────────────────────

export interface I18nRegexSignal {
  /** The category this signal maps to. */
  categoryId: CategoryId;
  /** BCP-47 language tag. */
  lang: string;
  /** The regex. Must not use \b for CJK languages. */
  re: RegExp;
  /** Human-readable label for transparency/debugging. */
  label: string;
}

export interface I18nScamSignal {
  /** Which scam-composite role. */
  role: "impersonation" | "threat" | "actNow" | "isolation";
  /** BCP-47 language tag. */
  lang: string;
  /** The regex. */
  re: RegExp;
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * CJK languages can't use \b word boundaries. This flag lets us document
 * which regexes are CJK vs alphabetic-script.
 */
const CJK_LANGS = new Set(["zh-Hans", "zh-HK", "ja", "ko"]);

// ── Category signals by language ───────────────────────────────────

export const I18N_CATEGORY_SIGNALS: I18nRegexSignal[] = [
  // ═══════════════════════════════════════════════════════════════════
  // Mandarin Chinese (zh-Hans)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "zh-Hans", categoryId: "manufactured_urgency", re: /(?:限时|限量|今日截止|即将结束|最后机会|抢购|秒杀|倒计时|最后期限|抢完为止|即将售罄)/, label: "Mandarin urgency phrase" },
  { lang: "zh-Hans", categoryId: "fake_scarcity", re: /(?:仅剩|只剩|库存有限|名额有限|仅剩\d+件|数量有限|售完即止|限量发售|余量不足|即将售完|所剩无几)/, label: "Mandarin scarcity claim" },
  { lang: "zh-Hans", categoryId: "false_exclusivity", re: /(?:专属|尊享|VIP|特邀|仅限邀请|特邀用户|精选|尊贵|会员专享|限定)/, label: "Mandarin exclusivity phrase" },
  { lang: "zh-Hans", categoryId: "fake_social_proof", re: /(?:超过\s*\d[\d,]*\s*(?:万|个)?(?:用户|客户|会员|人).*(?:推荐|选择|使用|信赖)|好评如潮|万人推荐|热销|爆款|大家都.*(?:买|用|选)|销量第一)/, label: "Mandarin social proof claim" },
  { lang: "zh-Hans", categoryId: "confirmshaming", re: /(?:确定要(?:取消|退出|离开)吗|大多数用户.*(?:选择|继续|保留|不会)|真的要.*(?:放弃|拒绝|取消)吗)/, label: "Mandarin confirmshaming" },
  { lang: "zh-Hans", categoryId: "forced_continuity", re: /(?:免费试用|免费体验.*(?:续费|扣费|自动续费)|到期自动续费|首月免费.*续费|取消续费.*联系客服|无法.*取消|取消.*复杂)/, label: "Mandarin forced continuity" },
  { lang: "zh-Hans", categoryId: "drip_pricing", re: /(?:额外费用|税费.*结算.*显示|附加费|服务费.*另计|到手价.*不含.*税|最终价格.*结算.*确定)/, label: "Mandarin drip pricing" },

  // ═══════════════════════════════════════════════════════════════════
  // Cantonese (zh-HK) — canonical home moved here from taxonomy.ts
  // ═══════════════════════════════════════════════════════════════════
  { lang: "zh-HK", categoryId: "manufactured_urgency", re: /(?:今日|即日|限期|截止|最後|最後機會|限時|最後期限|最後召集|緊急|即時|即刻|馬上|盡快|從速)/, label: "Cantonese urgency phrase" },
  { lang: "zh-HK", categoryId: "fake_scarcity", re: /(?:得返|剩低|淨返|得番)\s*\d+\s*(?:個|名額|位|份|張|件)?|售完即止|賣完即止|數量有限|名額有限|限量發售|好快賣晒|好快冇㗎|趁仲有|趁早/, label: "Cantonese scarcity claim" },
  { lang: "zh-HK", categoryId: "fake_social_proof", re: /(?:超過|超過)\s*\d[,\d]*\s*(?:個|名|位).*(?:用家|用戶|會員|客戶)|人人都用|個個都讚|萬人推薦|全城熱捧|街坊力推/, label: "Cantonese social proof claim" },
  { lang: "zh-HK", categoryId: "confirmshaming", re: /(?:唔好意思|真係唔好意思).*(?:取消|退訂|拒絕|唔要)|(?:確定要|真係要).*(?:取消|離開|退出)/, label: "Cantonese confirmshaming" },

  // ═══════════════════════════════════════════════════════════════════
  // Spanish (es)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "es", categoryId: "manufactured_urgency", re: /\b(?:oferta por tiempo limitado|última oportunidad|¡urgente|comprar ya|no te lo pierdas|se acaba hoy|termina hoy|sólo hoy|por tiempo limitado|últimas unidades|fecha límite|oferta termina|aprovéchalo ya|no esperes más)\b/i, label: "Spanish urgency phrase" },
  { lang: "es", categoryId: "fake_scarcity", re: /\b(?:sólo quedan|solo quedan|últimas?\s+\d+\s+(?:unidades|piezas|plazas|lugares|disponibles)|stock limitado|agotando|se agota|poca disponibilidad|limitado|número limitado)\b/i, label: "Spanish scarcity claim" },
  { lang: "es", categoryId: "false_exclusivity", re: /\b(?:exclusivo|exclusiva|sólo para ti|solo para ti|invitación exclusiva|VIP|acceso privilegiado|elegido|seleccionado especialmente|miembros únicamente)\b/i, label: "Spanish exclusivity phrase" },
  { lang: "es", categoryId: "fake_social_proof", re: /\b(?:\d[\d.]*\s*(?:mil|mil+)?\s*(?:usuarios|clientes|personas|miembros)\s+(?:satisfechos|felices|confían|recomiendan|han elegido|prefieren)|todo el mundo lo (?:usa|compra|recomienda)|millones de clientes)\b/i, label: "Spanish social proof claim" },
  { lang: "es", categoryId: "confirmshaming", re: /\b(?:no gracias.{0,20}(?:prefiero|me gusta|no quiero).*(?:perder|pagar|gastar)|seguro que quieres.{0,20}(?:cancelar|salir|renunciar)|la mayoría de personas en tu situación)\b/i, label: "Spanish confirmshaming" },
  { lang: "es", categoryId: "forced_continuity", re: /\b(?:prueba gratis|prueba gratuita|cancela cuando quieras|se (?:renueva|cobrará).*(?:mensual|automátic|recurrente)|suscripción automática)\b/i, label: "Spanish forced continuity" },
  { lang: "es", categoryId: "drip_pricing", re: /\b(?:\+?\s*(?:impuestos|gastos|gastos de envío|tasas|cargos).*(?:checkout|final|al pagar|no incluid?os)|precio final.*(calcula|muestra|aplica).*(?:checkout|final)|cargo.*(?:servicio|procesamiento|reserva))\b/i, label: "Spanish drip pricing" },

  // ═══════════════════════════════════════════════════════════════════
  // Hindi (hi)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "hi", categoryId: "manufactured_urgency", re: /(?:सीमित समय|अंतिम अवसर|आज ही खरीदें|मत खोना|अंतिम तिथि|जल्दी करें|कल नहीं|सिर्फ आज|अभी ऑर्डर करें|समय समाप्त)/, label: "Hindi urgency phrase" },
  { lang: "hi", categoryId: "fake_scarcity", re: /(?:केवल|सिर्फ)\s+\d+\s*(?:बचे|उपलब्ध|स्टॉक)|सीमित स्टॉक|सीमित संख्या|जल्दी खत्म हो रहा|बचे हुए|अंतिम चंद/, label: "Hindi scarcity claim" },
  { lang: "hi", categoryId: "false_exclusivity", re: /(?:विशेष|केवल आपके लिए|वीआईपी|विशेष आमंत्रण|चुने हुए|विशेष सदस्य|केवल आमंत्रित)/, label: "Hindi exclusivity phrase" },
  { lang: "hi", categoryId: "fake_social_proof", re: /(?:\d[\d,]*\s*(?:हज़ार|लाख|करोड़)?\s*(?:ग्राहक|उपयोगकर्ता|लोग|सदस्य).*(?:खुश|संतुष्ट|भरोसा|चुनते|सिफारिश)|हर कोई.*(खरीदता|उपयोग करता|चुनता)|लाखों ग्राहक)/, label: "Hindi social proof claim" },
  { lang: "hi", categoryId: "confirmshaming", re: /(?:आप सच में.{0,20}(?:रद्द|छोड़ना|नहीं चाहते)|अधिकांश लोग.*(चुनते|रहते|जारी रखते)|निश्चित हैं\?)/, label: "Hindi confirmshaming" },
  { lang: "hi", categoryId: "forced_continuity", re: /(?:मुफ्त परीक्षण|मुफ्त ट्रायल|जब चाहें रद्द करें|स्वतः नवीनीकरण|मासिक शुल्क|अपने आप बिल)/, label: "Hindi forced continuity" },

  // ═══════════════════════════════════════════════════════════════════
  // Arabic (ar)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "ar", categoryId: "manufactured_urgency", re: /(?:عرض لفترة محدودة|آخر فرصة|اشترِ الآن|لا تفوّت|ينتهي اليوم|لفترة محدودة|عاجل|سارع|قبل فوات الأوان|آخر يوم|العرض ينتهي)/, label: "Arabic urgency phrase" },
  { lang: "ar", categoryId: "fake_scarcity", re: /(?:متبقي|باقي)\s*\d+\s*(?:قطع|قطعة|منتج|حجز|مقعد)|كمية محدودة|عدد محدود|نفدت الكميات|على وشك النفاد|محدود/, label: "Arabic scarcity claim" },
  { lang: "ar", categoryId: "false_exclusivity", re: /(?:حصري|للكبار فقط|بدعوة فقط|مميز|منتقى خصيصا|كبار الشخصيات|عضوية خاصة|خاص بك)/, label: "Arabic exclusivity phrase" },
  { lang: "ar", categoryId: "fake_social_proof", re: /(?:\d[\d,]*\s*(?:ألف|مليون)?\s*(?:عميل|مستخدم|شخص).*(?:سعيد|راضٍ|يثق|يختار|ينصح)|الجميع.*(?:يشتري|يستخدم|ينصح)|ملايين العملاء)/, label: "Arabic social proof claim" },
  { lang: "ar", categoryId: "confirmshaming", re: /(?:هل أنت متأكد.{0,20}(?:إلغاء|خروج|رفض)|معظم الناس.*(يختارون|يستمرون|لا يلغون)|لا شكرا.{0,20}أفضل)/, label: "Arabic confirmshaming" },
  { lang: "ar", categoryId: "forced_continuity", re: /(?:تجربة مجانية|إلغاء في أي وقت|تجديد تلقائي|اشتراك شهري|رسوم متكررة|تلقائيا)/, label: "Arabic forced continuity" },

  // ═══════════════════════════════════════════════════════════════════
  // Portuguese (pt)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "pt", categoryId: "manufactured_urgency", re: /\b(?:oferta por tempo limitado|última chance|compre agora|não perca|termina hoje|só hoje|últimas horas|corra|antes que acabe|último dia|oferta relâmpago)\b/i, label: "Portuguese urgency phrase" },
  { lang: "pt", categoryId: "fake_scarcity", re: /\b(?:só (?:restam|têm)\s+\d+|últimas?\s+\d+\s+(?:unidades|vagas|lugares|peças)|estoque limitado|acabando|quantidade limitada|esgotando)\b/i, label: "Portuguese scarcity claim" },
  { lang: "pt", categoryId: "false_exclusivity", re: /\b(?:exclusivo|exclusiva|só para você|convite exclusivo|VIP|acesso privilegiado|escolhido especialmente|membros apenas|selecionado)\b/i, label: "Portuguese exclusivity phrase" },
  { lang: "pt", categoryId: "fake_social_proof", re: /\b(?:\d[\d.]*\s*(?:mil|milhões?)?\s*(?:usuários|clientes|pessoas|membros)\s+(?:satisfeitos|felizes|confiam|escolheram|recomendam)|todo mundo (?:usa|compra|recomenda))\b/i, label: "Portuguese social proof claim" },
  { lang: "pt", categoryId: "confirmshaming", re: /\b(?:tem certeza.{0,20}(?:cancelar|sair|desistir)|a maioria.*(?:escolhe|continua|fica)|não obrigado.{0,20}(?:prefiro|gosto))\b/i, label: "Portuguese confirmshaming" },
  { lang: "pt", categoryId: "forced_continuity", re: /\b(?:teste grátis|teste gratuito|cancele quando quiser|renovação automática|cobrança mensal|assinatura automática|renova sozinho)\b/i, label: "Portuguese forced continuity" },
  { lang: "pt", categoryId: "drip_pricing", re: /\b(?:\+?\s*(?:taxas|impostos|frete|encargos|taxas de serviço).*(?:checkout|final|no pagamento|não incluíd)|preço final.*(calcula|mostra).*(?:checkout|final))\b/i, label: "Portuguese drip pricing" },

  // ═══════════════════════════════════════════════════════════════════
  // French (fr)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "fr", categoryId: "manufactured_urgency", re: /\b(?:offre à durée limitée|dernière chance|achetez maintenant|ne manquez pas|se termine aujourd|hui|aujourd'hui seulement|plus que|dépêchez|avant que ça ne finisse|dernier jour)\b/i, label: "French urgency phrase" },
  { lang: "fr", categoryId: "fake_scarcity", re: /\b(?:plus que\s+\d+\s+(?:en stock|disponibles|exemplaires|places)|stock limité|quantité limitée|en rupture|se vend vite|bientôt épuisé)\b/i, label: "French scarcity claim" },
  { lang: "fr", categoryId: "false_exclusivity", re: /\b(?:exclusif|exclusive|rien que pour vous|sur invitation|VIP|accès privilégié|sélectionné spécialement|membres uniquement|élu)\b/i, label: "French exclusivity phrase" },
  { lang: "fr", categoryId: "fake_social_proof", re: /\b(?:\d[\d.]*\s*(?:milliers|millions)?\s*(?:utilisateurs|clients|personnes|membres)\s+(?:satisfaits|heureux|font confiance|ont choisi|recommandent)|tout le monde (?:utilise|achète|recommande))\b/i, label: "French social proof claim" },
  { lang: "fr", categoryId: "confirmshaming", re: /\b(?:êtes-vous sûr.{0,20}(?:annuler|partir|refuser)|la plupart des gens.*(?:choisissent|continuent|restent)|non merci.{0,20}(?:préfère|j'aime))\b/i, label: "French confirmshaming" },
  { lang: "fr", categoryId: "forced_continuity", re: /\b(?:essai gratuit|annulez quand vous voulez|renouvellement automatique|facturation mensuelle|abonnement automatique)\b/i, label: "French forced continuity" },
  { lang: "fr", categoryId: "drip_pricing", re: /\b(?:\+?\s*(?:taxes|frais|frais de livraison|frais de service).*(?:checkout|caisse|final|au paiement|non inclus)|prix final.*(calculé|affiché).*(?:caisse|checkout))\b/i, label: "French drip pricing" },

  // ═══════════════════════════════════════════════════════════════════
  // German (de)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "de", categoryId: "manufactured_urgency", re: /\b(?:zeitbegrenztes Angebot|letzte Chance|jetzt kaufen|nicht verpassen|endet heute|nur heute|letzter Tag|schnell|beeilen Sie|vorbei ist|befristet)\b/i, label: "German urgency phrase" },
  { lang: "de", categoryId: "fake_scarcity", re: /\b(?:nur noch\s+\d+\s+(?:auf Lager|verfügbar|Stücke|Plätze)|begrenzter Vorrat|begrenzte Anzahl|fast ausverkauft|wird knapp|limitiert)\b/i, label: "German scarcity claim" },
  { lang: "de", categoryId: "false_exclusivity", re: /\b(?:exklusiv|nur für Sie|auf Einladung|VIP|privilegierter Zugang|ausgewählt|nur für Mitglieder|auserwählt)\b/i, label: "German exclusivity phrase" },
  { lang: "de", categoryId: "fake_social_proof", re: /\b(?:\d[\d.]*\s*(?:tausend|millionen)?\s*(?:Nutzer|Kunden|Personen|Mitglieder)\s+(?:zufrieden|glücklich|vertrauen|haben gewählt|empfehlen)|jeder (?:nutzt|kauft|empfiehlt))\b/i, label: "German social proof claim" },
  { lang: "de", categoryId: "confirmshaming", re: /\b(?:sind Sie sicher.{0,20}(?:abbrechen|verlassen|ablehnen)|die meisten Leute.*(wählen|bleiben|weitermachen)|nein danke.{0,20}(?:lieber|bevorzuge))\b/i, label: "German confirmshaming" },
  { lang: "de", categoryId: "forced_continuity", re: /\b(?:kostenlose Testphase|jederzeit kündbar|automatische Verlängerung|monatliche Abbuchung|automatisches Abo)\b/i, label: "German forced continuity" },
  { lang: "de", categoryId: "drip_pricing", re: /\b(?:\+?\s*(?:Steuern|Gebühren|Versand|Servicegebühr).*(?:Checkout|Ende|Bezahlung|nicht enthalten)|Endpreis.*(berechnet|angezeigt).*(?:Checkout|Kasse))\b/i, label: "German drip pricing" },

  // ═══════════════════════════════════════════════════════════════════
  // Japanese (ja)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "ja", categoryId: "manufactured_urgency", re: /(?:期間限定|最後のチャンス|今すぐ購入|お見逃しなく|本日終了|本日限定|残りわずか|急いで|お早めに|最終日|あと\d+時間)/, label: "Japanese urgency phrase" },
  { lang: "ja", categoryId: "fake_scarcity", re: /(?:残り\s*\d+\s*(?:個|点|名|席)|在庫わずか|在庫限定|数量限定|残りわずか|売切れ間近|あと少し)/, label: "Japanese scarcity claim" },
  { lang: "ja", categoryId: "false_exclusivity", re: /(?:会員限定|限定|招待制|VIP|特別会員|選ばれた方|あなた限定|プレミアム)/, label: "Japanese exclusivity phrase" },
  { lang: "ja", categoryId: "fake_social_proof", re: /(?:\d[\d,]*\s*(?:万人|千人|人).*?(?:選んだ|おすすめ|信頼|満足|利用)|みんなが(?:使って|買って|選んで)|人気No\.?\s*1|売れ筋|ランキング第\d+位)/, label: "Japanese social proof claim" },
  { lang: "ja", categoryId: "confirmshaming", re: /(?:本当に(?:退会|解約|キャンセル)しますか|ほとんどの方が.*(?:継続|選択|残る)|やめますか)/, label: "Japanese confirmshaming" },
  { lang: "ja", categoryId: "forced_continuity", re: /(?:無料体験|無料お試し|いつでも解約|自動更新|月額|継続課金|自動継続)/, label: "Japanese forced continuity" },
  { lang: "ja", categoryId: "drip_pricing", re: /(?:別途(?:消費税|送料|手数料|料金)|税込価格は.*(?:お支払い|レジ|確定).*(?:画面|時に)|最終価格.*(?:レジ|確定))/, label: "Japanese drip pricing" },

  // ═══════════════════════════════════════════════════════════════════
  // Korean (ko)
  // ═══════════════════════════════════════════════════════════════════
  { lang: "ko", categoryId: "manufactured_urgency", re: /(?:한정|마지막 기회|지금 구매|놓치지 마세요|오늘까지만|마감 임박|서둘러|한정 시간|종료 임박|마감)/, label: "Korean urgency phrase" },
  { lang: "ko", categoryId: "fake_scarcity", re: /(?:\d+\s*(?:개|명|좌석|종).*(?:남음|마감|한정)|재고 한정|수량 한정|품절 임박|소진|남은 수량)/, label: "Korean scarcity claim" },
  { lang: "ko", categoryId: "false_exclusivity", re: /(?:회원 전용|초대|VIP|특별 회원|선택받은|멤버십|프리미엄|회원 한정)/, label: "Korean exclusivity phrase" },
  { lang: "ko", categoryId: "fake_social_proof", re: /(?:\d[\d,]*\s*(?:만명|천명|명)?\s*(?:고객|사용자|회원).*(?:추천|만족|선택|신뢰)|다들.*(쓰고|사고|선택)|인기\s*1\s*위)/, label: "Korean social proof claim" },
  { lang: "ko", categoryId: "confirmshaming", re: /(?:정말.{0,20}(?:취소|탈퇴|거절)|대부분의 사람들.*(선택|계속|남)|정말 하시겠습니까)/, label: "Korean confirmshaming" },
  { lang: "ko", categoryId: "forced_continuity", re: /(?:무료 체험|언제든 취소|자동 갱신|월 구독|자동 결제|정기 결제)/, label: "Korean forced continuity" },

  // ═══════════════════════════════════════════════════════════════════
  // Russian (ru) — \b doesn't work well with Cyrillic; use non-boundary patterns
  // ═══════════════════════════════════════════════════════════════════
  { lang: "ru", categoryId: "manufactured_urgency", re: /(?:ограниченн(?:ое|ая)\s+(?:предложение|акция)|последний\s+шанс|купите\s+сейчас|не\s+упустите|заканчивается\s+сегодня|только\s+сегодня|последний\s+день|успейте|поторопитесь|срочно|срочное\s+предложение)/i, label: "Russian urgency phrase" },
  { lang: "ru", categoryId: "fake_scarcity", re: /(?:осталось\s+(?:только\s+)?\d+|последние\s+\d+\s*(?:шт|мест|экземпляра)|ограниченн(?:ый|ое)\s+(?:запас|количество)|заканчивается|раскупают|всего\s+\d+\s*(?:шт|мест|экземпляра|осталось))/i, label: "Russian scarcity claim" },
  { lang: "ru", categoryId: "false_exclusivity", re: /(?:эксклюзивно|только для вас|по приглашению|VIP|привилегированный|избран(?:ный|ники)|только для участников)/i, label: "Russian exclusivity phrase" },
  { lang: "ru", categoryId: "fake_social_proof", re: /(?:\d[\d.]*(?:\s*(?:тысяч|миллионов|млн|тыс))?\.?\s*(?:пользователей|клиентов|человек|пользователя).*(?:довольны|счастливы|доверяют|выбрали|рекомендуют)|более\s+\d[\d.]*\s*(?:тысяч|млн|миллионов)?\s*(?:довольных|счастливых)?\s*(?:клиентов|пользователей)|все\s+(?:покупают|используют|рекомендуют))/i, label: "Russian social proof claim" },
  { lang: "ru", categoryId: "confirmshaming", re: /(?:вы уверены.{0,20}(?:отменить|выйти|отказаться)|большинство\s+(?:людей|пользователей).*(?:выбирают|остаются|продолжают)|нет спасибо.{0,20}(?:предпочитаю))/i, label: "Russian confirmshaming" },
  { lang: "ru", categoryId: "forced_continuity", re: /(?:бесплатный пробный период|отменить в любой момент|автоматическое продление|ежемесячная оплата|подписка автоматически|бесплатно.*(?:период|неделю|месяц).*продл)/i, label: "Russian forced continuity" },
  { lang: "ru", categoryId: "drip_pricing", re: /(?:\+?\s*(?:налоги|сборы|доставка|комиссия).*(?:оформление|конце|оплаты|не включены)|итоговая цена.*(рассчитывается|показывается).*(?:оформление|оплаты))/i, label: "Russian drip pricing" },
];

// ── Scam-composite signals by language ─────────────────────────────

export const I18N_SCAM_SIGNALS: I18nScamSignal[] = [
  // Mandarin Chinese
  { lang: "zh-Hans", role: "impersonation", re: /(微软|苹果|谷歌|亚马逊|银行|海关|入境|税务局|政府|技术支持|客服|安全中心|反洗钱|警察)/ },
  { lang: "zh-Hans", role: "threat", re: /(中毒|感染|被黑|被入侵|账号已被暂停|已暂停|被冻结|停用|永久停用|异常活动|可疑活动|未经授权|法律行动|逮捕|遣返|欠款|逾期|最后通知|立即验证|账号.*(?:关闭|终止|停用|限制|封锁))/ },
  { lang: "zh-Hans", role: "actNow", re: /(立即致电|马上打电话|立即联系|尽快联系|点击.*链接|发送.*验证码|转账|汇款|缴费|致电.*\d)/ },
  { lang: "zh-Hans", role: "isolation", re: /(不要告诉.*人|不要.*通知|保密|保持秘密|不要报警|不要联系银行|自己处理|只有你知道)/ },

  // Cantonese (already in regex.service.ts — canonical here too)
  { lang: "zh-HK", role: "impersonation", re: /(微軟|蘋果|谷歌|亞馬遜|PayPal|Netflix|銀行|海關|入境處|入境局|稅務局|政府|社交安全|技術支援|客服|帳戶安全中心|反洗錢中心|警方|海關人員)/ },
  { lang: "zh-HK", role: "threat", re: /(中毒|感染|被駭|被入侵|被暫停|已暫停|被凍結|已被凍結|停用|永久停用|異常活動|可疑活動|非法登入|未經授權|法律行動|逮捕|遞解出境|欠款|逾期|最後通知|立即驗證|帳戶.*(?:關閉|終止|停用|限制|封鎖))/ },
  { lang: "zh-HK", role: "actNow", re: /(即刻致電|馬上打電話|立即聯絡|盡快聯絡|點擊.*連結|按下.*按鈕|發送.*驗證碼|轉賬|匯款|俾錢|繳費|致電.*\d)/ },
  { lang: "zh-HK", role: "isolation", re: /(唔好話俾.*知|唔好同.*講|唔好通知|保密|保持秘密|唔好報警|唔好聯絡銀行|自己處理|淨係你知)/ },

  // Spanish
  { lang: "es", role: "impersonation", re: /\b(?:microsoft|apple|google|amazon|paypal|netflix|banco|hacienda|seguridad social|gobierno|soporte técnico|servicio al cliente|seguridad de la cuenta|policía|aduana)\b/i },
  { lang: "es", role: "threat", re: /\b(?:virus|infectado|hackeado|comprometido|suspendido|bloqueado|congelado|desactivado|actividad sospechosa|acceso no autorizado|acción legal|arresto|deportación|deuda|vencido|último aviso|verifique (?:su )?(?:cuenta|identidad) (?:ahora|inmediatamente))\b/i },
  { lang: "es", role: "actNow", re: /\b(?:llame (?:a |al )?(?:este número|ahora|inmediatamente)|(?:llame|marque|envíe)\s+(?:a\s+)?(?:\+?\d|\(\d)[\d().\s-]{5,}\d|haga clic (?:aquí|en el enlace)|envíe (?:el )?(?:código|tarjeta de regalo|cripto|pago)|transfiera (?:el )?(?:dinero|fondos))\b/i },
  { lang: "es", role: "isolation", re: /\b(?:(?:no |nunca)\s+(?:diga|comparta|informe|contacte)\s+(?:a nadie|a su familia|al banco|a la policía)|no le diga a nadie|mantenga esto (?:en secreto|privado|confidencial)|es un secreto|actúe solo)\b/i },

  // Hindi
  { lang: "hi", role: "impersonation", re: /(?:माइक्रोसॉफ्ट|एप्पल|गूगल|अमेज़न|पेपैल|नेटफ्लिक्स|बैंक|सरकार|कर विभाग|तकनीकी सहायता|ग्राहक सेवा|पुलिस|सुरक्षा|खाता सुरक्षा)/ },
  { lang: "hi", role: "threat", re: /(?:वायरस|संक्रमित|हैक|हैक्ड|निलंबित|बंद|अवरुद्ध|असामान्य गतिविधि|अनधिकृत|कानूनी कार्रवाई|गिरफ्तारी|देश निकाला|बकाया|अंतिम नोटिस|तुरंत सत्यापित करें|खाता.*(?:बंद|समाप्त|निलंबित|प्रतिबंधित))/ },
  { lang: "hi", role: "actNow", re: /(?:तुरंत कॉल करें|अभी फोन करें|तुरंत संपर्क करें|लिंक पर क्लिक|कोड भेजें|पैसे ट्रांसफर|धनराशि भेजें|फोन.*\d)/ },
  { lang: "hi", role: "isolation", re: /(?:किसी को न बताएं|किसी को न बताओ|गुप्त रखें|पुलिस को न बताएं|बैंक को सूचित न करें|अकेले ही करें)/ },

  // Arabic
  { lang: "ar", role: "impersonation", re: /(?:مايكروسوفت|آبل|جوجل|أمازون|باي بال|نتفليكس|البنك|الحكومة|الضرائب|الدعم الفني|خدمة العملاء|الشرطة|الأمن|حساب الأمن)/ },
  { lang: "ar", role: "threat", re: /(?:فيروس|مصاب|مخترق|موقوف|مجمد|معطل|نشاط مشبوه|دخول غير مصرح|إجراء قانوني|اعتقال|ترحيل|ديون|متأخر|إشعار أخير|تحقق الآن|الحساب.*(?:مغلق|موقوف|معطل|مقيد))/ },
  { lang: "ar", role: "actNow", re: /(?:اتصل فورا|اتصل الآن|تواصل الآن|اضغط على الرابط|أرسل الرمز|حول المال|أرسل المبلغ|اتصل.*\d)/ },
  { lang: "ar", role: "isolation", re: /(?:لا تخبر أحدا|لا تشارك.*مع أحد|احفظ السر|سر تام|لا تخبر الشرطة|لا تتواصل مع البنك|تصرف وحدك)/ },

  // Portuguese
  { lang: "pt", role: "impersonation", re: /\b(?:microsoft|apple|google|amazon|paypal|netflix|banco|receita federal|segurança social|governo|suporte técnico|serviço ao cliente|polícia|alfândega)\b/i },
  { lang: "pt", role: "threat", re: /\b(?:vírus|infectado|hackerado|comprometido|suspenso|bloqueado|congelado|desativado|atividade suspeita|acesso não autorizado|ação legal|prisão|deportação|dívida|vencido|último aviso|verifique (?:sua )?(?:conta|identidade) (?:agora|imediatamente))\b/i },
  { lang: "pt", role: "actNow", re: /\b(?:ligue (?:para |para o )?(?:este número|agora|imediatamente)|(?:ligue|disque|envie)\s+(?:para\s+)?(?:\+?\d|\(\d)[\d().\s-]{5,}\d|clique (?:aqui|no link)|envie (?:o )?(?:código|cartão presente|cripto|pagamento)|transfira (?:o )?(?:dinheiro|fundos))\b/i },
  { lang: "pt", role: "isolation", re: /\b(?:(?:não |nunca)\s+(?:diga|compartilhe|informe|contate)\s+(?:a ninguém|à sua família|ao banco|à polícia)|não conte a ninguém|mantenha (?:em segredo|privado|confidencial)|é um segredo)\b/i },

  // French
  { lang: "fr", role: "impersonation", re: /\b(?:microsoft|apple|google|amazon|paypal|netflix|votre banque|impôts|sécurité sociale|gouvernement|support technique|service client|police|douane)\b/i },
  { lang: "fr", role: "threat", re: /\b(?:virus|infecté|piraté|compromis|suspendu|bloqué|gelé|désactivé|activité suspecte|accès non autorisé|poursuites|arrestation|expulsion|dette|en retard|dernier avis|vérifiez (?:votre )?(?:compte|identité) (?:maintenant|immédiatement))\b/i },
  { lang: "fr", role: "actNow", re: /\b(?:appelez (?:ce numéro|maintenant|immédiatement)|(?:appelez|composez|envoyez)\s+(?:au\s+)?(?:\+?\d|\(\d)[\d().\s-]{5,}\d|cliquez (?:ici|sur le lien)|envoyez (?:le )?(?:code|carte cadeau|crypto|paiement)|transférez (?:l['’]?)?(?:argent|fonds))\b/i },
  { lang: "fr", role: "isolation", re: /\b(?:(?:ne |n['’])(?:dites|partagez|informez|contactez)\s+(?:personne|à votre famille|à la banque|à la police)|ne le dites à personne|gardez (?:le secret|privé|confidentiel)|c['']est un secret)\b/i },

  // German
  { lang: "de", role: "impersonation", re: /\b(?:microsoft|apple|google|amazon|paypal|netflix|Ihre Bank|Finanzamt|Sozialamt|Regierung|Technischer Support|Kundenservice|Polizei|Zoll)\b/i },
  { lang: "de", role: "threat", re: /\b(?:Virus|infiziert|gehackt|kompromittiert|gesperrt|eingefroren|deaktiviert|verdächtige Aktivität|unautorisierter Zugriff|rechtliche Schritte|Festnahme|Abschiebung|Schulden|überfällig|letzte Warnung|bestätigen Sie (?:Ihr )?(?:Konto|Identität) (?:jetzt|sofort))\b/i },
  { lang: "de", role: "actNow", re: /\b(?:rufen Sie (?:diese Nummer|jetzt|sofort) an|(?:rufen Sie an|wählen|senden Sie)\s+(?:\+?\d|\(\d)[\d().\s-]{5,}\d|klicken Sie (?:hier|auf den Link)|senden Sie (?:den )?(?:Code|Gutschein|Krypto|Zahlung)|überweisen Sie (?:das )?(?:Geld|Guthaben))\b/i },
  { lang: "de", role: "isolation", re: /\b(?:(?:nicht|niemals)\s+(?:sagen|teilen|informieren|kontaktieren)\s+(?:niemanden|Ihre Familie|die Bank|die Polizei)|sagen Sie niemandem|bleibt unter uns|geheim|handeln Sie allein)\b/i },

  // Japanese
  { lang: "ja", role: "impersonation", re: /(マイクロソフト|アップル|グーグル|アマゾン|ペイパル|ネットフリックス|銀行|税務署|年金|政府|テクニカルサポート|カスタマーサポート|警察|税関|セキュリティセンター)/ },
  { lang: "ja", role: "threat", re: /(ウイルス|感染|ハッキング|ハッキングされ|アカウント停止|停止され|凍結|無効化|不審な活動|不正アクセス|法的措置|逮捕|強制送還|未払い|期限切れ|最終通知|今すぐ認証|アカウント.*(?:閉鎖|停止|制限|ブロック))/ },
  { lang: "ja", role: "actNow", re: /(今すぐ電話|直ちに連絡|リンクをクリック|コードを送信|送金|振込|電話番号.*\d)/ },
  { lang: "ja", role: "isolation", re: /(誰にも言わない|秘密|内緒にして|警察に知らせない|銀行に連絡しない|一人で対応)/ },

  // Korean
  { lang: "ko", role: "impersonation", re: /(마이크로소프트|애플|구글|아마존|페이팔|넷플릭스|은행|국세청|정부|기술 지원|고객 서비스|경찰|세관|보안 센터)/ },
  { lang: "ko", role: "threat", re: /(바이러스|감염|해킹|계정 정지|정지됨|동결|비활성화|의심스러운 활동|허가되지 않은 접근|법적 조치|체포|추방|미납|연체|최종 통지|지금 인증|계정.*(?:폐쇄|정지|제한|차단))/ },
  { lang: "ko", role: "actNow", re: /(지금 전화|즉시 연락|링크 클릭|코드 전송|송금|이체|전화.*\d)/ },
  { lang: "ko", role: "isolation", re: /(아무에게도 말하지 마|비밀|비밀로 하|경찰에 알리지 마|은행에 연락하지 마|혼자 처리)/ },

  // Russian
  { lang: "ru", role: "impersonation", re: /(?:майкрософт|эпл|гугл|амазон|paypal|netflix|ваш\s+банк|налоговая|социальная\s+защита|правительство|техподдержка|служба\s+поддержки|полиция|таможня)/i },
  { lang: "ru", role: "threat", re: /(?:вирус|инфицирован|взломан|скомпрометирован|приостановлен|заблокирован|заморожен|деактивирован|подозрительная\s+активность|несанкционированный\s+доступ|судебные\s+действия|арест|депортация|долг|просрочен|последнее\s+уведомление|подтвердите\s+(?:ваш\s+)?(?:аккаунт|личность)\s+(?:сейчас|немедленно)|аккаунт.*(?:закрыт|приостановлен|заблокирован|ограничен))/i },
  { lang: "ru", role: "actNow", re: /(?:позвоните\s+(?:по\s+этому\s+номеру|сейчас|немедленно)|позвоните\s+(?:\+?\d|\(\d)[\d().\s-]{5,}\d|наберите\s+(?:\+?\d|\(\d)[\d().\s-]{5,}\d|отправьте\s+(?:\+?\d|\(\d)[\d().\s-]{5,}\d|нажмите\s+(?:здесь|на\s+ссылку)|отправьте\s+(?:код|подарочную\s+карту|крипто|платёж)|переведите\s+(?:деньги|средства)|позвоните\s+.*\d)/i },
  { lang: "ru", role: "isolation", re: /(?:(?:не\s+|никому\s+не\s+)(?:говорите|делитесь|сообщайте|свяжитесь)\s+(?:никому|своей\s+семье|в\s+банк|в\s+полицию)|никому\s+не\s+говорите|держите\s+(?:в\s+секрете|в\s+тайне)|это\s+секрет)/i },
];

// ── Convenience functions ──────────────────────────────────────────

/**
 * Scan text with all i18n category signals. Returns one flag per
 * category (first match wins), same as scanWithRules semantics.
 */
export function scanI18n(text: string): { categoryId: CategoryId; evidence: string; lang: string; label: string }[] {
  const results: { categoryId: CategoryId; evidence: string; lang: string; label: string }[] = [];
  const seenCategories = new Set<CategoryId>();

  for (const signal of I18N_CATEGORY_SIGNALS) {
    if (seenCategories.has(signal.categoryId)) continue;
    const m = signal.re.exec(text);
    if (m && m[0]) {
      results.push({
        categoryId: signal.categoryId,
        evidence: m[0].replace(/\s+/g, " ").trim().slice(0, 120),
        lang: signal.lang,
        label: signal.label,
      });
      seenCategories.add(signal.categoryId);
    }
  }

  return results;
}

/**
 * Check i18n scam-composite signals. Returns which roles matched.
 */
export function detectI18nScam(text: string): {
  impersonation: boolean;
  threat: boolean;
  actNow: boolean;
  isolation: boolean;
  reasons: string[];
} {
  const roles = { impersonation: false, threat: false, actNow: false, isolation: false };
  const reasons: string[] = [];

  for (const signal of I18N_SCAM_SIGNALS) {
    if (signal.re.test(text)) {
      if (signal.role === "impersonation" && !roles.impersonation) { roles.impersonation = true; }
      if (signal.role === "threat" && !roles.threat) { roles.threat = true; }
      if (signal.role === "actNow" && !roles.actNow) { roles.actNow = true; }
      if (signal.role === "isolation" && !roles.isolation) { roles.isolation = true; }
    }
  }

  if (roles.impersonation) reasons.push("claims to be a known company or authority");
  if (roles.threat) reasons.push("uses a threat, lockout, or 'final notice'");
  if (roles.actNow) reasons.push("pushes you to call/click/pay right now");
  if (roles.isolation) reasons.push("pushes you to act alone or keep it secret");

  return { ...roles, reasons };
}

/** List of all supported languages for documentation/UI purposes. */
export const SUPPORTED_LANGS: string[] = Array.from(
  new Set([
    ...I18N_CATEGORY_SIGNALS.map((s) => s.lang),
    ...I18N_SCAM_SIGNALS.map((s) => s.lang),
  ]),
).sort();