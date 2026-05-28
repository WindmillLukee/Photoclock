import document from "document";
import { me } from "appbit";
import { HeartRateSensor } from "heart-rate";
import { today } from "user-activity";
import { week } from "user-activity";

import * as fs from "fs";
import clock from "clock";
import * as messaging from "messaging";
import { battery } from "power";
import { inbox } from "file-transfer";

/* ---------------- STATE ---------------- */
let clockMode = "24hour";
let showSeconds = false;
let showDate = false;
let weatherTemp = "--";
let weatherCondition = "";
const weatherIcon = document.getElementById("weather-icon");
let tempC = 0;
let tempF = 32;
let weatherUpdateTimer = null;
const tapZone = document.getElementById("tap-zone");
let km = false;
let c = false;

/* ---------------- UI ---------------- */
const clockLabel = document.getElementById("clock-label");
const dateLabel = document.getElementById("date-label");
const hrLabel = document.getElementById("hrLabel");
const step = document.getElementById("step");
const backgroundElement = document.getElementById("background");
const calorie = document.getElementById("calories");
const shoe = document.getElementById("shoe");
const fire = document.getElementById("fire");

/* ---------------- ANALOG ELEMENTS ---------------- */
const hourHand = document.getElementById("hours");
const minHand = document.getElementById("mins");
const secHand = document.getElementById("secs");
const centerPin = document.getElementById("center-circle");
const digitalHighlight = document.getElementById("digital-highlight");
const analogHighlight = document.getElementById("analog-highlight");
const dateHighlight = document.getElementById("date-highlight");
const batteryLabel = document.getElementById("battery");
const ss = document.getElementById("sleepscore");
const temp = document.getElementById("temp");
const travel = document.getElementById("travel");
const azm = document.getElementById("azm");

/* ---------------- HELPERS ---------------- */
function zeroPad(n) {
  return (n < 10 ? "0" : "") + n;
}
if (ss) ss.style.display = "none";

/* ---------------- DATA UPDATES ---------------- */
function getTemp() {
  if (!temp) return;
  if (c) {
    temp.text = `${tempC}° C`;
  } else {
    temp.text = `${tempF}° F`;
  }
}

function getTravel() {
  if (!travel) return;
  const meters = today.adjusted.distance || 0;
  const kilometers = Math.floor(meters / 1000);
  const miles = Math.floor(meters / 1609.34);

  if (km) {
    travel.text = `${kilometers} Km`;
  } else {
    travel.text = `${miles} Mi`;
  }
}

function getAZM() {
  if (azm) {
    azm.text = `${week.adjusted.activeZoneMinutes || 0} AZM`;
  }
}

/* ---------------- CLOCK TICK ---------------- */
clock.granularity = "seconds";

clock.ontick = (evt) => {
  getTemp();
  getTravel();
  getAZM();
  const now = evt.date;
  const floors = today.adjusted.elevationGain || 0;
  if (ss) ss.text = `${floors} Floors`; 

  /* ---------------- CALORIES ---------------- */
  if (calorie && me.permissions.granted("access_activity")) {
    calorie.text = `${today.adjusted.calories || 0}`;
  }
  
  let hours = now.getHours();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const analogHours = hours % 12;
  let ampm = "";

  if (clockMode === "12hour") {
    ampm = hours >= 12 ? " PM" : " AM";
    hours = hours % 12 || 12;
  }

  /* ---------------- DIGITAL ---------------- */
  let timeString = `${zeroPad(hours)}:${zeroPad(mins)}`;

  if (showSeconds) {
    timeString += `:${zeroPad(secs)}`;
  }

  if (clockMode === "12hour") {
    timeString += ampm;
  }

  if (clockLabel) {
    if (clockMode !== "analog") {
      clockLabel.text = timeString;
      clockLabel.style.display = "inline";
    } else {
      clockLabel.style.display = "none";
    }
  }

  if (clockMode === "analog") {
    if (analogHighlight) analogHighlight.style.display = "inline";
    if (digitalHighlight) digitalHighlight.style.display = "none";
  } else {
    if (analogHighlight) analogHighlight.style.display = "none";
    if (digitalHighlight) digitalHighlight.style.display = "inline";
  }

  /* ---------------- DATE ---------------- */
  if (dateLabel) {
    if (showDate) {
      const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
      const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

      dateLabel.text = `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}`;
      if (dateHighlight) dateHighlight.style.display = "inline";
      dateLabel.style.display = "inline";
    } else {
      dateLabel.style.display = "none";
      if (dateHighlight) dateHighlight.style.display = "none";
    }
  }

  /* ---------------- ANALOG HANDS ---------------- */
  if (clockMode === "analog") {
    if (hourHand) hourHand.style.display = "inline";
    if (minHand) minHand.style.display = "inline";
    
    if (hourHand?.groupTransform?.rotate)
      hourHand.groupTransform.rotate.angle = (analogHours * 30) + (mins * 0.5);

    if (minHand?.groupTransform?.rotate)
      minHand.groupTransform.rotate.angle = mins * 6;

    if (secHand) {
      if (showSeconds) {
        secHand.style.display = "inline";
        if (secHand.groupTransform?.rotate) {
          secHand.groupTransform.rotate.angle = secs * 6;
        }
      } else {
        secHand.style.display = "none";
      }
    }
    if (centerPin) centerPin.style.display = "inline";
  } else {
    if (hourHand) hourHand.style.display = "none";
    if (minHand) minHand.style.display = "none";
    if (secHand) secHand.style.display = "none";
    if (centerPin) centerPin.style.display = "none";
  }
};

