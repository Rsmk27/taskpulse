# TaskPulse — Single Shot Master Prompt
# Tool: GitHub Copilot Agent Mode (VS Code)
# Send this entire file as ONE message after project init

---

## BEFORE SENDING THIS PROMPT — Run in VS Code Terminal first:

```bash
npx create-expo-app taskpulse --template blank
cd taskpulse
npx expo install expo-notifications expo-task-manager expo-background-fetch @react-native-async-storage/async-storage dayjs @expo/vector-icons expo-crypto react-native-svg
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack react-native-screens react-native-safe-area-context
```

Open the `taskpulse` folder in VS Code.
Switch Copilot Chat to Agent mode.
Paste everything below this line as one message.

---

## YOUR TASK

You are a senior React Native + Expo developer. Build a complete, fully working Android app called **TaskPulse** from scratch inside this project folder.

Rules:
- JavaScript only — no TypeScript
- Every file must be fully implemented — no TODOs, no placeholders, no "add logic here" comments
- All styles via `StyleSheet.create()` — no inline style objects
- All data stored in AsyncStorage — no Firebase, no network calls, no internet required
- Notifications use expo-notifications local scheduling — they fire from the device OS, fully offline
- Do not ask clarifying questions — build everything now based on this spec

---

## APP OVERVIEW

TaskPulse is a behavior-focused task reminder app. It doesn't just track tasks — it persistently reminds users until they act. Core idea: notifications repeat until the user taps Done, Snooze, or Skip.

---

## FOLDER STRUCTURE — Create exactly this:

```
taskpulse/
├── App.js
├── app.json                          ← update this
├── src/
│   ├── constants/
│   │   └── theme.js
│   ├── context/
│   │   └── SettingsContext.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   ├── services/
│   │   ├── storageService.js
│   │   └── notificationService.js
│   ├── components/
│   │   ├── TaskCard.js
│   │   ├── ProgressRing.js
│   │   ├── NotifBanner.js
│   │   └── SectionLabel.js
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── AddTaskScreen.js
│   │   ├── NotifCentreScreen.js
│   │   ├── TimelineScreen.js
│   │   ├── SettingsScreen.js
│   │   └── HistoryScreen.js
│   └── utils/
│       └── dateUtils.js
```

---

## FILE 1 — src/constants/theme.js

```js
export const colors = {
  bg:        '#0d0d10',
  surface1:  '#141418',
  surface2:  '#1b1b20',
  surface3:  '#222228',
  border1:   '#28282f',
  border2:   '#333340',
  accent:    '#c8f135',
  accentDim: '#a5c828',
  text:      '#ededf2',
  textSub:   '#7a7a88',
  textDim:   '#45454f',
  done:      '#4ade80',
  snooze:    '#facc15',
  skip:      '#f87171',
  routine:   '#818cf8',
  deadline:  '#fb923c',
  briefing:  '#38bdf8',
  warning:   '#fb923c',
  repeat:    '#f87171',
};

export const radius = { sm: 10, md: 16, lg: 22 };
```

---

## FILE 2 — src/utils/dateUtils.js

Implement all these functions using dayjs:

```js
import dayjs from 'dayjs';

// Returns today as 'YYYY-MM-DD'
export const getTodayStr = () => dayjs().format('YYYY-MM-DD');

// Returns yesterday as 'YYYY-MM-DD'
export const getYesterdayStr = () => dayjs().subtract(1, 'day').format('YYYY-MM-DD');

// Combines 'YYYY-MM-DD' + 'HH:mm' into a dayjs object
export const combineDatetime = (dateStr, timeStr) =>
  dayjs(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm');

// Returns true if date+time combination is after right now
export const isInFuture = (dateStr, timeStr) =>
  combineDatetime(dateStr, timeStr).isAfter(dayjs());

// Returns true if dateStr is today
export const isToday = (dateStr) => dateStr === getTodayStr();

// Returns true if dateStr is yesterday
export const isYesterday = (dateStr) => dateStr === getYesterdayStr();

// Returns minutes from now until the given datetime (negative if past)
export const minutesUntil = (dateStr, timeStr) =>
  combineDatetime(dateStr, timeStr).diff(dayjs(), 'minute');

// Converts 'HH:mm' to '9:30 AM'
export const formatDisplayTime = (timeStr) =>
  dayjs(`2000-01-01 ${timeStr}`).format('h:mm A');

// Returns 'Mon, Mar 22' from 'YYYY-MM-DD'
export const formatDisplayDate = (dateStr) =>
  dayjs(dateStr).format('ddd, MMM D');

// Returns greeting based on current hour
export const getGreeting = () => {
  const h = dayjs().hour();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Returns JS Date object N minutes from now
export const minutesFromNow = (n) => dayjs().add(n, 'minute').toDate();

// Returns true if current time is inside a quiet window (handles overnight)
export const isInQuietWindow = (startStr, endStr) => {
  const now = dayjs();
  const start = dayjs(`${getTodayStr()} ${startStr}`, 'YYYY-MM-DD HH:mm');
  let end = dayjs(`${getTodayStr()} ${endStr}`, 'YYYY-MM-DD HH:mm');
  if (end.isBefore(start)) end = end.add(1, 'day'); // overnight window
  return now.isAfter(start) && now.isBefore(end);
};
```

