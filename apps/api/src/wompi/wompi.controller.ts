import { Controller, Get } from "@nestjs/common";
import { WompiService } from "./wompi.service";

@Controller("wompi")
export class WompiController {
  constructor(private readonly wompi: WompiService) {}

  @Get("acceptance-tokens")
  async acceptanceTokens() {
    return this.wompi.getAcceptanceTokens();
  }
}
