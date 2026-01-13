import { Controller, Get } from "@nestjs/common";
import { WompiService } from "./wompi.service";

@Controller("wompi")
export class WompiController {
  constructor(private readonly wompi: WompiService) {}

  @Get("acceptance-tokens")
  async getAcceptanceTokens() {
    try {
      return await this.wompi.getAcceptanceTokens();
    } catch (e) {
      console.error("acceptance-tokens error:", e);
      throw e;
    }
  }
}
