import {
  Body,
  Controller,
  Post,
  Req,
  Param,
  BadRequestException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { type AppRequest } from 'src/@types/express';
import { z } from 'zod';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { ROLES_TO_ID_MAPPING } from 'src/constants';
import { AccountGuard } from 'src/auth/account.guard';
import { CommentVoteType } from 'generated/prisma/enums';

const addCommentSchema = z.object({
  comment: z.string().min(1),
  parentId: z.uuid().optional(),
});

export type TAddCommentSchema = z.infer<typeof addCommentSchema>;

const commentVoteSchema = z.object({
  vote: z.enum([CommentVoteType.UP, CommentVoteType.DOWN]),
});

export type TCommentVoteSchema = z.infer<typeof commentVoteSchema>;

@Controller('market/:marketId/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('')
  @UseGuards(AuthGuard, RolesGuard, AccountGuard)
  @Roles(ROLES_TO_ID_MAPPING.COMMON)
  async addComment(
    @Req() req: AppRequest,
    @Param() marketId: number,
    @Body() raw: any,
  ) {
    const accountId = req.user.accountId!;
    const parsed = await addCommentSchema.safeParseAsync(raw);
    if (parsed.error) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.commentService.addComment(
      accountId,
      +marketId,
      parsed.data,
    );
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard, RolesGuard, AccountGuard)
  @Roles(ROLES_TO_ID_MAPPING.COMMON)
  async deleteComment(
    @Req() req: AppRequest,
    @Param('marketId') marketId: number,
    @Param('commentId') commentId: string,
  ) {
    const accountId = req.user.accountId!;
    return this.commentService.deleteComment(accountId, +marketId, commentId);
  }

  @Post(':id/vote')
  @UseGuards(AuthGuard, RolesGuard, AccountGuard)
  @Roles(ROLES_TO_ID_MAPPING.COMMON)
  async commentVote(
    @Req() req: AppRequest,
    @Param() id: string,
    @Body() raw: any,
  ) {
    const accountId = req.user.accountId!;
    const parsed = await commentVoteSchema.safeParseAsync(raw);
    if (parsed.error) {
      throw new BadRequestException('Invalid request body');
    }
    return await this.commentService.commentVote(id, accountId, parsed.data);
  }
}
