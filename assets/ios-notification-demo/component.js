class IOSNotificationDemo extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;

    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `
      <link rel="stylesheet" href="assets/ios-notification-demo/styles.css">
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          color-scheme: dark;
        }

        .phone-column {
          display: flex;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
        }

        .phone-stage {
          flex: 0 0 auto;
          width: auto;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          aspect-ratio: 464 / 980;
        }
      </style>
      <section class="phone-column" aria-label="Interactive iPhone notification preview">
        <div class="phone-stage" data-phone-stage>
          <div class="phone-canvas" data-phone-canvas>
            <div class="phone-frame">
              <span class="side-button side-button-action" aria-hidden="true"></span>
              <span class="side-button side-button-volume-up" aria-hidden="true"></span>
              <span class="side-button side-button-volume-down" aria-hidden="true"></span>
              <span class="side-button side-button-power" aria-hidden="true"></span>

              <div class="phone-screen">
                <img class="wallpaper" src="assets/ios-notification-demo/wallpaper-beach.jpg" alt="" draggable="false">
                <div class="wallpaper-shade" aria-hidden="true"></div>

                <div class="status-bar" aria-hidden="true">
                  <div class="status-left">
                    <span>CC</span>
                    <span class="muted-bell"><i></i></span>
                  </div>
                  <div class="dynamic-island"></div>
                  <div class="status-icons">
                    <span class="cellular-icon"><i></i><i></i><i></i><i></i></span>
                    <span class="battery-icon"><i></i></span>
                  </div>
                  <span class="notification-center-handle"></span>
                </div>

                <div class="lock-heading" aria-hidden="true">
                  <p>Mon Aug 24</p>
                  <strong>1:02</strong>
                </div>

                <div class="notification-region" data-notification-region aria-label="AI sales notifications">
                  <div class="notification-center-titlebar" data-center-titlebar hidden>
                    <span>Notification Center</span>
                    <button type="button" aria-label="Clear all notifications" data-clear-all><i aria-hidden="true"></i></button>
                  </div>
                  <div class="notification-group-header" data-group-header hidden>
                    <span class="notification-group-identity">
                      <span data-group-label></span>
                      <small data-group-worker-id></small>
                    </span>
                    <div>
                      <button class="notification-show-less" type="button" data-show-less><i aria-hidden="true"></i>Show less</button>
                      <button class="notification-group-clear" type="button" aria-label="Clear selected AI notifications" data-clear-group><i aria-hidden="true"></i></button>
                    </div>
                  </div>
                  <div class="notification-feed" data-notification-feed></div>
                </div>

                <div class="quick-actions" aria-hidden="true">
                  <span class="quick-action flashlight-icon"><i></i></span>
                  <span class="quick-action camera-icon"><i></i></span>
                </div>
                <span class="home-indicator" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <p class="sr-only" aria-live="polite" data-live-region></p>
    `;
  }
}

customElements.define("ios-notification-demo", IOSNotificationDemo);

const {
  ACTIVITY_TIMELINE,
  INITIAL_FEED_COUNT,
  MAX_VISIBLE_NOTIFICATIONS,
  WORKFLOW_GROUPS,
  activityStateAt,
  arrivalDelay,
  getWorkflowGroup,
  visibleNotifications,
} = globalThis.IOSNotificationModel;

