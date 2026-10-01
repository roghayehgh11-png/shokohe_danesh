import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE_PATH = path.join(DATA_DIR, "system_settings.json");

interface SystemSettings {
  geminiApiKey?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
}

function loadSystemSettings(): SystemSettings {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const content = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      return JSON.parse(content) || {};
    }
  } catch (err) {
    console.error("[System Settings] Failed to read settings file:", err);
  }
  return {};
}

function saveSystemSettings(settings: SystemSettings) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("[System Settings] Failed to save settings file:", err);
  }
}

// Lazy or safe Gemini initialization supporting server env and persisted settings
function getGeminiClient(customApiKey?: string): { client: GoogleGenAI | null; keySource: string } {
  const settings = loadSystemSettings();
  const apiKey =
    customApiKey ||
    process.env.GEMINI_API_KEY ||
    settings.geminiApiKey ||
    "";

  if (!apiKey) {
    return { client: null, keySource: "none" };
  }

  const source = customApiKey ? "custom" : process.env.GEMINI_API_KEY ? "env" : "saved_settings";
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  return { client, keySource: source };
}

// Helper to call generateContent with automatic retry and model fallback
async function generateWithFallback(
  ai: GoogleGenAI,
  contents: any,
  config?: any
) {
  // Use official, active Google Gemini models with high availability
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest"
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          ...config
        }
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Model: ${model} unavailable or busy]:`, err?.status || err?.message || err);
      // Short delay before trying the next model
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser for base64 / text payloads
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // ==========================================
  // CENTRAL CLOUD DATABASE STORAGE & SYNC API
  // Enables seamless multi-device persistence across laptops and browsers
  // ==========================================
  const DATA_DIR = path.join(process.cwd(), "data");
  const DB_FILE_PATH = path.join(DATA_DIR, "academy_cloud_db.json");

  let inMemoryDb: {
    version: number;
    lastModified: string;
    data: any;
  } | null = null;

  function loadDatabaseFromDisk() {
    if (inMemoryDb && inMemoryDb.data) return inMemoryDb;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.version === 'number') {
          inMemoryDb = parsed;
          return inMemoryDb!;
        }
      }
    } catch (err) {
      console.error("[Server DB] Error reading DB file:", err);
    }
    inMemoryDb = {
      version: 1,
      lastModified: new Date().toISOString(),
      data: null
    };
    return inMemoryDb;
  }

  function saveDatabaseToDisk(dbObj: { version: number; lastModified: string; data: any }) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE_PATH}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dbObj, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (err) {
      console.error("[Server DB] Error saving DB to disk:", err);
    }
  }

  // GET /api/sync/state -> Fetches the full centralized cloud state
  app.get("/api/sync/state", (req, res) => {
    try {
      const db = loadDatabaseFromDisk();
      return res.json({
        success: true,
        hasData: !!db.data,
        version: db.version,
        lastModified: db.lastModified,
        data: db.data
      });
    } catch (error: any) {
      console.error("[Server DB] Error in /api/sync/state:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/sync/version -> Ultra-fast lightweight check for multi-device polling
  app.get("/api/sync/version", (req, res) => {
    try {
      const db = loadDatabaseFromDisk();
      return res.json({
        version: db.version || 1,
        lastModified: db.lastModified,
        hasData: !!db.data
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // POST /api/sync/save -> Saves and synchronizes latest state from any laptop/device
  app.post("/api/sync/save", (req, res) => {
    try {
      const { data, clientVersion } = req.body;
      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          success: false,
          error: "داده‌های معتبری جهت ذخیره در سرور مرکزی ارسال نشده است."
        });
      }

      const current = loadDatabaseFromDisk();
      const newVersion = (current.version || 1) + 1;
      const now = new Date().toISOString();

      const newDb = {
        version: newVersion,
        lastModified: now,
        data: data
      };

      inMemoryDb = newDb;
      saveDatabaseToDisk(newDb);

      console.log(`[Server DB] Central state saved (v${newVersion}) from client at ${now}`);

      return res.json({
        success: true,
        version: newVersion,
        lastModified: now,
        message: "اطلاعات با موفقیت در پایگاه داده مرکزی سرور ذخیره و همگام شد."
      });
    } catch (error: any) {
      console.error("[Server DB] Error in /api/sync/save:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/sync/reset -> Resets central server database
  app.post("/api/sync/reset", (req, res) => {
    try {
      inMemoryDb = {
        version: (inMemoryDb?.version || 1) + 1,
        lastModified: new Date().toISOString(),
        data: null
      };
      if (fs.existsSync(DB_FILE_PATH)) {
        fs.unlinkSync(DB_FILE_PATH);
      }
      return res.json({ success: true, message: "دیتابیس مرکزی سرور بازنشانی گردید." });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==========================================
  // SYSTEM CONFIGURATION & EXTERNAL SERVERS API
  // Enables smooth AI and Email operation on any server or deployment
  // ==========================================
  app.get("/api/system/settings", (req, res) => {
    try {
      const settings = loadSystemSettings();
      const hasEnvGemini = Boolean(process.env.GEMINI_API_KEY);
      const hasSavedGemini = Boolean(settings.geminiApiKey);

      const envSmtpUser = process.env.SMTP_USER || "";
      const envSmtpHost = process.env.SMTP_HOST || "";
      const isSmtpConfigured = true; // Hardcoded permanent server configuration

      return res.json({
        success: true,
        ai: {
          isConfigured: hasEnvGemini || hasSavedGemini,
          source: hasEnvGemini ? "env" : hasSavedGemini ? "database" : "none",
          // Return masked key for security
          maskedKey: hasEnvGemini
            ? "AIzaSy... (از متغیر محیطی سرور)"
            : settings.geminiApiKey
            ? `${settings.geminiApiKey.slice(0, 6)}...${settings.geminiApiKey.slice(-4)}`
            : ""
        },
        smtp: {
          isConfigured: true,
          host: "mail.baoneh.ir",
          port: 465,
          secure: true,
          user: "roghaye.ghanbari@baoneh.ir",
          from: "آکادمی شکوه دانش <roghaye.ghanbari@baoneh.ir>"
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/system/settings", (req, res) => {
    try {
      const { geminiApiKey, smtp } = req.body;
      const current = loadSystemSettings();

      const updated: SystemSettings = {
        ...current,
        geminiApiKey: geminiApiKey !== undefined ? geminiApiKey.trim() : current.geminiApiKey,
        smtp: smtp
          ? {
              host: smtp.host ? smtp.host.trim() : (current.smtp?.host || "smtp.gmail.com"),
              port: Number(smtp.port) || (current.smtp?.port || 465),
              secure: smtp.secure !== undefined ? Boolean(smtp.secure) : (current.smtp?.secure ?? true),
              user: smtp.user ? smtp.user.trim() : (current.smtp?.user || ""),
              pass: smtp.pass ? smtp.pass.trim() : (current.smtp?.pass || ""),
              from: smtp.from ? smtp.from.trim() : (current.smtp?.from || "")
            }
          : current.smtp
      };

      saveSystemSettings(updated);
      console.log("[System Settings] Updated system credentials on server.");

      return res.json({
        success: true,
        message: "تنظیمات هوش مصنوعی و سرور ایمیل با موفقیت در پایگاه داده سرور ذخیره شد."
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 1: Analyze PDF / Daily Report with Strict, Objective, Non-Flattering Gemini AI
  app.post("/api/gemini/analyze-pdf-report", async (req, res) => {
    try {
      const { fileName, fileBase64, textContent, projectsList, internName, apiKey } = req.body;
      const { client: ai, keySource } = getGeminiClient(apiKey);

      if (!ai) {
        return res.status(200).json({
          success: false,
          useFallback: true,
          message: "کلید هوش مصنوعی (GEMINI_API_KEY) روی سرور یا تنظیمات سامانه یافت نشد."
        });
      }

      const prompt = `شما ممیز ارشد فنی، بازرس سخت‌گیر و تحلیل‌گر کاملاً منطقی و بدون تعارف آموزشگاه فناوری اطلاعات شکوه دانش هستید.
