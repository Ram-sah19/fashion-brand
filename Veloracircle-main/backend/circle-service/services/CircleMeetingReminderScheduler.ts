import {
  processCircleMeetingReminders,
} from "./CircleMeetingReminderService";

const startCircleMeetingReminderScheduler =
  (): void => {
    const runReminderCheck =
      async (): Promise<void> => {
        await processCircleMeetingReminders();
      };

    runReminderCheck();

    setInterval(
      runReminderCheck,
      60 * 1000,
    );

    console.log(
      "Circle meeting reminder scheduler started.",
    );
  };

export default
  startCircleMeetingReminderScheduler;