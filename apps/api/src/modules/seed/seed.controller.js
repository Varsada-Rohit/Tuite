"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../common/decorators");
const database_1 = require("../../database");
class SeedAdminDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{7,14}$/, { message: 'phone must be in E.164 format' }),
    __metadata("design:type", String)
], SeedAdminDto.prototype, "phone", void 0);
/**
 * TEMPORARY — remove this module after seeding the Super Admin.
 * Mirrors apps/api/prisma/seed.ts. Disabled (404) unless SEED_TOKEN is set,
 * and requires a matching `x-seed-token` header.
 */
let SeedController = class SeedController {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
    }
    async seedAdmin(token, dto) {
        const expected = this.config.get('SEED_TOKEN');
        if (!expected) {
            throw new common_1.NotFoundException();
        }
        const a = Buffer.from(token ?? '');
        const b = Buffer.from(expected);
        if (a.length !== b.length || !(0, crypto_1.timingSafeEqual)(a, b)) {
            throw new common_1.UnauthorizedException();
        }
        const id = '00000000-0000-0000-0000-000000000001';
        const user = await this.prisma.user.upsert({
            where: { id },
            update: {},
            create: {
                id,
                tenant_id: null,
                phone: dto.phone ?? '+919876543210',
                full_name: 'Super Admin',
                role: client_1.Role.SUPER_ADMIN,
            },
        });
        return { id: user.id, role: user.role, full_name: user.full_name };
    }
};
exports.SeedController = SeedController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('admin'),
    __param(0, (0, common_1.Headers)('x-seed-token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SeedAdminDto]),
    __metadata("design:returntype", Promise)
], SeedController.prototype, "seedAdmin", null);
exports.SeedController = SeedController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('internal/seed'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        database_1.PrismaService])
], SeedController);
//# sourceMappingURL=seed.controller.js.map