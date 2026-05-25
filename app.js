const cities = {
  hangzhou: {
    name: "杭州",
    timezone: "Asia/Shanghai",
    timezoneLabel: "北京时间",
    latitude: 30.2741,
    longitude: 120.1551,
  },
  hadano: {
    name: "秦野",
    timezone: "Asia/Tokyo",
    timezoneLabel: "东京时间",
    latitude: 35.3747,
    longitude: 139.2202,
  },
};

const cityPhotos = {
  hangzhou: [
    "photolibrary/hangzhou/hangzhou01.jpg",
    "photolibrary/hangzhou/hangzhou02.jpg",
    "photolibrary/hangzhou/hangzhou03.jpg",
    "photolibrary/hangzhou/hangzhou04.jpg",
    "photolibrary/hangzhou/hangzhou05.jpg",
    "photolibrary/hangzhou/hangzhou06.jpg",
  ],
  hadano: [
    "photolibrary/kanagawahadano/hadano01.jpg",
    "photolibrary/kanagawahadano/hadano02.jpg",
    "photolibrary/kanagawahadano/hadano03.jpg",
    "photolibrary/kanagawahadano/hadano04.jpg",
    "photolibrary/kanagawahadano/hadano05.jpg",
    "photolibrary/kanagawahadano/hadano06.jpg",
    "photolibrary/kanagawahadano/hadano07.jpg",
    "photolibrary/kanagawahadano/hadano08.jpg",
    "photolibrary/kanagawahadano/hadano09.jpg",
  ],
};

const weatherText = {
  0: "晴天",
  1: "大致晴朗",
  2: "局部多云",
  3: "阴天",
  45: "有雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "较强毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "较强阵雨",
  82: "强阵雨",
  95: "雷雨",
};

const weatherAdvice = {
  0: "适合出门晒太阳",
  1: "适合散步",
  2: "云有点多",
  3: "天色会偏灰",
  45: "出行注意能见度",
  48: "路面可能湿滑",
  51: "带把伞更稳",
  53: "记得带伞",
  55: "雨具别忘了",
  61: "注意带伞",
  63: "雨天，注意带伞",
  65: "雨较大，少走湿滑路",
  71: "小雪，注意保暖",
  73: "降雪，记得添衣",
  75: "大雪，出行小心",
  80: "阵雨，伞要随身",
  81: "阵雨偏强，注意路况",
  82: "强阵雨，尽量避雨",
  95: "雷雨，注意安全",
};

const lunarMonthNames = [
  "",
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "冬月",
  "腊月",
];

const lunarMonthAliases = {
  正月: 1,
  一月: 1,
  二月: 2,
  三月: 3,
  四月: 4,
  五月: 5,
  六月: 6,
  七月: 7,
  八月: 8,
  九月: 9,
  十月: 10,
  十一月: 11,
  冬月: 11,
  十二月: 12,
  腊月: 12,
};

const chineseDigitMap = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function setRandomCityPhotos() {
  Object.entries(cityPhotos).forEach(([key, photos]) => {
    const card = document.querySelector(`[data-city="${key}"]`);
    if (!card || photos.length === 0) return;

    const photo = photos[Math.floor(Math.random() * photos.length)];
    card.style.setProperty("--city-photo", `url("${photo}")`);
  });
}

function parseChineseNumber(text) {
  const value = String(text).replace(/[日月\s]/g, "");
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "初十" || value === "十") return 10;
  if (value === "二十" || value === "廿") return 20;
  if (value === "三十") return 30;
  if (value.startsWith("初")) return chineseDigitMap[value.at(-1)] || null;
  if (value.startsWith("廿")) return 20 + (chineseDigitMap[value.at(-1)] || 0);
  if (value.startsWith("卅")) return 30 + (chineseDigitMap[value.at(-1)] || 0);
  if (value.startsWith("十")) return 10 + (chineseDigitMap[value.at(-1)] || 0);
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (chineseDigitMap[tens] || 1) * 10 + (chineseDigitMap[ones] || 0);
  }
  return chineseDigitMap[value] || null;
}

