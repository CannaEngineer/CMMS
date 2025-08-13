import { DashboardService } from '../dashboard/dashboard.service';

const dashboardService = new DashboardService();

export class MaintenanceService {
  async getStats(organizationId: number) {
    // Delegate to dashboard service
    return dashboardService.getStats(organizationId);
  }
}