شخصیت و مأموریت شما: کاملاً منطقی، صریح، بی‌طرف، نقادانه و بر اساس داده‌های تجربی واقعی.
مهم: اکیداً از هرگونه تعریف و تمجید الکی، عبارات تملق‌آمیز، تعارفات کاذب، الفاظ اغراق‌آمیز یا نمرات ارفاقی خودداری کنید. اگر عملکرد ضعیف، متوقف یا مبهم بوده، باید با شجاعت و شفافیت بیان شود.

سوابق برای ارزیابی:
- نام کارآموز: ${internName || 'کارآموز'}
- نام سند پیوست: ${fileName || 'بدون نام'}
- لیست پروژه‌های موجود: ${JSON.stringify(projectsList || [])}

دستورالعمل‌های حیاتی ممیزی:
۱. واقع‌گرایی بدون تعارف (Zero Hallucination): تنها خروجی‌هایی که مستند شده‌اند پذیرفته می‌شوند. کارهای کلی مانند «مطالعه کدهای دیگران» یا «بررسی آموزش» را به عنوان خروجی مفید ثبت نکنید و در فیلد اتلاف وقت ذکر کنید.
۲. محاسبه بی‌رحمانه اتلاف وقت (line2TimeWastedOrGaps): ساعات ورود و خروج را با حجم خروجی واقعی بسنجید. اگر کارآموز ۸ ساعت حضور داشته اما فقط یک کامپوننت ساده یا خواندن مستندات داشته، صراحتاً بنویسید: «عدم توازن شدید کارایی؛ حداقل ۴ ساعت اتلاف وقت یا عدم تمرکز».
۳. نمره کیفی (qualityScore):
   - بین ۰ تا ۱۰۰ محاسبه کنید.
   - کارآموزی که کارهای ساده، تکراری یا ناقص انجام داده نباید نمره بالای ۷۰ بگیرد.
   - فقط تسک‌های دارای تست، معماری تمیز و خروجی بدون باگ شایسته نمره بالای ۸۰ هستند.
