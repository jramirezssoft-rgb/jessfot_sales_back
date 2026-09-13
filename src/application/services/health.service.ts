export class HealthService {
  getStatus() {
    return {
      status: "ok",
      service: "jessoft-sales-back",
      timestamp: new Date().toISOString(),
    };
  }
}