---

## FILE 3 — src/services/storageService.js

Use `@react-native-async-storage/async-storage`.

Storage keys:
```js
const TASKS_KEY     = '@tp_tasks';
const SETTINGS_KEY  = '@tp_settings';
const NOTIF_LOG_KEY = '@tp_notif_log';
```

Default settings object:
```js
const DEFAULT_SETTINGS = {
  briefingEnabled:  true,
  briefingTime:     '07:00',
  briefingIncludes: { allTasks: true, deadlines: true, routines: true },
  deadlineWarnings: {
    dayBefore:     true,
    dayBeforeTime: '20:00',
    oneHour:       true,
    thirtyMin:     true,
  },
  repeatReminders: {
    enabled:      true,
    interval:     10,
    maxRepeats:   5,
    hardStopTime: '23:00',
  },
  quietHours: {
    enabled: true,
    start:   '23:00',
    end:     '07:00',
  },
};
```

Implement and export ALL of these functions fully:

**Task functions:**
- `getTasks()` — parse JSON from storage, return array, default []
- `getTasksForDate(dateStr)` — filter tasks where task.date === dateStr
- `saveTask(task)` — upsert: if task.id exists in array update it, else push. Save back.
- `deleteTask(id)` — filter out by id, save back
- `updateTaskStatus(id, status)` — find task, set status + lastActionTime to now ISO string, save
- `incrementRepeatCount(id)` — find task, repeatCount++, save

**Settings functions:**
- `getSettings()` — deep merge stored settings with DEFAULT_SETTINGS so missing keys always fall back
- `saveSettings(settings)` — save full object

**History functions:**
- `getTaskHistory(days = 7)` — return tasks from last N days sorted by date descending
- `getDaySummary(dateStr)` — return `{ total, done, snoozed, skipped, pending }` for that date

**Notification log functions:**
- `appendNotifLog(entry)` — push entry to log array, save. entry shape: `{ id, taskId, type, title, message, firedAt, read }`
- `getNotifLog()` — return log array, default []
- `markNotifRead(id)` — find entry by id, set read: true, save
- `clearNotifLog()` — save []

---

## FILE 4 — src/services/notificationService.js

Import: expo-notifications, expo-task-manager, expo-background-fetch, storageService, dateUtils, dayjs.

### A. Permission + Setup

```js
export const requestPermissions = async () => { /* request and return granted boolean */ }

export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
};

export const setupNotificationCategories = async () => {
  await Notifications.setNotificationCategoryAsync('TASK_ACTION', [
    { identifier: 'DONE',   buttonTitle: '✅ Done'   },
    { identifier: 'SNOOZE', buttonTitle: '⏰ Snooze' },
    { identifier: 'SKIP',   buttonTitle: '❌ Skip'   },
  ]);
};
```

### B. Morning Briefing

`scheduleMorningBriefing(settings, tasks)`:
- If `settings.briefingEnabled === false` → return
- Cancel existing notification stored under key `'BRIEFING_NOTIF_ID'` in AsyncStorage
- Count today's tasks, count deadline tasks
- Schedule daily repeating trigger at `settings.briefingTime` (HH:mm → hour + minute)
- Content: title "☀️ Good Morning!", body "You have {total} tasks today, {deadlines} deadlines."
- Save the returned notification ID to AsyncStorage key `'BRIEFING_NOTIF_ID'`
- Append to notif log: type 'briefing'