const demoElement = document.querySelector("ios-notification-demo");
const root = demoElement.shadowRoot;
const phoneStage = root.querySelector("[data-phone-stage]");
const phoneCanvas = root.querySelector("[data-phone-canvas]");
const phoneScreen = root.querySelector(".phone-screen");
const notificationRegion = root.querySelector("[data-notification-region]");
const notificationFeed = root.querySelector("[data-notification-feed]");
const centerTitlebar = root.querySelector("[data-center-titlebar]");
const groupHeader = root.querySelector("[data-group-header]");
const groupHeaderLabel = root.querySelector("[data-group-label]");
const groupHeaderWorkerId = root.querySelector("[data-group-worker-id]");
const showLessButton = root.querySelector("[data-show-less]");
const clearAllButton = root.querySelector("[data-clear-all]");
const clearGroupButton = root.querySelector("[data-clear-group]");
const liveRegion = root.querySelector("[data-live-region]");
const replayButton = root.querySelector("[data-replay]");
const workflowButtons = [...root.querySelectorAll("[data-workflow]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const query = new URLSearchParams(window.location.search);
const requestedStaticCount = Number.parseInt(query.get("static-count"), 10);
const requestedFocus = WORKFLOW_GROUPS.some(({ id }) => id === query.get("focus"))
  ? query.get("focus")
  : null;

const state = {
  activeByGroup: activityStateAt(0),
  activeFeed: [],
  generation: 0,
  isVisible: false,
  selectedGroupId: null,
  staticCount: Number.isInteger(requestedStaticCount)
    ? Math.min(ACTIVITY_TIMELINE.length, Math.max(0, requestedStaticCount))
    : null,
  timers: new Set(),
};

function groupNotificationCount(groupId) {
  return state.activeByGroup[groupId]?.length ?? 0;
}

function totalNotificationCount() {
  return Object.values(state.activeByGroup).reduce(
    (total, notifications) => total + notifications.length,
    0,
  );
}

function updatePhoneScale() {
  const width = phoneStage.getBoundingClientRect().width;
  phoneCanvas.style.setProperty("--phone-scale", String(width / 464));
}

function clearTimers() {
  for (const timer of state.timers) window.clearTimeout(timer);
  state.timers.clear();
}

function schedule(callback, delay, generation = state.generation) {
  const timer = window.setTimeout(() => {
    state.timers.delete(timer);
    if (generation === state.generation && state.isVisible) callback();
  }, delay);
  state.timers.add(timer);
}

function setWorkflowButtonState() {
  const selectedId = state.selectedGroupId ?? "all";
  for (const button of workflowButtons) {
    const selected = button.dataset.workflow === selectedId;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
}

function focusWorkflowButton(id = "all") {
  workflowButtons.find((button) => button.dataset.workflow === id)?.focus();
}

function updateCardAvailability() {
  for (const card of notificationFeed.querySelectorAll(".notification-card")) {
    card.inert = false;
    card.removeAttribute("aria-hidden");
  }
}

function createNotificationCard(notification, groupId) {
  const group = getWorkflowGroup(groupId);
  const card = document.createElement("article");
  card.className = "notification-card";
  card.dataset.groupId = groupId;
  card.dataset.notificationId = notification.id;
  card.setAttribute("aria-label", notification.title);

  const actions = notification.actions ?? ["View", "Dismiss"];
  card.innerHTML = `
    <div class="notification-main">
      <img class="app-icon" src="assets/ios-notification-demo/kodara-app-icon.jpeg" alt="" draggable="false" />
      <div class="notification-copy">
        <div class="notification-meta">
          <span class="notification-app-name"></span>
          <time>now</time>
        </div>
        <p class="notification-title"></p>
        <p class="notification-body"></p>
      </div>
    </div>
    <div class="notification-actions" aria-hidden="true" inert></div>
  `;

  const workerName = group.id === "triager"
    ? group.role
    : `${group.role} ${group.route}`;
  card.querySelector(".notification-app-name").textContent =
    `${workerName} - ${group.workerId}`;
  card.querySelector(".notification-title").textContent = notification.title;
  card.querySelector(".notification-body").textContent = notification.body;
  const actionsContainer = card.querySelector(".notification-actions");
  for (const action of actions.slice(0, 2)) {
    const actionButton = document.createElement("button");
    actionButton.className = "notification-action";
    actionButton.type = "button";
    actionButton.textContent = action;
    actionsContainer.append(actionButton);
  }

  const mainContent = card.querySelector(".notification-main");
  mainContent.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    openCardActions(card);
  });

  for (const actionButton of card.querySelectorAll(".notification-action")) {
    actionButton.addEventListener("click", (event) => {
      event.stopPropagation();
      if (actionButton.textContent === "Dismiss") dismissCard(card);
      else {
        toggleExpanded(card, false);
      }
    });
  }

  installSwipeDismiss(card);
  return card;
}

function openCardActions(card) {
  const groupId = card.dataset.groupId;
  const notificationId = card.dataset.notificationId;
  if (state.selectedGroupId !== groupId) {
    setGroupExpanded(groupId);
    card = notificationFeed.querySelector(
      `.notification-card[data-notification-id="${notificationId}"]`,
    ) ?? notificationFeed.querySelector(".notification-card");
  }
  if (card) toggleExpanded(card, true);
}

function toggleExpanded(card, force) {
  const expanded = force ?? !card.classList.contains("is-expanded");

  for (const otherCard of notificationRegion.querySelectorAll(".notification-card")) {
    if (otherCard !== card) {
      otherCard.classList.remove("is-expanded");
      setActionsAvailable(otherCard, false);
    }
  }

  card.classList.toggle("is-expanded", expanded);
  setActionsAvailable(card, expanded);
}

function setActionsAvailable(card, available) {
  const actions = card.querySelector(".notification-actions");
  actions.inert = !available;
  actions.setAttribute("aria-hidden", String(!available));
}

function eventsForCurrentView() {
  if (state.selectedGroupId === null) return [...state.activeFeed].reverse();
  return [...state.activeByGroup[state.selectedGroupId]]
    .reverse()
    .map((notification) => ({ ...notification, groupId: state.selectedGroupId }));
}

function renderCurrentView() {
  const fragment = document.createDocumentFragment();
  for (const { groupId, ...notification } of eventsForCurrentView()) {
    fragment.append(createNotificationCard(notification, groupId));
  }
  notificationFeed.replaceChildren(fragment);
  updateCardAvailability();
}

function setGroupExpanded(groupId) {
  const canExpand = groupId !== null && groupNotificationCount(groupId) > 0;
  state.selectedGroupId = canExpand ? groupId : null;
  const expanded = state.selectedGroupId !== null;

  notificationRegion.classList.toggle("is-history-expanded", expanded);
  phoneScreen.classList.toggle("is-notification-center", expanded);
  centerTitlebar.hidden = !expanded;
  groupHeader.hidden = !expanded;

  if (expanded) {
    const group = getWorkflowGroup(state.selectedGroupId);
    groupHeaderLabel.textContent = group.role;
    groupHeaderWorkerId.textContent = `${group.route} · ${group.workerId}`;
    clearGroupButton.setAttribute(
      "aria-label",
      `Clear ${group.role} ${group.workerId} notifications`,
    );
    notificationRegion.scrollTop = 0;
  }

  setWorkflowButtonState();
  renderCurrentView();
}

function installSwipeDismiss(card) {
  let startX = 0;
  let offsetX = 0;
  let dragging = false;
  let activePointerId = null;
  let holdTimer = null;

  function cancelHold() {
    if (holdTimer === null) return;
    window.clearTimeout(holdTimer);
    holdTimer = null;
  }

  card.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".notification-action")) return;
    if (!event.isPrimary || event.button !== 0) return;
    startX = event.clientX;
    offsetX = 0;
    dragging = true;
    activePointerId = event.pointerId;
    holdTimer = window.setTimeout(() => {
      holdTimer = null;
      openCardActions(card);
    }, 500);
  });

  card.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== activePointerId) return;
    const pointerDelta = event.clientX - startX;
    if (Math.abs(pointerDelta) > 8) cancelHold();
    offsetX = Math.min(0, pointerDelta);
    if (offsetX < -8) {
      if (!card.hasPointerCapture(event.pointerId)) card.setPointerCapture(event.pointerId);
    }
    card.style.setProperty("--swipe-x", `${offsetX}px`);
    card.style.opacity = String(Math.max(0.28, 1 + offsetX / 220));
  });

  function finishSwipe(event) {
    if (!dragging || event.pointerId !== activePointerId) return;
    cancelHold();
    dragging = false;
    activePointerId = null;
    if (offsetX < -92) dismissCard(card);
    else {
      card.style.removeProperty("--swipe-x");
      card.style.opacity = "";
    }
  }

  card.addEventListener("pointerup", finishSwipe);
  card.addEventListener("pointercancel", finishSwipe);
}