function formatLunarDay(day) {
  const names = [
    "",
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十",
  ];

  return names[day] || "";
}

function formatParts(date, timezone) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function formatLunar(date, timezone) {
  try {
    const parts = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
      timeZone: timezone,
      month: "long",
      day: "numeric",
    }).formatToParts(date);
    const monthPart = parts.find((part) => part.type === "month")?.value || "";
    const dayPart = parts.find((part) => part.type === "day")?.value || "";
    const isLeapMonth = /闰/.test(monthPart);
    const plainMonth = monthPart.replace(/闰/g, "");
    const monthNumber =
      lunarMonthAliases[plainMonth] || parseChineseNumber(plainMonth);
    const dayNumber = parseChineseNumber(dayPart);
    const monthName = lunarMonthNames[monthNumber] || plainMonth;
    const dayName = formatLunarDay(dayNumber) || dayPart.replace(/日/g, "");

    return `${isLeapMonth ? "闰" : ""}${monthName}${dayName}`;
  } catch {
    return "农历暂不可用";
  }
}

function updateTime() {
  const now = new Date();

  Object.entries(cities).forEach(([key, city]) => {
    const card = document.querySelector(`[data-city="${key}"]`);
    const parts = formatParts(now, city.timezone);
    const hour = Number(parts.hour);
    const minute = Number(parts.minute);
    const second = Number(parts.second);

    card.querySelector('[data-field="date"]').textContent =
      `${parts.year}年${parts.month}月${parts.day}日`;
    card.querySelector('[data-field="time"]').textContent =
      `${parts.hour}:${parts.minute}:${parts.second}`;
    card.querySelector('[data-field="timezone"]').textContent = city.timezoneLabel;
    card.querySelector('[data-field="lunar"]').textContent =
      `农历 ${formatLunar(now, city.timezone)}`;

    card.querySelector(".hour").style.transform =
      `translateX(-50%) rotate(${(hour % 12) * 30 + minute * 0.5}deg)`;
    card.querySelector(".minute").style.transform =
      `translateX(-50%) rotate(${minute * 6 + second * 0.1}deg)`;
    card.querySelector(".second").style.transform =
      `translateX(-50%) rotate(${second * 6}deg)`;
  });
}

async function loadWeather() {
  await Promise.all(
    Object.entries(cities).map(async ([key, city]) => {
      const card = document.querySelector(`[data-city="${key}"]`);
      const weatherNode = card.querySelector('[data-field="weather"]');
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.search = new URLSearchParams({
        latitude: city.latitude,
        longitude: city.longitude,
        current: "temperature_2m,weather_code",
        timezone: city.timezone,
      });

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather request failed");
        const data = await response.json();
        const code = data.current.weather_code;
        const temp = Math.round(data.current.temperature_2m);
        const summary = weatherText[code] || "天气变化中";
        const advice = weatherAdvice[code] || "留意天气变化";
        weatherNode.textContent = `${summary}，${temp}℃，${advice}`;
      } catch {
        weatherNode.textContent = "天气暂时加载失败，稍后再试";
      }
    }),
  );
}

async function loadNote() {
  const noteBoard = document.querySelector("#noteBoard");
  const noteStatus = document.querySelector("#noteStatus");
  if (!noteBoard || !noteStatus) return;

  try {
    const response = await fetch(`note.txt?time=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Note request failed");

    const text = (await response.text()).trim();
    noteBoard.textContent = text || "note.txt 现在还是空的。";
    noteStatus.textContent = `已更新 ${new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
    })}`;
  } catch {
    noteBoard.textContent =
      "暂时无法读取 note.txt。请通过本地网站服务打开页面，而不是直接双击 index.html。";
    noteStatus.textContent = "读取失败";
  }
}

setRandomCityPhotos();
updateTime();
loadWeather();
loadNote();
setInterval(updateTime, 1000);
setInterval(loadWeather, 10 * 60 * 1000);
setInterval(loadNote, 3000);
