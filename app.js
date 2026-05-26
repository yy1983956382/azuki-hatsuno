const cities = {
  hangzhou: {
    name: "杭州",
    timezone: "Asia/Shanghai",
    timezoneLabel: "北京时间",
    latitude: 30.2741,
    longitude: 120.1551,
    weatherProvider: "fast",
    weatherLocation: "Hangzhou",
    cmaStationId: "58457",
  },
  hadano: {
    name: "秦野",
    timezone: "Asia/Tokyo",
    timezoneLabel: "东京时间",
    latitude: 35.3747,
    longitude: 139.2202,
    weatherProvider: "jma",
    jmaOfficeCode: "140000",
    jmaAreaName: "西部",
    jmaTempAreaName: "小田原",
    jmaAmedasStationId: "46166",
  },
};

const githubRepo = {
  owner: "yy1983956382",
  name: "azuki-hatsuno",
  branch: "main",
};

const imageFilePattern = /\.(avif|gif|jpe?g|png|webp)$/i;

const cityPhotoFolders = {
  hangzhou: {
    path: "photolibrary/hangzhou",
    fallback: [
      "photolibrary/hangzhou/hangzhou01.jpg",
      "photolibrary/hangzhou/hangzhou02.jpg",
      "photolibrary/hangzhou/hangzhou03.jpg",
      "photolibrary/hangzhou/hangzhou04.jpg",
      "photolibrary/hangzhou/hangzhou05.jpg",
      "photolibrary/hangzhou/hangzhou06.jpg",
    ],
  },
  hadano: {
    path: "photolibrary/kanagawahadano",
    fallback: [
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
  },
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

const rainWeatherCodes = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82]);
const snowWeatherCodes = new Set([71, 73, 75]);
const fogWeatherCodes = new Set([45, 48]);

function getTemperatureAdvice(temp) {
  if (!Number.isFinite(temp)) return "出门前留意天气变化";
  if (temp >= 30) return "注意补水，少晒太久";
  if (temp >= 24) return "适合散步，记得补水";
  if (temp >= 16) return "适合散步，晚点备件薄外套";
  if (temp >= 9) return "加件外套，别着凉";
  return "天冷加衣，注意保暖";
}

function getWeatherAdvice(code, temp) {
  if (code === 95) return "雷雨时先避一避，注意安全";
  if (rainWeatherCodes.has(code)) {
    return temp <= 12 ? "记得带伞，也加件外套" : "记得带伞，路上慢一点";
  }
  if (snowWeatherCodes.has(code)) return "天冷加衣，脚下小心";
  if (fogWeatherCodes.has(code)) return "视线不好，出行慢一点";

  return getTemperatureAdvice(temp);
}

function getWeatherAdviceFromText(summary, temp) {
  if (/雷/.test(summary)) return "雷雨时先避一避，注意安全";
  if (/雨|降水|阵雨/.test(summary)) {
    return temp <= 12 ? "记得带伞，也加件外套" : "记得带伞，路上慢一点";
  }
  if (/雪/.test(summary)) return "天冷加衣，脚下小心";
  if (/雾|霧/.test(summary)) return "视线不好，出行慢一点";
  return getTemperatureAdvice(temp);
}

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

function setRandomPhoto(card, photos) {
  if (!card || !photos.length) return;
  const photo = photos[Math.floor(Math.random() * photos.length)];
  card.style.setProperty("--city-photo", `url("${photo}")`);
}

function encodeRepoPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function loadGitHubFolderImages(folderPath) {
  const apiUrl =
    `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.name}` +
    `/contents/${encodeRepoPath(folderPath)}?ref=${githubRepo.branch}`;
  const items = await fetchJson(apiUrl, 3500);

  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item.type === "file" && imageFilePattern.test(item.name))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }))
    .map((item) => item.download_url || item.path);
}