function animateFeedInsertion(card, previousPositions, trimmedCard) {
  if (reduceMotion.matches) {
    trimmedCard?.remove();
    return;
  }

  card.classList.add("is-arriving");
  const animations = [];
  animations.push(card.animate(
    [
      { opacity: 0, transform: "translateY(-18px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    {
      duration: 520,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    },
  ));

  for (const existingCard of notificationFeed.querySelectorAll(".notification-card")) {
    if (existingCard === card) continue;
    const previousTop = previousPositions.get(existingCard.dataset.notificationId);
    if (previousTop === undefined) continue;
    const delta = previousTop - existingCard.getBoundingClientRect().top;
    const keyframes = existingCard === trimmedCard
      ? [
          { opacity: 1, transform: `translateY(${delta}px)` },
          { opacity: 1, offset: 0.68, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(14px)" },
        ]
      : [
          { transform: `translateY(${delta}px)` },
          { transform: "translateY(0)" },
        ];
    animations.push(existingCard.animate(keyframes, {
      duration: 520,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    }));
  }

  Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
    for (const animation of animations) animation.cancel();
    trimmedCard?.remove();
    if (card.isConnected) {
      card.classList.remove("is-arriving");
    }
  });
}

function dismissCard(card) {
  const groupId = card.dataset.groupId;
  const id = card.dataset.notificationId;
  state.activeByGroup[groupId] = state.activeByGroup[groupId].filter(
    (notification) => notification.id !== id,
  );
  state.activeFeed = state.activeFeed.filter(
    (notification) => notification.id !== id,
  );
  card.classList.add("is-dismissing");

  if (reduceMotion.matches) {
    card.remove();
    updateNotificationPresence();
    return;
  }

  const animation = card.animate(
    [
      { opacity: 1, transform: "translateY(0) scale(1)" },
      { opacity: 0, transform: "translateX(-124px) scale(0.96)" },
    ],
    {
      duration: 320,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
      fill: "forwards",
    },
  );
  animation.finished.then(
    () => {
      card.remove();
      updateNotificationPresence();
    },
    () => {},
  );
}

