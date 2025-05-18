import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';

@ApiTags('plans')
@ApiBearerAuth()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  @ApiResponse({ status: 201, description: 'The plan has been successfully created.', type: Plan })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async create(@Body(ValidationPipe) createPlanDto: CreatePlanDto): Promise<Plan> {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Return all plans.', type: [Plan] })
  async findAll(@Query('isActive') isActive?: boolean): Promise<Plan[]> {
    return this.plansService.findAll({ isActive: isActive === undefined ? undefined : isActive === true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by id' })
  @ApiResponse({ status: 200, description: 'Return the plan.', type: Plan })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Plan> {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiResponse({ status: 200, description: 'The plan has been successfully updated.', type: Plan })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body(ValidationPipe) updatePlanDto: UpdatePlanDto,
  ): Promise<Plan> {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiResponse({ status: 204, description: 'The plan has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.plansService.remove(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a plan' })
  @ApiResponse({ status: 200, description: 'The plan has been successfully activated.', type: Plan })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<Plan> {
    return this.plansService.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a plan' })
  @ApiResponse({ status: 200, description: 'The plan has been successfully deactivated.', type: Plan })
  @ApiResponse({ status: 404, description: 'Plan not found.' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Plan> {
    return this.plansService.deactivate(id);
  }
}
