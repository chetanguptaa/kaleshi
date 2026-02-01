import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TAddCommentSchema, TCommentVoteSchema } from './comment.controller';
import { RedisPublisherService } from 'src/redis/redis.publisher.service';
import { CommentEvent } from 'src/redis/redis-publisher.event-types';

@Injectable()
export class CommentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisPublisherService: RedisPublisherService,
  ) {}

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
      include: {
        account: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        votes: {
          select: {
            id: true,
            vote: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    const commentEvent: CommentEvent = {
      type: 'comment',
      id: comment.id,
      account: {
        id: comment.account.id,
        user: comment.account.user,
      },
      marketId: comment.marketId,
      comment: comment.comment,
      _count: comment._count,
      votes: comment.votes,
      createdAt: comment.createdAt,
    };

    await this.redisPublisherService.pushCommentCommand(commentEvent);

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
    const doesCommentExist = await this.prismaService.comment.findUnique({
      where: {
        id: id,
      },
    });
    if (!doesCommentExist) throw new NotFoundException('Comment not found');
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
    const comment = await this.prismaService.comment.findUnique({
      where: {
        id: id,
      },
      include: {
        account: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        votes: {
          select: {
            id: true,
            vote: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    const commentEvent: CommentEvent = {
      type: 'comment',
      id: comment.id,
      account: {
        id: comment.account.id,
        user: comment.account.user,
      },
      marketId: comment.marketId,
      comment: comment.comment,
      _count: comment._count,
      votes: comment.votes,
      createdAt: comment.createdAt,
    };
    await this.redisPublisherService.pushCommentCommand(commentEvent);
    return { success: true };
  }
}