async function setRandomCityPhotos() {
  await Promise.all(
    Object.entries(cityPhotoFolders).map(async ([key, config]) => {
      const card = document.querySelector(`[data-city="${key}"]`);
      setRandomPhoto(card, config.fallback);

      try {
        const photos = await loadGitHubFolderImages(config.path);
        setRandomPhoto(card, photos.length ? photos : config.fallback);
      } catch {
        setRandomPhoto(card, config.fallback);
      }
    }),
  );
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

const weatherRequestTimeout = 4500;

async function fetchWithTimeout(url, options = {}, timeoutMs = weatherRequestTimeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJson(url, timeoutMs) {
  const response = await fetchWithTimeout(url, { cache: "no-store" }, timeoutMs);
  if (!response.ok) throw new Error(`Weather request failed: ${url}`);
  return response.json();
}

async function fetchText(url, timeoutMs) {
  const response = await fetchWithTimeout(url, { cache: "no-store" }, timeoutMs);
  if (!response.ok) throw new Error(`Weather request failed: ${url}`);
  return response.text();
}

function getLocalHour(timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  return Number.isFinite(hour) ? hour % 24 : 12;
}

function buildWeatherText({ summary, temp, advice }) {
  const weather = summary || "天气变化中";
  const temperature = Number.isFinite(temp) ? `${Math.round(temp)}℃` : "温度暂缺";
  return `${weather}，${temperature}，${advice || getWeatherAdviceFromText(weather, temp)}`;
}

async function fetchCmaWeather(city) {
  const data = await fetchJson(
    `https://weather.cma.cn/api/weather/view?stationid=${city.cmaStationId}`,
    3000,
  );
  if (data.code !== 0 || !data.data) throw new Error("CMA data unavailable");

  const localHour = getLocalHour(city.timezone);
  const today = data.data.daily?.[0] || {};
  const summary = localHour >= 18 || localHour < 6 ? today.nightText : today.dayText;
  const temp = Number(data.data.now?.temperature ?? today.high ?? today.low);

  return {
    summary,
    temp,
    source: "中国气象局",
  };
}

function normalizeJmaWeather(text) {
  const compact = (text || "").replace(/\s+/g, "");
  if (/雷/.test(compact)) return /雨/.test(compact) ? "雷雨" : "可能有雷";
  if (/大雨/.test(compact)) return "大雨";
  if (/雨/.test(compact)) return /晴/.test(compact) ? "晴转有雨" : "有雨";
  if (/雪/.test(compact)) return "有雪";
  if (/霧/.test(compact)) return "有雾";
  if (/くもり|曇/.test(compact)) return /晴/.test(compact) ? "晴转多云" : "多云";
  if (/晴/.test(compact)) return "晴朗";
  return text || "天气变化中";
}

function normalizeWttrWeather(text) {
  const compact = (text || "").toLowerCase();
  if (/thunder|雷/.test(compact)) return "雷雨";
  if (/heavy rain|大雨/.test(compact)) return "大雨";
  if (/rain|shower|雨/.test(compact)) return "有雨";
  if (/snow|雪/.test(compact)) return "有雪";
  if (/fog|mist|雾|霧/.test(compact)) return "有雾";
  if (/overcast|cloud|阴|多云/.test(compact)) return "多云";
  if (/sunny|clear|晴/.test(compact)) return "晴朗";
  return text || "天气变化中";
}

async function fetchJmaAmedasTemp(stationId) {
  const latest = (await fetchText("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt")).trim();
  const timestamp = latest.replace(/\D/g, "").slice(0, 14);
  const data = await fetchJson(`https://www.jma.go.jp/bosai/amedas/data/map/${timestamp}.json`);
  const temp = Number(data[stationId]?.temp?.[0]);
  return Number.isFinite(temp) ? temp : null;
}

function getJmaForecastTemp(data, city) {
  const tempSeries = data[0]?.timeSeries?.find((series) =>
    series.areas?.some((area) => area.temps),
  );
  const tempArea =
    tempSeries?.areas?.find((area) => area.area?.name === city.jmaTempAreaName) ||
    tempSeries?.areas?.[0];
  const temps = (tempArea?.temps || []).map(Number).filter(Number.isFinite);
  return temps.length ? temps[temps.length - 1] : null;
}

async function fetchJmaWeather(city) {
  const forecast = await fetchJson(
    `https://www.jma.go.jp/bosai/forecast/data/forecast/${city.jmaOfficeCode}.json`,
  );
  const weatherArea =
    forecast[0]?.timeSeries?.[0]?.areas?.find((area) => area.area?.name === city.jmaAreaName) ||
    forecast[0]?.timeSeries?.[0]?.areas?.[0];
  const summary = normalizeJmaWeather(weatherArea?.weathers?.[0]);

  let temp = await fetchJmaAmedasTemp(city.jmaAmedasStationId).catch(() => null);
  if (!Number.isFinite(temp)) temp = getJmaForecastTemp(forecast, city);

  return {
    summary,
    temp,
    source: "日本气象厅",
  };
}

async function fetchOpenMeteoWeather(city) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    current: "temperature_2m,weather_code",
    timezone: city.timezone,
  });

  const data = await fetchJson(url, 3500);
  const code = data.current.weather_code;
  const temp = Math.round(data.current.temperature_2m);
  const summary = weatherText[code] || "天气变化中";

  return {
    summary,
    temp,
    advice: getWeatherAdvice(code, temp),
    source: "Open-Meteo",
  };
}

async function fetchWttrWeather(city) {
  const location = encodeURIComponent(city.weatherLocation || city.name);
  const data = await fetchJson(`https://wttr.in/${location}?format=j1&lang=zh-cn`, 3500);
  const current = data.current_condition?.[0] || {};
  const summary =
    current.lang_zh?.[0]?.value ||
    current.lang_zh_cn?.[0]?.value ||
    current.weatherDesc?.[0]?.value;
  const temp = Number(current.temp_C);

  return {
    summary: normalizeWttrWeather(summary),
    temp,
    source: "wttr.in",
  };
}

function fetchFirstAvailable(fetchers) {
  return new Promise((resolve, reject) => {
    const errors = [];

    fetchers.forEach((fetcher) => {
      fetcher()
        .then(resolve)
        .catch((error) => {
          errors.push(error);
          if (errors.length === fetchers.length) reject(errors[0]);
        });
    });
  });
}

async function fetchWeather(city) {
  if (city.weatherProvider === "fast") {
    return fetchFirstAvailable([
      () => fetchWttrWeather(city),
      () => fetchOpenMeteoWeather(city),
      () => fetchCmaWeather(city),
    ]);
  }

  if (city.weatherProvider === "cma") {
    return fetchFirstAvailable([
      () => fetchCmaWeather(city),
      () => fetchOpenMeteoWeather(city),
    ]);
  }

  if (city.weatherProvider === "jma") {
    return fetchJmaWeather(city).catch(() => fetchOpenMeteoWeather(city));
  }

  return fetchOpenMeteoWeather(city);
}

async function loadWeather() {
  await Promise.all(
    Object.entries(cities).map(async ([key, city]) => {
      const card = document.querySelector(`[data-city="${key}"]`);
      const weatherNode = card.querySelector('[data-field="weather"]');

      try {
        const data = await fetchWeather(city);
        weatherNode.textContent = buildWeatherText(data);
        weatherNode.title = `天气来源：${data.source}`;
      } catch {
        weatherNode.textContent = `${city.name}天气同步中，出门前留意天气`;
        weatherNode.title = "天气来源暂时不可用";
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