function addNotification({ groupId, ...notification }, animate = true) {
  state.activeByGroup[groupId] = visibleNotifications([
    ...state.activeByGroup[groupId],
    notification,
  ]);
  state.activeFeed = visibleNotifications([
    ...state.activeFeed,
    { ...notification, groupId },
  ]);

  if (!animate || state.selectedGroupId !== null) {
    renderCurrentView();
    updateNotificationPresence();
    return;
  }

  const previousCards = [...notificationFeed.querySelectorAll(".notification-card")];
  const previousPositions = new Map(
    previousCards.map((existingCard) => [
      existingCard.dataset.notificationId,
      existingCard.getBoundingClientRect().top,
    ]),
  );
  const card = createNotificationCard(notification, groupId);
  notificationFeed.prepend(card);
  const cards = notificationFeed.querySelectorAll(".notification-card");
  const trimmedCard = cards.length > MAX_VISIBLE_NOTIFICATIONS
    ? cards[cards.length - 1]
    : null;
  updateNotificationPresence();
  animateFeedInsertion(card, previousPositions, trimmedCard);

  const group = getWorkflowGroup(groupId);
  liveRegion.textContent = `${group.role} ${group.workerId}. ${notification.title}. ${notification.body}`;
}

function updateNotificationPresence() {
  const total = totalNotificationCount();
  phoneScreen.classList.toggle("has-notifications", total > 0);

  if (
    state.selectedGroupId !== null &&
    groupNotificationCount(state.selectedGroupId) === 0
  ) {
    setGroupExpanded(null);
  } else {
    updateCardAvailability();
  }
}

