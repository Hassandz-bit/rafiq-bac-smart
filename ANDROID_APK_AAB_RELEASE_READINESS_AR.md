# جاهزية APK وAAB لتطبيق «رفيق الباك»

## النتيجة العملية

تم إنشاء مشروع **Trusted Web Activity** من تطبيق الويب المنشور على النطاق `rafiqbac-8epdnqdn.manus.space`، ثم بُنيت حزم Android ووقعت محليًا بمخزن مفاتيح مخصص للمشروع. لا تُفعّل الحزمة تحصيلًا أو Play Billing أو منح صلاحيات موقع؛ إنها تغلف تجربة PWA الحالية بالمسارات والضوابط نفسها.

| البند | القيمة المتحققة |
|---|---|
| اسم التطبيق | رفيقك الذكي للباك |
| معرّف حزمة Android | `space.manus.rafiqbac_8epdnqdn.twa` |
| نطاق التطبيق | `https://rafiqbac-8epdnqdn.manus.space/` |
| نمط العرض | `standalone` |
| تحصيل Google Play | غير مفعّل |
| إذن الموقع | غير مطلوب |
| بصمة شهادة SHA-256 | `D6:92:FA:08:46:D9:C1:16:A5:AC:BC:02:03:A9:A8:67:4B:F9:7F:EE:6C:B0:D0:AA:1E:FA:B6:CD:D3:E5:9B:B0` |

## المخرجات الموقعة

| الملف | الاستخدام | الحجم | SHA-256 |
|---|---|---:|---|
| `rafiq-bac-release.apk` | تثبيت وتجربة داخلية مباشرة على أجهزة Android | 3.5 MB | `ddb326ccf0d5f5ba674c15736cb26f44e7a9e6c4b8c7ba538ffa20f60c4d8ecb` |
| `rafiq-bac-release.aab` | حزمة الرفع إلى Google Play Console | 3.6 MB | `4bf216194fa49d94718f7858aa3ccec67cc296cd278b49ac0414f51315cd719f` |

تم التحقق من توقيع APK بواسطة `apksigner verify`، ومن ملف AAB بواسطة `jarsigner -verify`. التحذيرات المرتبطة بالشهادة الذاتية وعدم وجود ختم زمني طبيعية لحزمة رفع محلية؛ يجب تفعيل **Play App Signing** عند إنشاء التطبيق في Google Play Console قبل النشر العام.

## ربط التطبيق بالنطاق

أُضيف الملف `/.well-known/assetlinks.json` إلى مشروع الويب، وهو يحتوي على معرّف الحزمة وبصمة الشهادة. بعد نشر نقطة الحفظ التي تتضمنه، سيتحقق Android من ملكية النطاق ويفتح التطبيق كتجربة Trusted Web Activity دون شريط المتصفح المعتاد. يجب الحفاظ على معرّف الحزمة ومفتاح التوقيع؛ تغيير أي منهما لاحقًا يستلزم تحديث الملف ثم إعادة النشر.

### تحقق النطاق العام

في فحص مباشر للنطاق بتاريخ 24 أغسطس 2026، كان رابط `https://rafiqbac-8epdnqdn.manus.space/.well-known/assetlinks.json` لا يزال يعيد صفحة 404 وكان بيان التطبيق العام يشير إلى الأيقونة السابقة. لذلك لا يُدّعى بعد أن ملف الربط انتشر فعليًا على CDN؛ يجب إعادة الفحص بعد اكتمال انتشار نقطة الحفظ `07adc1ff` قبل اعتبار تجربة Trusted Web Activity موثقة على جهاز فعلي.

## الاستخدام الآمن

يثبّت APK على جهاز اختبار بعد السماح بالتثبيت من المصدر المناسب في إعدادات Android. لا ترفع APK إلى Google Play؛ استخدم **AAB** هناك. لا تُشارك مخزن المفاتيح أو كلمة مروره في الدردشة أو داخل المستودع. احتفظ بهما في إدارة أسرار المؤسسة، لأن أي تحديث لاحق يجب أن يوقع بالمفتاح نفسه.

> هذه الحزمة لا تعتمد محتوى أكاديميًا غير مراجع ولا تتجاوز قفل المصدر أو الصلاحيات. كما أن البيانات المحمية والتعلم الشخصي يحتاجان اتصالًا بالمنصة، حتى عند استخدام التطبيق المثبت.

## مراجع

[1]: https://github.com/GoogleChromeLabs/bubblewrap "Bubblewrap"
[2]: https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2 "Trusted Web Activities Guide"
[3]: https://developer.android.com/training/app-links/verify-android-applinks "Verify Android App Links"