function updateBatteryDisplay() {
  if (batteryLabel) batteryLabel.text = `${battery.chargeLevel}%`;
}
updateBatteryDisplay();

/* ---------------- TOGGLE STATS ---------------- */
let statsVisible = true;

function updateStatsVisibility() {
  const display = statsVisible ? "inline" : "none";

  if (hrLabel) hrLabel.style.display = display;
  if (step) step.style.display = display;
  if (calorie) calorie.style.display = display;
  if (batteryLabel) batteryLabel.style.display = display;
  if (shoe) shoe.style.display = display;
  if (fire) fire.style.display = display;
  
  const altDisplay = !statsVisible ? "inline" : "none";
  if (weatherIcon) weatherIcon.style.display = altDisplay;
  if (ss) ss.style.display = altDisplay;
  if (temp) temp.style.display = altDisplay;
  if (travel) travel.style.display = altDisplay;
  if (azm) azm.style.display = altDisplay;
}

/* ---------------- SCREEN TAP DETECTION ---------------- */
if (tapZone) {
  tapZone.addEventListener("click", () => {
    statsVisible = !statsVisible;
    updateStatsVisibility();
  });
}

/* ---------------- HEART RATE ---------------- */
if (me.permissions.granted("access_heart_rate")) {
  const hrm = new HeartRateSensor();
  hrm.onreading = () => {
    if (hrLabel) hrLabel.text = `♥ ${hrm.heartRate || 0}`;
  };
  hrm.start();
}

/* ---------------- STEPS ---------------- */
function updateSteps() {
  if (me.permissions.granted("access_activity")) {
    if (step) step.text = `${today.adjusted.steps || 0}`;
  }
}
battery.onchange = () => {
  updateBatteryDisplay();
};
updateSteps();
setInterval(updateSteps, 2000);

/* ---------------- IMAGE SYSTEM ---------------- */
let currentWeather = {
  condition: "",
  isDay: 1
};

// Bind inbox file-transfer listener
inbox.addEventListener("newfile", processInbox);

function processInbox() {
  let fileName;

  while ((fileName = inbox.nextFile())) {
    console.log("Processing incoming inbox file:", fileName);

    // 1. CHANGE THIS LINE: Accept either extension incoming stream name
    if (fileName === "bg.png" || fileName === "current_bg.png" || fileName === "bg.jpg" || fileName === "current_bg.jpg") {
      
      // 2. CHANGE THIS LINE: Change the permanent file name to .jpg
      const permanentStoragePath = "/private/data/bg.jpg";

      try {
        const stagingBuffer = fs.readFileSync(fileName);
        fs.writeFileSync(permanentStoragePath, stagingBuffer);
        console.log("Wallpaper successfully written to physical storage.");

        if (backgroundElement) backgroundElement.href = "";

        setTimeout(() => {
          if (backgroundElement) {
            backgroundElement.href = permanentStoragePath;
            console.log("Background UI updated successfully!");
          }
        }, 100);

      } catch (err) {
        console.error("Failed to write incoming file asset: " + err);
      }
    }
  }
}

// 3. CHANGE THIS LINE: Update your startup boot recovery check to look for the .jpg
if (fs.existsSync("/private/data/bg.jpg")) {
  if (backgroundElement) backgroundElement.href = "/private/data/bg.jpg";
  console.log("Loaded existing background asset on boot.");
} else {
  processInbox();
}