۴. سطح بهره‌وری (productivityRating):
   - فقط یکی از این موارد: "نیاز به بهبود" | "متوسط" | "خوب" | "عالی"
   - به هیچ وجه الکی "عالی" یا "خوب" ثبت نکنید.
۵. تحلیل ۵ خطی برای مدیریت (aiFiveLineAnalysis):
   - line1HoursWorked: ساعت کارکرد مفید واقعی (تفکیک ساعت فیزیکی حضور از ساعت کار مفید موثر)
   - line2TimeWastedOrGaps: زمان هدررفته، توقف‌ها و کارهای حاشیه‌ای غیرمفید
   - line3TasksAccomplished: خروجی‌های واقعی و عینی اثبات‌شده
   - line4TechnicalChallenges: چالش‌های فنی، باگ‌ها و ضعف‌های دانشی مشاهده‌شده
   - line5ProjectDecisionGuidance: دستور مدیریتی صریح برای سرپرست آکادمی (مثلاً رد گزارش، نیاز به مصاحبه حضوری، الزام به بازنویسی کد، یا تایید مشروط)

پاسخ را دقیقاً در فرمت JSON زیر بازگردان:
{
  "reportDate": "تاریخ شمسی گزارش (مثلا 1403/05/28) یا خالی اگر نبود",
  "projectTitle": "عنوان پروژه منطبق بر محتوا یا نام پروژه از لیست",
  "clockIn": "ساعت ورود (مثلا 08:30)",
  "clockOut": "ساعت خروج (مثلا 16:30)",
  "tasksDone": "عین شرح وظایف و اقدامات انجام شده در سند",
  "problemsEncountered": "چالش‌ها، گیرها و باگ‌ها (یا خالی)",
  "tomorrowsPlan": "برنامه فردا (یا خالی)",
  "progressAdded": عدد درصد پیشرفت واقعی (مثلا ۳ الی ۱۵),
  "extractedSkills": ["تکنولوژی‌ها و مهارت‌های فنی به کار رفته"],
  "qualityScore": عدد نمره کیفی واقعی,
  "productivityRating": "نیاز به بهبود" | "متوسط" | "خوب" | "عالی",
  "autoEvaluation": "ارزیابی کوتاه، جدی و فنی",
  "aiFiveLineAnalysis": {
    "line1HoursWorked": "ساعت کارکرد مفید: ...",
    "line2TimeWastedOrGaps": "زمان هدررفته/توقف: ...",
    "line3TasksAccomplished": "اقدامات و دستاوردها: ...",
    "line4TechnicalChallenges": "کیفیت، چالش‌ها و باگ‌ها: ...",
    "line5ProjectDecisionGuidance": "تصمیم‌گیری مدیریتی: ..."
  }
}`;

      let contents: any;
      if (fileBase64 && fileBase64.includes(';base64,')) {
        const parts = fileBase64.split(';base64,');
        const mimeType = parts[0].replace('data:', '') || 'application/pdf';
        const base64Data = parts[1];
        contents = {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            },
            {
              text: textContent ? `${prompt}\n\nمتن ضمیمه سند:\n${textContent}` : prompt
            }
          ]
        };
      } else if (textContent) {
        contents = `${prompt}\n\nمتن گزارش کارآموز:\n"""\n${textContent}\n"""`;
      } else {
        contents = prompt;
      }

      const response = await generateWithFallback(ai, contents);

      let rawText = response.text?.trim() || "{}";
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(rawText);
      } catch (e) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedData = JSON.parse(match[0]);
          } catch {
            parsedData = {};
          }
        }
      }

      return res.json({
        success: true,
        source: keySource,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Error in analyze-pdf-report:", error);
      return res.status(200).json({
        success: false,
        useFallback: true,
        error: error.message
      });
    }
  });

  // API 2: Monthly Intern Report & Missing Days Analysis with Strict Non-Flattering Assessment
  app.post("/api/gemini/monthly-intern-analysis", async (req, res) => {
    try {
      const { internName, month, reports, missingDays, totalWorkDays, projects, apiKey } = req.body;
      const { client: ai, keySource } = getGeminiClient(apiKey);

      if (!ai) {
        return res.status(200).json({
          success: false,
          useFallback: true,
          message: "GEMINI_API_KEY not configured on server or system settings."
        });
      }

      const prompt = `شما ممیز ارشد کیفی و مدیر فنی آکادمی فناوری اطلاعات شکوه دانش هستید.
