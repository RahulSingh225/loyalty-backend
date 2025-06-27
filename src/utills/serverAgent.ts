// import { scheduleJob, RecurrenceRule } from 'node-schedule';
// import { Logger } from 'winston'; // Assuming a Winston logger for logging
// import { format, parse } from 'date-fns';
// import { toZonedTime } from 'date-fns-tz'; // For timezone handling
// import NavisionService from '../services/navision.service';

// // Interface for maintenance task configuration
// interface MaintenanceTask {
//   name: string;
//   schedule: {
//     type: 'daily' | 'weekly';
//     time: string; // Format: HH:mm (24-hour)
//     dayOfWeek?: number; // 0 (Sunday) to 6 (Saturday), required for weekly tasks
//   };
//   execute: () => Promise<void>;
// }

// // Maintenance Agent class to manage scheduled tasks
// class MaintenanceAgent {
//   private logger: Logger;
//   private tasks: MaintenanceTask[] = [];
//   private readonly timeZone: string = 'Asia/Kolkata'; // IST (+5:30)

//   constructor(logger: Logger) {
//     this.logger = logger;
//     this.logger.info('Maintenance Agent initialized in IST (+5:30)');
//   }

//   // Register a new maintenance task
//   public registerTask(task: MaintenanceTask): void {
//     this.tasks.push(task);
//     this.scheduleTask(task);
//     this.logger.info(`Registered task: ${task.name}`);
//   }

//   // Schedule a task based on its configuration
//   private scheduleTask(task: MaintenanceTask): void {
//     try {
//       // Parse time string (HH:mm) using date-fns in IST
//       const time = parse(task.schedule.time, 'HH:mm', new Date());
//       const hour = time.getHours();
//       const minute = time.getMinutes();

//       if (task.schedule.type === 'daily') {
//         const rule = new RecurrenceRule();
//         rule.hour = hour;
//         rule.minute = minute;
//         rule.second = 0;
//         rule.tz = this.timeZone; // Set timezone to IST

//         scheduleJob(task.name, rule, async () => {
//           await this.runTask(task);
//         });
//         this.logger.info(`Scheduled daily task '${task.name}' at ${task.schedule.time} IST`);
//       } else if (task.schedule.type === 'weekly') {
//         if (task.schedule.dayOfWeek === undefined || task.schedule.dayOfWeek < 0 || task.schedule.dayOfWeek > 6) {
//           throw new Error(`Invalid dayOfWeek for task '${task.name}'. Must be between 0 (Sunday) and 6 (Saturday).`);
//         }

//         const rule = new RecurrenceRule();
//         rule.dayOfWeek = task.schedule.dayOfWeek;
//         rule.hour = hour;
//         rule.minute = minute;
//         rule.second = 0;
//         rule.tz = this.timeZone; // Set timezone to IST

//         scheduleJob(task.name, rule, async () => {
//           await this.runTask(task);
//         });
//         this.logger.info(
//           `Scheduled weekly task '${task.name}' on day ${task.schedule.dayOfWeek} at ${task.schedule.time} IST`
//         );
//       } else {
//         throw new Error(`Invalid schedule type for task '${task.name}'. Must be 'daily' or 'weekly'.`);
//       }
//     } catch (error) {
//       this.logger.error(`Failed to schedule task '${task.name}': ${error.message}`);
//     }
//   }

//   // Execute a task with error handling
//   private async runTask(task: MaintenanceTask): Promise<void> {
//     // Get current time in IST for logging
//     const nowInIST = toZonedTime(new Date(), this.timeZone);
//     this.logger.info(
//       `Starting execution of task: ${task.name} at ${format(nowInIST, 'yyyy-MM-dd HH:mm:ss')} IST`
//     );
//     try {
//       await task.execute();
//       this.logger.info(`Task '${task.name}' completed successfully`);
//     } catch (error) {
//       this.logger.error(`Task '${task.name}' failed: ${error.message}`);
//     }
//   }

//   // Stop all scheduled tasks (useful for graceful shutdown)
//   public stopAllTasks(): void {
//     scheduleJob.cancel();
//     this.logger.info('All scheduled tasks have been stopped');
//   }
// }

// // Example usage
// async function initializeAgent(logger: Logger): Promise<void> {
//   const agent = new MaintenanceAgent(logger);

//   // Example daily task: Clear temporary files every day at 02:00 IST
//   agent.registerTask({
//     name: 'syncNavisionData',
//     schedule: {
//       type: 'daily',
//       time: '02:00',
//     },
//     execute: async () => {
//       // Logic to clear temporary files
//       logger.info('Sync Navision data...');
//       const navisionService = new NavisionService();
//       await navisionService.syncCustomer();
//       await navisionService.syncVendor();
//       await navisionService.syncRetail();
//     },
//   });

//   // Example weekly task: Database backup every Sunday at 03:00 IST
//   agent.registerTask({
//     name: 'databaseBackup',
//     schedule: {
//       type: 'weekly',
//       time: '03:00',
//       dayOfWeek: 0, // Sunday
//     },
//     execute: async () => {
//       // Logic to perform database backup
//       logger.info('Performing database backup... to be implemnted');
//       // Add your maintenance logic here
//     },
//   });
// }

// // Assuming a Winston logger instance is provided
// // import { createLogger, format, transports } from 'winston';
// // const logger = createLogger({
// //   level: 'info',
// //   format: format.combine(format.timestamp(), format.json()),
// //   transports: [new transports.Console(), new transports.File({ filename: 'maintenance.log' })],
// // });

// // Initialize the agent
// // initializeAgent(logger).catch((error) => logger.error(`Failed to initialize agent: ${error.message}`));

// export { MaintenanceAgent, MaintenanceTask, initializeAgent };