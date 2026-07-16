import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @ApiOperation({ summary: 'Simple ping' })
  @Get('ping')
  ping() {
    return {
      success: true,
      message: 'UniSupport API is running',
    };
  }
}