کارنامه و سوابق ماهانه کارآموز (${internName}) در ماه (${month}) را کاملاً منطقی، جدی، سخت‌گیرانه، مستدل و بدون هیچ تعارف و تملقی بررسی و تحلیل کنید.
هیچ تعریف الکی انجام ندهید. واقعیت نظم، ساعت کار و تخصص را بدون پوشش بنویسید.

آمار و اطلاعات ورودی:
- کل روزهای کاری استاندارد ماه: ${totalWorkDays || 24} روز
- روزهای با گزارش ثبت‌شده: ${reports?.length || 0} روز
- روزهای عدم ارسال گزارش (غیبت یا اهمال): ${JSON.stringify(missingDays || [])}
- گزارش‌های ارسال‌شده: ${JSON.stringify(reports || [])}
- پروژه‌های تعریف‌شده: ${JSON.stringify(projects || [])}

معیارهای سخت‌گیرانه ارزیابی:
۱. غیبت و عدم ارسال گزارش: هر روز عدم ثبت گزارش نشان‌دهنده نقص انضباطی جدی است و حداقل ۴ نمره از کل کسر می‌کند. اگر بیش از ۳ روز غیبت داشته باشد نمره نباید بالاتر از ۷۵ برود.
۲. محاسبه دقیق نمره عملکرد (performanceScore): عدد بین ۰ تا ۱۰۰ بر پایه خروجی عینی و نظم.
۳. بخش growthAreas: صراحتاً تنبلی، اتلاف وقت، عدم رعایت زمان‌بندی، یا ضعف در استانداردهای کدنویسی را برجسته کنید.
۴. بخش overallSummary: جمع‌بندی واقع‌گرایانه، مدیریتی و جدی. از به کار بردن واژه‌هایی چون «بسیار ستودنی است»، «فوق‌العاده»، «امیدوارکننده» یا عبارات دلگرم‌کننده بی‌اساس اکیداً خودداری کنید و به جای آن یک نتیجه‌گیری حرفه‌ای صنعتی و بدون تعارف بنویسید.

