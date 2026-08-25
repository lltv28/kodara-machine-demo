(() => {
  const INITIAL_FEED_COUNT = 3;
  const MIN_ARRIVAL_DELAY = 1_200;
  const MAX_ARRIVAL_DELAY = 4_500;
  const MAX_VISIBLE_NOTIFICATIONS = 5;

  function arrivalDelay(random = Math.random) {
    return Math.round(
      MIN_ARRIVAL_DELAY + (MAX_ARRIVAL_DELAY - MIN_ARRIVAL_DELAY) * random(),
    );
  }

  const WORKFLOW_GROUPS = [
    {
      id: "triager",
      label: "AI Triager",
      role: "AI Triager",
      route: "Lead qualification",
      workerId: "T-184",
      notifications: [
        {
          id: "triager-1",
          title: "New Sale! $17 Marketing Assessment",
          body: "Amara purchased the Marketing assessment for their dental business and is now being offered a sales consultation.",
        },
        {
          id: "triager-2",
          title: "New Sale! $17 Marketing Assessment",
          body: "Liam purchased the Marketing assessment for their roofing business and is now being offered a sales consultation.",
        },
        {
          id: "triager-3",
          title: "New Sale! $17 Marketing Assessment",
          body: "Sofia purchased the Marketing assessment for their med spa business and is now being offered a sales consultation.",
        },
        {
          id: "triager-4",
          title: "New Sale! $17 Marketing Assessment",
          body: "Jordan purchased the Marketing assessment for their landscaping business and is now being offered a sales consultation.",
        },
        {
          id: "triager-5",
          title: "New Sale! $17 Marketing Assessment",
          body: "Priya purchased the Marketing assessment for their accounting business and is now being offered a sales consultation.",
          actions: ["View lead", "Open chat"],
        },
      ],
    },
    {
      id: "high-ticket",
      label: "High ticket",
      role: "AI Salesperson",
      route: "High Ticket Upsell",
      workerId: "H-072",
      notifications: [
        {
          id: "high-ticket-1",
          title: "New Sales Call Confirmed! Tuesday at 2:30 PM",
          body: "Mateo who runs a roofing business is confirmed on the calendar and excited to learn more.",
        },
        {
          id: "high-ticket-2",
          title: "New Sales Call Confirmed! Wednesday at 11:00 AM",
          body: "Aisha who runs a med spa business is confirmed on the calendar and excited to learn more.",
        },
        {
          id: "high-ticket-3",
          title: "New Sales Call Confirmed! Thursday at 4:15 PM",
          body: "Daniel who runs a dental business is confirmed on the calendar and excited to learn more.",
        },
        {
          id: "high-ticket-4",
          title: "New Sales Call Confirmed! Friday at 9:30 AM",
          body: "Chloe who runs a landscaping business is confirmed on the calendar and excited to learn more.",
        },
        {
          id: "high-ticket-5",
          title: "New Sales Call Confirmed! Monday at 1:00 PM",
          body: "Marcus who runs a commercial cleaning business is confirmed on the calendar and excited to learn more.",
          actions: ["View lead", "Open calendar"],
        },
      ],
    },
  ];

  const ACTIVITY_ORDER = [
    ["triager", "triager-1"],
    ["high-ticket", "high-ticket-1"],
    ["triager", "triager-2"],
    ["high-ticket", "high-ticket-2"],
    ["triager", "triager-3"],
    ["high-ticket", "high-ticket-3"],
    ["triager", "triager-4"],
    ["high-ticket", "high-ticket-4"],
    ["triager", "triager-5"],
    ["high-ticket", "high-ticket-5"],
  ];

  const ACTIVITY_TIMELINE = ACTIVITY_ORDER.map(([groupId, notificationId]) => {
    const group = WORKFLOW_GROUPS.find(({ id }) => id === groupId);
    const notification = group?.notifications.find(({ id }) => id === notificationId);
    if (!notification) throw new Error(`Unknown activity event: ${groupId}/${notificationId}`);
    return { ...notification, groupId };
  });

  function getWorkflowGroup(id) {
    return WORKFLOW_GROUPS.find((group) => group.id === id) ?? WORKFLOW_GROUPS[0];
  }

  function visibleNotifications(notifications) {
    return notifications.slice(-MAX_VISIBLE_NOTIFICATIONS);
  }

  function activityStateAt(count = ACTIVITY_TIMELINE.length) {
    const state = Object.fromEntries(WORKFLOW_GROUPS.map(({ id }) => [id, []]));
    const safeCount = Number.isFinite(count)
      ? Math.min(ACTIVITY_TIMELINE.length, Math.max(0, Math.trunc(count)))
      : ACTIVITY_TIMELINE.length;

    for (const { groupId, ...notification } of ACTIVITY_TIMELINE.slice(0, safeCount)) {
      state[groupId] = visibleNotifications([...state[groupId], notification]);
    }

    return state;
  }

  function validateWorkflowGroups() {
    const ids = new Set();
    const timelineIds = new Set(ACTIVITY_TIMELINE.map(({ id }) => id));

    if (WORKFLOW_GROUPS.length !== 2) return false;
    if (ACTIVITY_TIMELINE.length !== WORKFLOW_GROUPS.length * MAX_VISIBLE_NOTIFICATIONS) {
      return false;
    }

    for (const group of WORKFLOW_GROUPS) {
      if (
        !group.id ||
        !group.label ||
        !group.role ||
        !group.route ||
        !/^[TH]-\d{3}$/.test(group.workerId) ||
        group.notifications.length !== MAX_VISIBLE_NOTIFICATIONS ||
        ids.has(group.id)
      ) {
        return false;
      }
      ids.add(group.id);

      for (const notification of group.notifications) {
        if (
          !notification.id ||
          !notification.title ||
          !notification.body ||
          ids.has(notification.id) ||
          !timelineIds.has(notification.id)
        ) {
          return false;
        }
        ids.add(notification.id);
      }
    }

    return true;
  }

  globalThis.IOSNotificationModel = Object.freeze({
    ACTIVITY_TIMELINE,
    INITIAL_FEED_COUNT,
    MAX_ARRIVAL_DELAY,
    MAX_VISIBLE_NOTIFICATIONS,
    MIN_ARRIVAL_DELAY,
    WORKFLOW_GROUPS,
    activityStateAt,
    arrivalDelay,
    getWorkflowGroup,
    validateWorkflowGroups,
    visibleNotifications,
  });
})();
