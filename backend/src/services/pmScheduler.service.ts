import { WorkOrderGeneratorService } from './workOrderGenerator.service';
import { PMTriggerService } from '../api/pm-trigger/pmTrigger.service';

export class PMSchedulerService {
  private workOrderGenerator: WorkOrderGeneratorService;
  private pmTriggerService: PMTriggerService;

  constructor() {
    this.workOrderGenerator = new WorkOrderGeneratorService();
    this.pmTriggerService = new PMTriggerService();
  }

  async runScheduledGeneration() {
    console.log('Starting scheduled PM work order generation...');
    
    try {
      // Generate work orders from due PM schedules
      const result = await this.workOrderGenerator.generateWorkOrdersForDuePMs();
      
      console.log(`Generated ${result.count} work orders from due PM schedules`);
      
      return {
        success: true,
        generatedCount: result.count,
        workOrders: result.workOrders,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error during scheduled PM generation:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  async getUpcomingPMs(days: number = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    return await this.pmTriggerService.getUpcomingTriggers(new Date(), endDate);
  }

  // This would typically be called by a cron job
  startScheduledGeneration(intervalMinutes: number = 60) {
    console.log(`Starting PM scheduler with ${intervalMinutes} minute intervals`);
    
    // Run immediately on startup
    this.runScheduledGeneration();
    
    // Then run on interval
    setInterval(() => {
      this.runScheduledGeneration();
    }, intervalMinutes * 60 * 1000);
  }
}