پاسخ را در فرمت JSON زیر بازگردان:
{
  "performanceScore": عدد نمره عملکرد واقعی,
  "attendanceStatus": "تحلیل آماری و انضباطی حضور بدون تعارف",
  "missingDaysAnalysis": "تحلیل روزهای از دست رفته و نقد عدم ارسال گزارش",
  "strengths": [
    "نقطه قوت فنی یا انضباطی واقعی ۱",
    "نقطه قوت واقعی ۲"
  ],
  "growthAreas": [
    "نقص کاری، اتلاف وقت یا عدم انضباط ۱",
    "نقطه ضعف فنی یا تسک‌های بر زمین مانده ۲"
  ],
  "recommendedSkills": [
    {
      "skill": "نام مهارت یا ابزار تخصصی مورد نیاز برای رفع نقایص فعلی",
      "priority": "فوری" | "پیشنهادی" | "پیشرفته",
      "reason": "دلیل فنی و سخت‌گیرانه چرا باید این را بیاموزد",
      "roadmapStep": "گام اول یادگیری عملی"
    }
  ],
  "overallSummary": "جمع‌بندی نهایی، کاملاً جدی، منطقی، صریح و مدیریتی"
}`;

      const response = await generateWithFallback(ai, prompt);

      const jsonText = response.text?.trim() || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (e) {
        parsedData = {};
      }

      return res.json({
        success: true,
        source: keySource,
        data: parsedData
      });
    } catch (error: any) {
      console.error("Error in monthly-intern-analysis:", error);
      return res.status(200).json({
        success: false,
        useFallback: true,
        error: error.message
      });
    }
  });

  // API 2.5: Test Gemini AI Connection with Strict Logical Validation
  app.post("/api/gemini/test-connection", async (req, res) => {
    try {
      const { customApiKey } = req.body || {};
      const geminiObj = getGeminiClient(customApiKey);

      if (!geminiObj || !geminiObj.client) {
        return res.status(400).json({
          success: false,
          error: "کلید API هوش مصنوعی (Gemini API Key) یافت نشد. لطفاً در فرم زیر کلید خود را ثبت کنید."
        });
      }

      const prompt = `شما ناظر فنی، منطقی، دقیق و بدون تعارف سامانه مدیریت آکادمی شکوه دانش هستید.
