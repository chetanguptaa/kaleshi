import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TAddCommentSchema, TCommentVoteSchema } from './comment.controller';

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  async addComment(
    accountId: number,
    marketId: number,
    body: TAddCommentSchema,
  ) {
    const comment = await this.prismaService.comment.create({
      data: {
        comment: body.comment,
        accountId,
        parentId: body.parentId,
        marketId,
      },
    });
    return {
      success: true,
      id: comment.id,
    };
  }

  async deleteComment(accountId: number, marketId: number, commentId: string) {
    const existing = await this.prismaService.comment.findFirst({
      where: {
        id: commentId,
        marketId,
        accountId,
      },
    });
    if (!existing) {
      return {
        success: false,
        message: 'Comment not found or not owned by account',
      };
    }
    await this.prismaService.comment.update({
      where: {
        id: commentId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    return {
      success: true,
      id: commentId,
    };
  }

  async commentVote(id: string, accountId: number, body: TCommentVoteSchema) {
    const existing = await this.prismaService.commentVote.findUnique({
      where: { accountId_commentId: { accountId, commentId: id } },
    });
    if (!existing) {
      await this.prismaService.commentVote.create({
        data: { accountId, commentId: id, vote: body.vote },
      });
    } else if (existing.vote === body.vote) {
      await this.prismaService.commentVote.delete({
        where: { accountId_commentId: { accountId, commentId: id } },
      });
    } else {
      await this.prismaService.commentVote.update({
        where: { accountId_commentId: { accountId, commentId: id } },
        data: { vote: body.vote },
      });
    }
    return { success: true };
  }
}