// 5. ADD THIS BOOT RECOVERY RIGHT BELOW THE PROCESSINBOX FUNCTION:
if (fs.existsSync("/private/data/bg.png")) {
  if (backgroundElement) backgroundElement.href = "/private/data/bg.png";
  console.log("Loaded existing background asset on boot.");
} else {
  processInbox();
}

function loadSavedWallpaper() {
  const destinationPath = "/private/data/bg.png";
  const uiPath = "/user/settings/bg.png";

  if (fs.existsSync(destinationPath)) {
    console.log("Found a saved custom wallpaper on boot. Loading...");
    if (backgroundElement) {
    //  backgroundElement.href = uiPath;
    }
  } else {
    console.log("No custom wallpaper found. Using default placeholder.");
  }
}

/* ---------------- MESSAGING / SETTINGS SYNC ---------------- */
messaging.peerSocket.onmessage = (evt) => {
  const data = evt.data;

  if (!data) return;


  // Ignore 'wallpaper' message tokens on the watch side completely 
  // Let the companion handle file-transfer streams over the outbox pipeline.
// Inside your peerSocket.onmessage handler block:
  if (data.type === "wallpaper") {
    console.log("Companion announced wallpaper transmission channel. Awaiting binary data via inbox...");
    return; // Stop execution here completely!
  }

  // WEATHER OBJECT OVERLAY HANDLING
  if (data.type === "weather") {
    const condition = typeof data.condition === "string" ? data.condition : "";
    const isDay = data.is_day ? 1 : 0;

    currentWeather.condition = condition;
    currentWeather.isDay = isDay;

    let cName = condition.toLowerCase();
    let img = "weather_clear_day.png";

    if (cName.indexOf("sunny") !== -1 || cName.indexOf("clear") !== -1) {
      img = isDay ? "weather_clear_day.png" : "weather_clear_night.png";
    } else if (cName.indexOf("partly") !== -1 && cName.indexOf("cloud") !== -1) {
      img = isDay ? "weather_partly_cloudy_day.png" : "weather_partly_cloudy_night.png";
    } else if (cName.indexOf("cloud") !== -1 || cName.indexOf("overcast") !== -1) {
      img = "weather_cloudy_day.png";
    } else if (cName.indexOf("rain") !== -1 || cName.indexOf("drizzle") !== -1) {
      img = "weather_rain_day.png";
    } else if (cName.indexOf("thunder") !== -1 || cName.indexOf("storm") !== -1) {
      img = "weather_thunderstorm_day.png";
    } else if (cName.indexOf("snow") !== -1) {
      img = "weather_snow_day.png";
    } else if (cName.indexOf("fog") !== -1 || cName.indexOf("mist") !== -1) {
      img = "weather_fog_day.png";
    }

    if (weatherIcon) {
      weatherIcon.href = img;
    }
    return;
  }

  if (data.type === "temp") {
    tempC = data.tempC;
    tempF = data.tempF;
    getTemp();
    return;
  }
if (evt.key === "cycle_interval") {
  console.log("Raw interval setting:", evt.newValue);

  const seconds = normalizeInterval(evt.newValue);

  console.log("Parsed interval:", seconds);

  startCycleLoop(seconds);
}
  // PARSE MULTI-PROPERTY CONFIG OBJECTS
  if (typeof data === "object") {
    if (data.clockMode) clockMode = data.clockMode;
    if (typeof data.seconds === "boolean") showSeconds = data.seconds;
    if (typeof data.date === "boolean") showDate = data.date;
    if (typeof data.c === "boolean") c = data.c;
    if (typeof data.km === "boolean") km = data.km;
    return;
  }

  // PARSE RAW STRINGS / ROBUST SUBSTRING CHECKS
  if (typeof data === "string") {
    if (data === "12hour" || data === "24hour" || data === "analog") {
      clockMode = data;
      return;
    }
    
    if (data.indexOf("seconds true") !== -1) showSeconds = true;
    if (data.indexOf("seconds false") !== -1) showSeconds = false;
    if (data.indexOf("date true") !== -1) showDate = true;
    if (data.indexOf("date false") !== -1) showDate = false;
    if (data.indexOf("c true") !== -1) c = true;
    if (data.indexOf("c false") !== -1) c = false;
    if (data.indexOf("km true") !== -1) km = true;
    if (data.indexOf("km false") !== -1) km = false;
  }
};

// Initial startup execution calls
updateStatsVisibility();

loadSavedWallpaper();