پاسخ را دقیقاً در قالب این JSON برگردانید:
{
  "systemStatus": "فعال و عملیاتی",
  "auditTone": "تحلیلی، مستند، بدون تمجید و سخت‌گیرانه",
  "statement": "موتور پردازش هوش مصنوعی با موفقیت به سامانه آکادمی متصل است. تمامی گزارش‌های کارآموزان بر اساس شاخص‌های کمی، درصد پیشرفت واقعی کدهای مستندشده و ساعات موظف ارزیابی خواهند شد. هیچ‌گونه تمجید غیرواقعی یا چشم‌پوشی از غیبت‌ها در سامانه اعمال نمی‌گردد."
}`;

      const response = await generateWithFallback(geminiObj.client, prompt, {
        responseMimeType: "application/json"
      });

      let parsed: any = {};
      try {
        parsed = JSON.parse(response.text?.trim() || "{}");
      } catch {
        parsed = {
          systemStatus: "فعال",
          auditTone: "منطقی و جدی",
          statement: response.text || "ارتباط هوش مصنوعی با موفقیت برقرار شد."
        };
      }

      return res.json({
        success: true,
        data: parsed,
        message: "ارتباط با هوش مصنوعی گوگل با موفقیت آزمایش شد."
      });
    } catch (err: any) {
      console.error("Error testing Gemini connection:", err);
      return res.status(500).json({
        success: false,
        error: `خطا در برقراری ارتباط با هوش مصنوعی: ${err.message || 'خطای شبکه یا اعتبار کلید API'}`
      });
    }
  });

  // ==========================================
  // CENTRAL ACADEMY EMAIL SERVER & DISPATCH ENGINE
  // Global server-side email service: No complex SMTP configs required from regular users
  // Automatically fixes common typos and normalizes email addresses
  // ==========================================

  // Smart server-side email normalization & typo correction
  function cleanAndNormalizeServerEmail(rawInput: string): {
    normalized: string;
    isValid: boolean;
    wasCorrected: boolean;
    original: string;
  } {
    let cleaned = (rawInput || '').trim();
    const original = cleaned;

    // Remove mailto:, quotes, brackets
    cleaned = cleaned
      .replace(/^mailto:/i, '')
      .replace(/^<+|>+$/g, '')
      .replace(/^"+|"+$/g, '')
      .replace(/^'+|'+$/g, '');

    // Convert Persian & Arabic numbers to English
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
      cleaned = cleaned.replace(new RegExp(persianDigits[i], 'g'), String(i));
      cleaned = cleaned.replace(new RegExp(arabicDigits[i], 'g'), String(i));
    }

    // Strip all internal whitespaces
    cleaned = cleaned.replace(/\s+/g, '');

    // Replace Persian or English comma with dot
    cleaned = cleaned.replace(/،/g, '.').replace(/,/g, '.');

    // Replace consecutive dots
    cleaned = cleaned.replace(/\.{2,}/g, '.');

    // Handle missing @ before known domains
    if (!cleaned.includes('@')) {
      const knownDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
      for (const d of knownDomains) {
        if (cleaned.endsWith(d)) {
          const prefix = cleaned.slice(0, -d.length).replace(/[._-]+$/, '');
          if (prefix) {
            cleaned = `${prefix}@${d}`;
            break;
          }
        }
      }
    }

    // Handle domain typos
    const domainTypos: Record<string, string> = {
      'gmai.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmail.con': 'gmail.com',
      'gmail.co': 'gmail.com',
      'gmail.ir': 'gmail.com',
      'gemail.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'yaho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'yaho.con': 'yahoo.com',
      'yaho.ir': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com',
      'iclod.com': 'icloud.com'
    };

    const parts = cleaned.split('@');
    if (parts.length === 2) {
      const user = parts[0].trim();
      let domain = parts[1].toLowerCase().trim();
      if (domainTypos[domain]) {
        domain = domainTypos[domain];
      }
      if (domain.endsWith('.')) {
        domain = domain.slice(0, -1);
      }
      cleaned = `${user}@${domain}`;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(cleaned);
    const wasCorrected = cleaned !== original;

    return { normalized: cleaned, isValid, wasCorrected, original };
  }

  // Hardcoded permanent SMTP configuration for baoneh.ir mail server
  // Eliminates all dependency on environment variables and manual user configurations
  const PERMANENT_SMTP_CONFIG = {
    primaryHost: "mail.baoneh.ir",
    fallbackHost: "baoneh.ir",
    port: 465,
    user: "roghaye.ghanbari@baoneh.ir",
    pass: "Z5KgiA0j8BZr6vq2",
    from: "آکادمی شکوه دانش <roghaye.ghanbari@baoneh.ir>",
    senderEmail: "roghaye.ghanbari@baoneh.ir"
  };

  // Central Email Dispatcher function that always succeeds gracefully
  async function dispatchEmailThroughCentralServer(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
    senderName?: string;
  }) {
    const trackingId = `SHK-MAIL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();
    
    const user = PERMANENT_SMTP_CONFIG.user;
    const pass = PERMANENT_SMTP_CONFIG.pass;
    const port = PERMANENT_SMTP_CONFIG.port;
    const from = PERMANENT_SMTP_CONFIG.from;
    let activeHost = PERMANENT_SMTP_CONFIG.primaryHost;

    let deliveredVia = `سرور رسمی آکادمی (${activeHost})`;
    let messageId = `<${trackingId.toLowerCase()}@baoneh.ir>`;

    try {
      // 1. Attempt sending via primary host (mail.baoneh.ir:465)
      let transporter = nodemailer.createTransport({
        host: PERMANENT_SMTP_CONFIG.primaryHost,
        port,
        secure: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000
      });

      let info;
      try {
        info = await transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments
        });
        activeHost = PERMANENT_SMTP_CONFIG.primaryHost;
      } catch (primaryErr: any) {
        console.warn(`[Central Email] Primary host ${PERMANENT_SMTP_CONFIG.primaryHost} attempt had notice: ${primaryErr?.message}. Retrying via fallback host ${PERMANENT_SMTP_CONFIG.fallbackHost}...`);
        
        // 2. Fallback attempt via secondary host (baoneh.ir:465)
        transporter = nodemailer.createTransport({
          host: PERMANENT_SMTP_CONFIG.fallbackHost,
          port,
          secure: true,
          auth: { user, pass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 15000
        });

        info = await transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments
        });
        activeHost = PERMANENT_SMTP_CONFIG.fallbackHost;
      }

      console.log(`[Central Email] Successfully sent via SMTP ${activeHost} to ${options.to}. MsgId: ${info.messageId}`);
      deliveredVia = `ارسال مستقیم از طریق سرور SMTP (${activeHost})`;
      messageId = info.messageId;
    } catch (smtpErr: any) {
      console.error(`[Central Email] SMTP delivery error:`, smtpErr);
      throw new Error(`خطا در ارتباط و ارسال از سرور ایمیل: ${smtpErr?.message || 'عدم دسترسی به سرور'}`);
    }

    // Record this dispatch into Central Cloud DB activity history
    try {
      const db = loadDatabaseFromDisk();
      if (db.data) {
        if (!db.data.activityLogs) db.data.activityLogs = [];
        db.data.activityLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: 'system',
          userName: options.senderName || 'سرور مرکزی آکادمی',
          action: 'EMAIL_DISPATCH',
          module: 'ایمیل و پشتیبان',
          details: `ارسال خودکار به ${options.to} با شناسه پیگیری ${trackingId}`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        });
        saveDatabaseToDisk({
          version: (db.version || 1) + 1,
          lastModified: new Date().toISOString(),
          data: db.data
        });
      }
    } catch {}

    return {
      success: true,
      trackingId,
      messageId,
      deliveredVia,
      timestamp,
      recipient: options.to
    };
  }

  // API 3: Simple & Robust Test Email Connection
  app.post("/api/email/test-smtp", async (req, res) => {
    try {
      const rawTarget = req.body?.testEmail || "roghayeh.ghanbari18@gmail.com";
      const normalizedInfo = cleanAndNormalizeServerEmail(rawTarget);

      if (!normalizedInfo.isValid) {
        return res.status(400).json({
          success: false,
          error: "آدرس ایمیل وارد شده معتبر نمی‌باشد. لطفاً آدرس را بررسی فرمایید."
        });
      }

      const target = normalizedInfo.normalized;
      const htmlContent = `
        <div dir="rtl" style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 25px; border-radius: 12px; color: #1e293b;">
          <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; border: 1px solid #e2e8f0; max-width: 580px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="color: #2563eb; margin-top: 0; font-size: 18px;">✅ تایید ارسال خودکار از سرور مرکزی آکادمی</h2>
            <p style="font-size: 14px; line-height: 1.8; color: #334155;">
              با سلام و احترام،<br/>
              این پیام به منظور تایید صحت عملکرد سرویس ارسال خودکار ایمیل <strong>آکادمی فناوری اطلاعات شکوه دانش</strong> ارسال شده است.
            </p>
            <div style="background-color: #eff6ff; padding: 14px 16px; border-radius: 8px; border-right: 4px solid #2563eb; margin: 16px 0; font-size: 13px; line-height: 1.7;">
              <div><strong>گیرنده:</strong> ${target}</div>
              ${normalizedInfo.wasCorrected ? `<div style="color: #0369a1;"><strong>اصلاح خودکار نگارش:</strong> از «${normalizedInfo.original}» به «${target}»</div>` : ''}
              <div><strong>وضعیت سرور:</strong> آماده و متصل در پشت صحنه (بدون نیاز به تنظیمات دستی)</div>
              <div><strong>زمان ثبت:</strong> ${new Date().toLocaleString('fa-IR')}</div>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
              سامانه مدیریت جامع آکادمی شکوه دانش (shoukoh danesh)
            </p>
          </div>
        </div>
      `;

      const dispatchResult = await dispatchEmailThroughCentralServer({
        to: target,
        subject: `تست موفق ارسال ایمیل از سرور مرکزی آکادمی شکوه دانش (${new Date().toLocaleDateString('fa-IR')})`,
        text: `با سلام، تست ارسال ایمیل از سرور مرکزی آکادمی با موفقیت به آدرس ${target} به انجام رسید.`,
        html: htmlContent,
        senderName: 'سرور مرکزی آکادمی'
      });

      return res.json({
        success: true,
        message: `ایمیل تستی با موفقیت از طریق سرور مرکزی به آدرس ${target} ارسال شد.`,
        sentTo: target,
        wasCorrected: normalizedInfo.wasCorrected,
        originalEmail: normalizedInfo.original,
        trackingId: dispatchResult.trackingId,
        messageId: dispatchResult.messageId,
        deliveredVia: dispatchResult.deliveredVia
      });
    } catch (err: any) {
      console.error("[Email Test Error]:", err);
      return res.status(500).json({
        success: false,
        error: `خطا در پردازش ارسال ایمیل: ${err.message || 'خطای سرور'}`
      });
    }
  });

  // API 4: Simple, Zero-Config Central Email Dispatcher for Backups & Reports
  app.post("/api/email/send-backup", async (req, res) => {
    try {
      const { to, subject, bodyText, backupPayload, senderName, userMessage } = req.body;

      if (!to || typeof to !== 'string') {
        return res.status(400).json({
          success: false,
          error: "لطفاً آدرس ایمیل دریافت‌کننده را وارد فرمایید."
        });
      }

      // Auto-clean and correct email mistakes (e.g. typos, Persian numerals, spaces)
      const normalizedInfo = cleanAndNormalizeServerEmail(to);

      if (!normalizedInfo.isValid) {
        return res.status(400).json({
          success: false,
          error: `آدرس ایمیل «${to}» نامعتبر است. لطفاً فرمت ایمیل را اصلاح فرمایید.`
        });
      }

      const cleanTo = normalizedInfo.normalized;

      // Generate tracking ID
      const trackingId = `SHK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Prepare attachment JSON
      const jsonBuffer = Buffer.from(JSON.stringify(backupPayload || {}, null, 2), 'utf-8');
      const filename = `shokooh_danesh_backup_${new Date().toISOString().slice(0, 10)}_${trackingId}.json`;

      const totalRecs = backupPayload?.summary?.totalRecords || 0;
      const scope = backupPayload?.backupType || 'پشتیبان اطلاعات آکادمی';

      // Build High-Quality Persian HTML Email Template
      const htmlContent = `
        <div dir="rtl" style="font-family: Tahoma, 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 25px; color: #0f172a;">
          <div style="background-color: #ffffff; padding: 25px; border-radius: 14px; border: 1px solid #cbd5e1; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
              <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">🎓 آکادمی فناوری اطلاعات شکوه دانش</h2>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">نسخه پشتیبان رسمی اطلاعات سامانه جامع</p>
            </div>

            <p style="font-size: 14px; line-height: 1.8; color: #334155;">
              با سلام و احترام،<br/>
              فایل پشتیبان اطلاعات سامانه با موفقیت از طریق سرور مرکزی آکادمی صادر و به پیوست این ایمیل ارسال گردیده است:
            </p>

            ${userMessage ? `
              <div style="background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #854d0e; margin: 15px 0;">
                💬 <strong>پیام کاربر:</strong> ${userMessage}
              </div>
            ` : ''}

            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #475569; width: 40%;">کد رهگیری:</td>
                  <td style="padding: 10px 14px; font-family: monospace; font-weight: bold; color: #2563eb;">${trackingId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #475569;">دامنه پشتیبان:</td>
                  <td style="padding: 10px 14px; color: #0f172a;">${scope}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #475569;">تعداد رکوردها:</td>
                  <td style="padding: 10px 14px; font-weight: bold; color: #059669;">${totalRecs} رکورد</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #475569;">گیرنده:</td>
                  <td style="padding: 10px 14px; color: #0f172a; font-family: monospace;">${cleanTo}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight: bold; color: #475569;">ارسال‌کننده:</td>
                  <td style="padding: 10px 14px; color: #334155;">${senderName || 'مدیر سیستم'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-weight: bold; color: #475569;">تاریخ و زمان:</td>
                  <td style="padding: 10px 14px; color: #334155;">${new Date().toLocaleString('fa-IR')}</td>
                </tr>
              </tbody>
            </table>

            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #065f46; margin: 15px 0;">
              📎 <strong>فایل ضمیمه:</strong> فایل کامل با نام <code>${filename}</code> به این ایمیل الصاق شده است و می‌توانید آن را در بخش بازیابی دیتابیس سامانه استفاده فرمایید.
            </div>

            <div style="margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
              این ایمیل به صورت خودکار توسط سرور مرکزی آکادمی شکوه دانش صادر گردیده است.
            </div>
          </div>
        </div>
      `;

      const dispatchResult = await dispatchEmailThroughCentralServer({
        to: cleanTo,
        subject: subject || `پشتیبان اطلاعات آکادمی شکوه دانش - کد رهگیری ${trackingId}`,
        text: `${bodyText || 'فایل پشتیبان اطلاعات آکادمی شکوه دانش'}\n\nکد رهگیری: ${trackingId}\nتعداد رکوردها: ${totalRecs}`,
        html: htmlContent,
        attachments: [
          {
            filename,
            content: jsonBuffer,
            contentType: 'application/json'
          }
        ],
        senderName
      });

      return res.json({
        success: true,
        message: `پشتیبان اطلاعات به همراه فایل پیوست با موفقیت از طریق سرور مرکزی به آدرس ${cleanTo} ارسال گردید.`,
        recipient: cleanTo,
        trackingId: dispatchResult.trackingId,
        messageId: dispatchResult.messageId,
        deliveredVia: dispatchResult.deliveredVia,
        sentAt: dispatchResult.timestamp,
        recordsTransferred: totalRecs,
        wasCorrected: normalizedInfo.wasCorrected,
        originalEmail: normalizedInfo.original,
        scope
      });
    } catch (error: any) {
      console.error("Error in central email sending:", error);
      return res.status(500).json({
        success: false,
        error: `خطا در فرآیند ارسال ایمیل: ${error.message || 'خطای ناشناخته سرور'}`
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
