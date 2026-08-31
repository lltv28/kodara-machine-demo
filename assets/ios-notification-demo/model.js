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
      id: "enrollment",
      label: "AI Version of You",
      role: "AI Version of You",
      route: "Program enrollment",
      workerId: "E-184",
      notifications: [
        {
          id: "enrollment-1",
          title: "New Program Enrollment! $997",
          body: "Amara enrolled in a virtual wellness program after speaking with your AI Version.",
        },
        {
          id: "enrollment-2",
          title: "New Program Enrollment! $997",
          body: "Liam enrolled in a virtual wellness program after speaking with your AI Version.",
        },
        {
          id: "enrollment-3",
          title: "New Program Enrollment! $997",
          body: "Sofia enrolled in a virtual wellness program after speaking with your AI Version.",
        },
        {
          id: "enrollment-4",
          title: "New Program Enrollment! $997",
          body: "Jordan enrolled in a virtual wellness program after speaking with your AI Version.",
        },
        {
          id: "enrollment-5",
          title: "New Program Enrollment! $997",
          body: "Priya enrolled in a virtual wellness program after speaking with your AI Version.",
          actions: ["View user", "Open program"],
        },
      ],
    },
    {
      id: "new-user",
      label: "Kodara",
      role: "Client discovery",
      route: "AI onboarding",
      workerId: "U-072",
      notifications: [
        {
          id: "new-user-1",
          title: "New AI User Onboarded",
          body: "Mateo started using your AI Version and was matched with the program that fits what he needs.",
        },
        {
          id: "new-user-2",
          title: "New AI User Onboarded",
          body: "Aisha started using your AI Version and was matched with the program that fits what she needs.",
        },
        {
          id: "new-user-3",
          title: "New AI User Onboarded",
          body: "Daniel started using your AI Version and was matched with the program that fits what he needs.",
        },
        {
          id: "new-user-4",
          title: "New AI User Onboarded",
          body: "Chloe started using your AI Version and was matched with the program that fits what she needs.",
        },
        {
          id: "new-user-5",
          title: "New AI User Onboarded",
          body: "Marcus started using your AI Version and was matched with the program that fits what he needs.",
          actions: ["View user", "Open AI"],
        },
      ],
    },
  ];

  const ACTIVITY_ORDER = [
    ["enrollment", "enrollment-1"],
    ["new-user", "new-user-1"],
    ["enrollment", "enrollment-2"],
    ["new-user", "new-user-2"],
    ["enrollment", "enrollment-3"],
    ["new-user", "new-user-3"],
    ["enrollment", "enrollment-4"],
    ["new-user", "new-user-4"],
    ["enrollment", "enrollment-5"],
    ["new-user", "new-user-5"],
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
        !/^[EU]-\d{3}$/.test(group.workerId) ||
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