function clearNotifications(groupId = null) {
  const groups = groupId ? [groupId] : WORKFLOW_GROUPS.map(({ id }) => id);
  for (const id of groups) {
    state.activeByGroup[id] = [];
  }
  state.activeFeed = groupId === null
    ? []
    : state.activeFeed.filter((notification) => notification.groupId !== groupId);

  if (groupId === null || state.selectedGroupId === groupId) {
    setGroupExpanded(null);
  } else {
    renderCurrentView();
    updateNotificationPresence();
  }
}

function renderActivityState(count) {
  const safeCount = Math.min(ACTIVITY_TIMELINE.length, Math.max(0, count));
  state.activeByGroup = activityStateAt(safeCount);
  state.activeFeed = ACTIVITY_TIMELINE.slice(0, safeCount).slice(
    -MAX_VISIBLE_NOTIFICATIONS,
  );
  renderCurrentView();
  updateNotificationPresence();
}

function renderFrozenState(count, focusId = requestedFocus) {
  renderActivityState(count);
  setGroupExpanded(focusId);
  phoneScreen.dataset.activityState = count === ACTIVITY_TIMELINE.length
    ? "complete"
    : "frozen";
}

function playActivity() {
  state.generation += 1;
  clearTimers();
  setGroupExpanded(null);

  if (!state.isVisible) return;
  if (state.staticCount !== null) {
    renderFrozenState(state.staticCount);
    return;
  }
  if (reduceMotion.matches) {
    renderFrozenState(ACTIVITY_TIMELINE.length);
    return;
  }

  renderActivityState(INITIAL_FEED_COUNT);
  phoneScreen.dataset.activityState = "playing";
  const generation = state.generation;
  scheduleNextNotification(
    ACTIVITY_TIMELINE.slice(INITIAL_FEED_COUNT),
    0,
    generation,
  );
}

function scheduleNextNotification(notifications, index, generation) {
  schedule(() => {
    addNotification(notifications[index]);
    if (index === notifications.length - 1) {
      phoneScreen.dataset.activityState = "complete";
      return;
    }
    scheduleNextNotification(notifications, index + 1, generation);
  }, arrivalDelay(), generation);
}

function focusWorkflow(id) {
  state.generation += 1;
  clearTimers();
  if (id === "all") {
    renderFrozenState(ACTIVITY_TIMELINE.length, null);
    return;
  }
  renderFrozenState(ACTIVITY_TIMELINE.length, id);
}

function setVisible(isVisible) {
  if (state.isVisible === isVisible) return;
  state.isVisible = isVisible;
  if (isVisible) playActivity();
  else {
    state.generation += 1;
    clearTimers();
  }
}

for (const button of workflowButtons) {
  button.addEventListener("click", () => focusWorkflow(button.dataset.workflow));
}

replayButton?.addEventListener("click", playActivity);
showLessButton.addEventListener("click", () => {
  setGroupExpanded(null);
});
clearAllButton.addEventListener("click", () => {
  focusWorkflowButton();
  clearNotifications();
});
clearGroupButton.addEventListener("click", () => {
  if (state.selectedGroupId !== null) {
    const groupId = state.selectedGroupId;
    focusWorkflowButton();
    clearNotifications(groupId);
  }
});

let phoneInViewport = false;
const visibilityObserver = new IntersectionObserver(
  ([entry]) => {
    phoneInViewport = entry.isIntersecting && entry.intersectionRatio >= 0.22;
    setVisible(phoneInViewport && !document.hidden);
  },
  { threshold: 0.22 },
);
visibilityObserver.observe(phoneStage);

document.addEventListener("visibilitychange", () => {
  setVisible(phoneInViewport && !document.hidden);
});

reduceMotion.addEventListener("change", playActivity);

const resizeObserver = new ResizeObserver(updatePhoneScale);
resizeObserver.observe(phoneStage);

updatePhoneScale();
renderActivityState(INITIAL_FEED_COUNT);
phoneScreen.dataset.activityState = "waiting";