### C. Deadline Warnings

`scheduleDeadlineWarnings(task, settings)`:
- Only for `task.type === 'deadline'`
- Parse deadline = `combineDatetime(task.date, task.time)`
- For each warning below, ONLY schedule if trigger is in the future AND the toggle is on:

  **Day-Before Alert** (`settings.deadlineWarnings.dayBefore`):
  - Trigger: previous day at `settings.deadlineWarnings.dayBeforeTime`
  - Title: "📅 Deadline Tomorrow"
  - Body: `"{task.title}" is due tomorrow at {formatDisplayTime(task.time)}`
  - Data: `{ taskId: task.id, type: 'day_before' }`

  **1-Hour Warning** (`settings.deadlineWarnings.oneHour`):
  - Trigger: deadline minus 60 minutes
  - Title: "⏳ Due in 1 Hour"
  - Body: `"{task.title}" is due at {formatDisplayTime(task.time)}`
  - Data: `{ taskId: task.id, type: '1hr_warning' }`

  **30-Min Warning** (`settings.deadlineWarnings.thirtyMin`):
  - Trigger: deadline minus 30 minutes
  - Title: "⚡ Due in 30 Minutes!"
  - Body: `Act now — "{task.title}" is due soon`
  - Data: `{ taskId: task.id, type: '30min_warning' }`

- Collect all scheduled IDs, append to task.notifIds, call saveTask(task)
- Append each to notif log

### D. Task Reminder

`scheduleTaskReminder(task)`:
- Trigger: exact `task.date` + `task.time` (must be in future, guard with isInFuture())
- Title: `task.title`
- Body: task.type === 'routine' ? 'Daily routine — time to act!'
       : task.type === 'deadline' ? 'Deadline task — complete it now!'
       : 'One-time task reminder'
- Category: `'TASK_ACTION'` (shows Done/Snooze/Skip buttons)
- Data: `{ taskId: task.id, type: 'task_reminder' }`
- Append ID to task.notifIds, saveTask(task)

### E. Repeat Reminder

`scheduleRepeatReminder(task, settings, overrideMinutes = null)`:
- Guard: `task.repeatCount >= task.maxRepeats` → return
- Guard: `isInQuietWindow(settings.quietHours.start, settings.quietHours.end)` → return
- Guard: current time HH:mm >= `settings.repeatReminders.hardStopTime` → return
- Minutes = overrideMinutes ?? `settings.repeatReminders.interval`
- Trigger: `minutesFromNow(minutes)`
- Title: task.title
- Body: `"Still pending. Reminder ${task.repeatCount + 1} of ${task.maxRepeats}"`
- Category: `'TASK_ACTION'`
- Data: `{ taskId: task.id, type: 'repeat_reminder' }`
- Append ID to task.notifIds, call `incrementRepeatCount(task.id)`, saveTask(task)

### F. Cancel All

`cancelAllTaskNotifications(taskId)`:
- Load task from storage (getTasks then find by id)
- For each id in task.notifIds: `Notifications.cancelScheduledNotificationAsync(id)`
- Set task.notifIds = [], saveTask(task)

### G. Notification Response Handler

`handleNotificationResponse(response)`:
- `const taskId = response.notification.request.content.data?.taskId`
- If no taskId → return
- Switch on `response.actionIdentifier`:
  - `'DONE'`:
    - `updateTaskStatus(taskId, 'done')`
    - `cancelAllTaskNotifications(taskId)`
    - Load task — if task.type === 'routine': re-schedule for tomorrow same time
  - `'SNOOZE'`:
    - `updateTaskStatus(taskId, 'snoozed')`
    - Load task, call `scheduleRepeatReminder(task, settings, 10)` with 10 min override
    - Do NOT increment repeatCount (snooze doesn't count as a repeat)
  - `'SKIP'`:
    - `updateTaskStatus(taskId, 'skipped')`
    - `cancelAllTaskNotifications(taskId)`
  - `'DEFAULT'` (user tapped notification body, no button):
    - Just `appendNotifLog` marking it as read

### H. Background Task

```js
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

export const BG_TASK = 'TASKPULSE_BG_CHECK';

TaskManager.defineTask(BG_TASK, async () => {
  try {
    const tasks    = await getTasks();
    const settings = await getSettings();
    const now      = dayjs();

    const pending = tasks.filter(t =>
      t.status === 'pending' &&
      t.repeatCount < t.maxRepeats &&
      t.lastActionTime &&
      now.diff(dayjs(t.lastActionTime), 'minute') >= settings.repeatReminders.interval
    );

    for (const task of pending) {
      await scheduleRepeatReminder(task, settings);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BG_TASK, {
      minimumInterval: 60,
      stopOnTerminate:  false,
      startOnBoot:      true,
    });
  } catch (e) {
    console.log('BG task registration failed:', e);
  }
};
```

---

## FILE 5 — src/context/SettingsContext.js

```js
// Full implementation:
// - createContext, SettingsProvider, useSettings hook
// - Load settings from getSettings() on mount
// - Expose { settings, updateSettings(partial) }
// - updateSettings: deep merge → saveSettings → if briefingTime changed → reschedule briefing → setState
// - Wrap app in <SettingsProvider>
```

Implement this fully. `updateSettings` accepts a partial object and deep-merges it.

---

## FILE 6 — src/navigation/AppNavigator.js

Bottom Tab Navigator with 5 tabs:

| Tab | Screen | Icon (active / inactive) |
|-----|--------|--------------------------|
| Home | HomeScreen | `home` / `home-outline` |
| Notifs | NotifCentreScreen | `notifications` / `notifications-outline` |
| Timeline | TimelineScreen | `calendar` / `calendar-outline` |
| Settings | SettingsScreen | `settings` / `settings-outline` |
| History | HistoryScreen | `document-text` / `document-text-outline` |

- Home tab is a **Stack Navigator** containing HomeScreen + AddTaskScreen
- AddTaskScreen: `headerShown: false`, `tabBarStyle: { display: 'none' }`
- Tab bar style: `backgroundColor: 'rgba(20,20,24,0.97)'`, `borderTopColor: '#28282f'`, `height: 76`, `paddingBottom: 12`
- Active tint: `#c8f135` | Inactive tint: `#45454f`
- Icons use `@expo/vector-icons` Ionicons

---

## FILE 7 — App.js

```js
// Implement fully:
// - SafeAreaProvider wrapping everything
// - SettingsProvider wrapping NavigationContainer
// - On mount:
//     requestPermissions()
//     setupNotificationHandler()
//     setupNotificationCategories()
//     registerBackgroundTask()
//     Notifications.addNotificationResponseReceivedListener(handleNotificationResponse)
// - Cleanup listener on unmount
// - StatusBar style="light"
// - Handle case where permissions are denied: show a simple Text alert inside the app
```

---

## FILE 8 — src/components/SectionLabel.js

Props: `{ label, rightBadge }` where rightBadge is optional string.

Renders a row:
- Label: uppercase, 10px, letter-spacing 1.2, color textDim, fontWeight '700'
- Right side: if rightBadge provided → small pill (accent bg, dark text, 8px, fontWeight '800')

---

## FILE 9 — src/components/TaskCard.js

Props: `{ task, onCheckToggle }`

```
Layout: TouchableOpacity row
├── Left accent bar: 3px wide, full height, color by type:
│     once → accent, routine → routine color, deadline → deadline color
├── Checkbox (22x22, borderRadius 7):
│     unchecked: border border2, transparent bg
│     checked: bg done color, checkmark '✓' in dark
├── Info column (flex 1):
│     Title: 13px, fontWeight '600', color text
│           if done: textDecorationLine 'line-through'
│     Meta row: type pill badge + time
├── Time: 11px, color textDim, fontWeight '600'

Card: bg surface2, border 1px border1, borderRadius 16, marginBottom 7
Done card: opacity 0.42
```

Type pill colors:
- once → accent bg tint, accent text
- routine → routine bg tint, routine text
- deadline → deadline bg tint, deadline text

---

## FILE 10 — src/components/ProgressRing.js

Props: `{ done, total, size = 68 }`

Use `react-native-svg` (Svg, Circle).
- Outer circle: stroke surface3, strokeWidth 5, no fill
- Inner circle: stroke accent, strokeWidth 5, strokeLinecap 'round', no fill
  - strokeDasharray = circumference
  - strokeDashoffset = circumference × (1 − done/total), default 0 if total is 0
- Center text: `{done}/{total}`, accent color, fontWeight '800', 17px
- Rotate SVG by -90deg so ring starts from top

---

## FILE 11 — src/components/NotifBanner.js

Props: `{ type, title, subtitle, timeAgo, onPress, urgent = false }`

Type → colors:
- `'briefing'` → bg `rgba(56,189,248,.07)`, border `rgba(56,189,248,.18)`, icon ☀️, titleColor briefing
- `'warning'`  → bg `rgba(251,146,60,.06)`, border `rgba(251,146,60,.22)`, icon ⚡, titleColor warning
- `'repeat'`   → bg `rgba(248,113,113,.06)`, border `rgba(248,113,113,.18)`, icon 🔁, titleColor repeat

If `urgent === true`: apply `Animated.loop` pulsing opacity between 1 and 0.5, duration 1500ms.

Layout: TouchableOpacity row → icon | body (title + subtitle) | timeAgo

---

## FILE 12 — src/screens/HomeScreen.js

Use `useFocusEffect` + `useCallback` to reload data every time screen is focused.

**Data loading:**
```js
const todayTasks     = await getTasksForDate(getTodayStr());
const yesterdayTasks = await getTasksForDate(getYesterdayStr());
const missedYesterday = yesterdayTasks.filter(t => t.status === 'pending' || t.status === 'snoozed');
const summary        = await getDaySummary(getTodayStr());
```

**Sort today's tasks:**
Priority order: deadline (by time asc) → routine (by time asc) → once (by time asc)

**Focus tasks:** first 3 non-done tasks from sorted list.

**Layout** (SafeAreaView → ScrollView, bg '#0d0d10'):

```
1. Greeting text: getGreeting() + ", RSMK" — 11px uppercase, textSub
   Date line: "Sunday, Mar 22" — 24px, fontWeight '800', accent color on date part

2. ProgressRing (done/total today) + progress text ("5 done · 2 remaining")

3. NotifBanner type='briefing' — show if notifLog has a 'briefing' entry from today
   (check firedAt date)

4. NotifBanner type='warning' urgent — show if any deadline task is due within 60 minutes
   (use minutesUntil to check)

5. SectionLabel "Focus Tasks" rightBadge="TOP 3"
   Render top 3 TaskCards

6. Divider (1px, border1 color, marginVertical 14)

7. SectionLabel "All Tasks"
   Render all today's TaskCards

8. If missedYesterday.length > 0:
   Divider
   SectionLabel "Missed Yesterday" (color skip, opacity 0.85)
   For each missed task: render a row with task title + "Retry" button
   Retry: duplicate task (new UUID, date = getTodayStr(), status = 'pending',
          repeatCount = 0, notifIds = []), saveTask, scheduleTaskReminder, reload

9. Empty state: if todayTasks.length === 0 →
   Centered View: emoji "📋" + text "No tasks today" + subtext "Tap + to add your first task"

FAB: position absolute, bottom 88, right 18, 50x50, bg accent, borderRadius 15
     shows "+" (24px, dark color), onPress → navigation.navigate('AddTask')
```

**On task checkbox toggle:**
```js
await updateTaskStatus(task.id, 'done');
await cancelAllTaskNotifications(task.id);
if (task.type === 'routine') {
  // reschedule for tomorrow
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const newTask = { ...task, id: Crypto.randomUUID(), date: tomorrow, status: 'pending', repeatCount: 0, notifIds: [] };
  await saveTask(newTask);
  await scheduleTaskReminder(newTask);
}
reload();
```

---

## FILE 13 — src/screens/AddTaskScreen.js

Stack screen (no tab bar).

**State:** title, type ('once'), date (today), time (30 min from now), intervalIndex (1 = 10min), maxRepeatsIndex (1 = 5×), titleError

**Layout** (SafeAreaView → KeyboardAvoidingView → ScrollView):

```
Header row:
  ← back button (chevron, 34x34, bg surface2, border border1, borderRadius 10)
  Title text "New Task" (20px, fontWeight '800')

Form fields:

1. Label "TASK TITLE"
   TextInput: bg surface2, border border1, borderRadius 10, padding 13 14
   color text, placeholderTextColor textDim
   If titleError → border color skip + error text below

2. Label "TASK TYPE"
   3 chips in a row: 🎯 One-time | 🔁 Routine | ⏳ Deadline
   Selected chip: accent/routine/deadline border + tinted bg
   Unselected: border1, surface2

3. Label "DATE"
   Tappable row showing formatted date, opens DateTimePicker mode='date'

4. Label "TIME"
   Tappable row showing formatted time, opens DateTimePicker mode='time'

5. Label "REPEAT INTERVAL"
   Sub label: "if no action taken"
   4 chips: 5 min | 10 min | 15 min | 30 min (single select)

6. Label "MAX REMINDERS"
   3 chips: 3× | 5× | 10× (single select)

7. Save button: full width, bg accent, color '#0d0d10', 15px, fontWeight '800'
   borderRadius 10, padding 15
```

**On Save:**
```js
if (!title.trim()) { setTitleError(true); return; }
if (type !== 'routine' && !isInFuture(date, time)) { show error: "Time must be in the future"; return; }

const task = {
  id:             Crypto.randomUUID(),
  title:          title.trim(),
  type,
  date,
  time,
  repeat:         type === 'routine',
  repeatInterval: [5, 10, 15, 30][intervalIndex],
  maxRepeats:     [3, 5, 10][maxRepeatsIndex],
  repeatCount:    0,
  status:         'pending',
  lastActionTime: null,
  notifIds:       [],
  createdAt:      new Date().toISOString(),
};

await saveTask(task);
await scheduleTaskReminder(task);
if (type === 'deadline') await scheduleDeadlineWarnings(task, settings);

// show brief success toast (Animated Text fading out over 1.5s)
navigation.goBack();
```

---

## FILE 14 — src/screens/NotifCentreScreen.js

`useFocusEffect` to reload log on focus.

**Layout** (SafeAreaView → FlatList with SectionList):

```
Header: "Notifications" (20px bold) + "Clear all" (accent, 10px, calls clearNotifLog then reload)

Sections:
  "TODAY" — entries where isToday(dayjs(entry.firedAt).format('YYYY-MM-DD'))
  "YESTERDAY" — entries where isYesterday(...)
  (older entries hidden for now)

Each entry card (bg surface2, border border1, borderRadius 16, marginBottom 7):
  Left: icon container (35x35, borderRadius 10, tinted bg by type):
    briefing → ☀️ blue tint
    day_before / 1hr_warning / 30min_warning → ⚠️ / ⏳ / ⚡ orange tint
    task_reminder → ⏰ accent tint
    repeat_reminder → 🔁 red tint
  Body:
    Top row: type badge pill + time string (formatDisplayTime(firedAt))
    Title: 12px, fontWeight '700'
    Message: 10px, textSub
  Right: 6x6 circle accent dot if read === false

Tap card → markNotifRead(entry.id) + reload

Empty state: "No notifications yet" centered, textDim color
```

Type badge pill colors same as dot colors above.

---

## FILE 15 — src/screens/TimelineScreen.js

`useFocusEffect` to reload on focus. Also load settings via `useSettings()`.

**Build timeline array:**
```js
const items = [];
const todayTasks     = await getTasksForDate(getTodayStr());
const yesterdayTasks = await getTasksForDate(getYesterdayStr());

// Yesterday evening deadline alerts
if (settings.deadlineWarnings.dayBefore) {
  for (const t of yesterdayTasks.filter(t => t.type === 'deadline')) {
    items.push({ time: settings.deadlineWarnings.dayBeforeTime, type: 'day_before', task: t, dayLabel: 'prev' });
  }
}

// Morning briefing
if (settings.briefingEnabled) {
  items.push({ time: settings.briefingTime, type: 'briefing', task: null });
}

// Today tasks
for (const t of todayTasks) {
  items.push({ time: t.time, type: 'task_reminder', task: t });

  if (t.type === 'deadline') {
    const dl = combineDatetime(t.date, t.time);
    if (settings.deadlineWarnings.oneHour)
      items.push({ time: dl.subtract(60, 'minute').format('HH:mm'), type: '1hr_warning', task: t });
    if (settings.deadlineWarnings.thirtyMin)
      items.push({ time: dl.subtract(30, 'minute').format('HH:mm'), type: '30min_warning', task: t });
  }
}

// Sort by time ascending
items.sort((a, b) => a.time.localeCompare(b.time));
```

**Layout** (SafeAreaView → ScrollView):
```
Header: "Notification Timeline" (20px bold) + today's date (textSub)

For each item in timeline, render a row:
  Col 1 (width 44, alignItems flex-end):
    formatDisplayTime(item.time) — 10px, fontWeight '700'
    if dayLabel 'prev' → show "prev" in 8px below
    if item is "NOW" (closest to current time) → show "NOW" pill (orange bg)

  Col 2 (width 20, alignItems center):
    Dot (9x9, borderRadius 5, color by type)
    Vertical connector line (flex 1, width 1, bg border1)
    (last item has no connector)

  Col 3 (flex 1):
    Type badge (see colors below)
    Title (12px, fontWeight '600')
    Subtitle (10px, textSub)
    If type === 'task_reminder' and repeatReminders.enabled:
      sub-note: "🔁 Repeats every {interval} min if no action"

Items before current time: opacity 0.4
Current item (closest to now): highlighted bg rgba(251,146,60,.06), border rgba(251,146,60,.15)

Type → dot/badge colors:
  briefing        → briefing (#38bdf8)
  day_before      → warning (#fb923c)
  1hr_warning     → warning
  30min_warning   → warning (pulsing if < 30 min until deadline)
  task_reminder   → accent (#c8f135)
  repeat_reminder → repeat (#f87171)
```

---

## FILE 16 — src/screens/SettingsScreen.js

`useSettings()` for settings + updateSettings. All changes auto-save on toggle/chip change.

**Layout** (SafeAreaView → ScrollView):

```
Title: "Notification Settings" (20px, fontWeight '800')

SECTION 1 — "☀️ MORNING BRIEFING"
Group card:
  Row: Toggle + "Morning Briefing" label + sub "Daily task summary at wake-up"
       onChange: updateSettings({ briefingEnabled: !settings.briefingEnabled })
  Row: "Briefing Time" + tappable time chip (shows formatDisplayTime(settings.briefingTime))
       onPress: open DateTimePicker mode='time', on change: updateSettings({ briefingTime: newHHmm })
  Row: "Include in Briefing" label
       Multi-select chips: All Tasks | Deadlines | Routines
       Each chip toggles the corresponding briefingIncludes key

SECTION 2 — "⚠️ DEADLINE WARNINGS"
Group card:
  Row: Toggle + "Day-Before Alert" + sub "Evening before deadline"
       Sub-row (if enabled): time chip for dayBeforeTime
  Row: Toggle + "1-Hour Warning"
  Row: Toggle + "30-Minute Warning"

SECTION 3 — "🔁 REPEAT REMINDERS"
Group card:
  Row: Toggle + "Repeat Reminders" + sub "Re-notify until action taken"
  Row: "Repeat Interval" + single-select chips: 5 min | 10 min | 15 min | 30 min
       onChange: updateSettings({ repeatReminders: { ...settings.repeatReminders, interval: val } })
  Row: "Max Reminders" + single-select chips: 3× | 5× | 10× | Unlimited
  Row: "Hard Stop Time" + time chip (no alerts after this time)

SECTION 4 — "🌙 QUIET HOURS"
Group card:
  Row: Toggle + "Quiet Hours" + sub "No notifications during sleep"
  Row: "Start Time" + time chip
  Row: "End Time" + time chip

Group card style: bg surface2, border border1, borderRadius 16, overflow hidden, marginBottom 12
Row style: flexDirection row, alignItems center, padding 13 15, borderBottomWidth 1, borderBottomColor border1
Last row in group: no border bottom

Toggle: use React Native Switch, trackColor={{ true: accent }}, thumbColor white
Time chip: bg accglow, border rgba(accent,.2), accent text, 11px, fontWeight '700', padding 4 10, borderRadius 7
Active chip: colored border + tinted bg | Inactive: border1 + surface3

Section group labels: 9px, fontWeight '800', uppercase, letterSpacing 1.2, textDim, marginTop 14 marginBottom 6
```

---

## FILE 17 — src/screens/HistoryScreen.js

`useFocusEffect` to load on focus.

```js
const history = await getTaskHistory(7);
const todaySummary = await getDaySummary(getTodayStr());
```

Group history tasks by date. For each date, compute { total, done, snoozed, skipped, pending }.

**Layout** (SafeAreaView → ScrollView):

```
TOP SUMMARY CARD (bg: rgba(accent, .06), border: rgba(accent,.12), borderRadius 16, padding 18):
  Emoji: todaySummary.done / todaySummary.total >= 0.8 → '🎯'
         >= 0.5 → '👍'   else → '💪'
  Title: "You completed {done} out of {total} tasks today" (16px, fontWeight '800')
  Sub: "{Math.round(pct)}% completion rate" (11px, textSub)
  Stat row (3 boxes side by side):
    Done (done color) | Snoozed (snooze color) | Missed (skip color)
    Each box: bg surface1, border border1, borderRadius 10, padding 10, textAlign center
    Number: 20px fontWeight '800' | Label: 9px uppercase textDim

TASK LOG (grouped by date):
For each date group (Today / Yesterday / older formatted dates):
  SectionLabel with date string
  For each task in group:
    Row: colored dot (7x7) + title + time | status badge
    Dot colors: done → done, snoozed → snooze, skipped/pending → skip, pending without action → textDim
    Status badge: tiny pill — Done/Snoozed/Missed/Pending

Empty state if history is empty: "No task history yet" centered, textDim
```

---

## FILE 18 — app.json update

Merge these into the existing app.json (keep all existing fields, only add what's missing):

```json
{
  "expo": {
    "name": "TaskPulse",
    "slug": "taskpulse",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#c8f135",
          "sounds": []
        }
      ]
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0d0d10"
      },
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "USE_EXACT_ALARM",
        "SCHEDULE_EXACT_ALARM"
      ]
    }
  }
}
```

---

## GLOBAL RULES — Apply to every file

1. All `StyleSheet.create()` — zero inline style objects `style={{ }}` anywhere
2. All colors from `src/constants/theme.js` — no hardcoded hex values in screens/components
3. Every screen wrapped in `<SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>`
4. Every `ScrollView` has `showsVerticalScrollIndicator={false}`
5. Every `TextInput` has `placeholderTextColor={colors.textDim}`
6. No TypeScript, no `.tsx`, no type annotations
7. No network calls — no fetch, no axios, no Firebase anywhere
8. No `console.log` except in catch blocks
9. Import order in every file: React → React Native → Expo packages → Navigation → Local services → Local components → Utils → Theme

---

## DEPENDENCY TREE — Build in this exact order

Do not start a file until all files it imports are complete.

```
theme.js
  └── dateUtils.js
        └── storageService.js
              └── notificationService.js
                    └── SettingsContext.js
                          └── AppNavigator.js (imports all screens)
                                └── App.js

Components (no inter-dependencies, build in parallel):
  SectionLabel.js → TaskCard.js → ProgressRing.js → NotifBanner.js

Screens (depend on components + services):
  AddTaskScreen.js → HomeScreen.js → SettingsScreen.js
  → NotifCentreScreen.js → TimelineScreen.js → HistoryScreen.js
```

---

## SELF-VERIFY before finishing

After writing all files, check each item and fix any issues before declaring done:

- [ ] `storageService.js` — `getSettings()` deep-merges with DEFAULT_SETTINGS, no missing keys possible
- [ ] `notificationService.js` — `isInFuture()` guard in `scheduleTaskReminder` prevents past scheduling
- [ ] `notificationService.js` — `isInQuietWindow()` handles overnight correctly (23:00 → 07:00)
- [ ] `notificationService.js` — `handleNotificationResponse` handles routine Done by rescheduling tomorrow
- [ ] `HomeScreen.js` — `useFocusEffect` reloads data on every screen focus
- [ ] `AddTaskScreen.js` — `Crypto.randomUUID()` used for task id generation
- [ ] `AppNavigator.js` — AddTaskScreen hides tab bar correctly
- [ ] `App.js` — notification response listener is cleaned up on unmount
- [ ] `app.json` — `SCHEDULE_EXACT_ALARM` permission present for Android 13+
- [ ] Zero TypeScript in any file
- [ ] Zero inline styles in any file
- [ ] Zero network calls in any file

---

## TEST PLAN — Run these after `npx expo start` on a physical Android device

1. Add a one-time task 2 minutes from now → verify notification fires with Done/Snooze/Skip buttons
2. Tap Done → verify task marked done, all notifications cancelled, Home shows it crossed out
3. Add a deadline task 1.5 hours from now → verify 1-hour warning fires, then 30-min warning fires
4. Add a routine task 1 minute from now → tap Done → verify it reappears tomorrow
5. Set briefing time to 2 min from now in Settings → verify briefing notification fires
6. Turn on airplane mode → verify all the above still works with zero internet
7. Check Timeline screen shows correct cascade for deadline task
8. Check History screen shows today's completion stats correctly
