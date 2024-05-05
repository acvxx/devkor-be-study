import { BadRequestException, Injectable } from '@nestjs/common';
import { PostCreateRequest } from './dto/PostCreateRequest.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostInfoResponseDto } from './dto/PostInfoResponse.dto';
import {
  PagedPostListDto,
  PostListResponseDto,
} from './dto/PostListResponse.dto';
import { CommentResponseDto } from './dto/CommentResponse.dto';
import { CommentRequestDto } from './dto/CommentRequest.dto';
import { ExternalExceptionFilter } from '@nestjs/core/exceptions/external-exception-filter';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}
  async createPost(id: number, postContent: PostCreateRequest) {
    const { title, content } = postContent;
    return await this.prisma.post.create({
      data: { userId: id, title: title, content: content },
    });
  }

  async deletePost(id: number, postId: number) {
    return await this.prisma.post.delete({
      where: { userId: id, id: postId },
    });
  }

  async getPostList(page: number = 1, order: string = 'createdAt') {
    let orderField: string = 'createdAt';
    let orderValue: any = 'desc';
    if (order === 'like') {
      orderField = 'likes';
      orderValue = { _count: 'desc' };
    } else if (order === 'view') {
      orderField = 'view';
    }
    const posts = await this.prisma.post.findMany({
      include: { user: true, likes: true, comments: true },
      skip: (page - 1) * 10,
      take: 10,
      orderBy: [{ [orderField]: orderValue }, { createdAt: 'desc' }],
    });
    const totalPost = await this.prisma.post.count();
    const PostDto: PostListResponseDto[] = posts.map((post) => {
      const { id, title, content, user, createdAt, view, likes, comments } =
        post;
      return {
        id: id,
        title: title,
        content: content,
        writer: user.nickname,
        date: createdAt,
        view: view,
        like: likes.length,
        comment: comments.length,
      };
    });
    const PostListResponseDto: PagedPostListDto = {
      posts: PostDto,
      page: page,
      totalPage: Math.ceil(totalPost / 10),
      totalPost: totalPost,
    };
    return PostListResponseDto;
  }
  async getSearchedPostList(
    search: string,
    page: number = 1,
    order: string = 'createdAt',
  ) {
    let orderField = 'createdAt';
    let orderValue: any = 'desc';
    if (order === 'like') {
      orderField = 'likes';
      orderValue = { _count: 'desc' };
    } else if (order === 'view') {
      orderField = 'view';
    }
    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      },
      include: { user: true, likes: true, comments: true },
      skip: (page - 1) * 10,
      take: 10,
      orderBy: [{ [orderField]: orderValue }, { createdAt: 'desc' }],
    });
    const totalPost = await this.prisma.post.count();
    const PostDto: PostListResponseDto[] = posts.map((post) => {
      const { id, title, content, user, createdAt, view, likes, comments } =
        post;
      return {
        id: id,
        title: title,
        content: content,
        writer: user.nickname,
        date: createdAt,
        view: view,
        like: likes.length,
        comment: comments.length,
      };
    });
    const PostListResponseDto: PagedPostListDto = {
      posts: PostDto,
      page: page,
      totalPage: Math.ceil(totalPost / 10),
      totalPost: totalPost,
    };
    return PostListResponseDto;
  }
  async getPostInfo(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        likes: { include: { user: true } },
        comments: { include: { user: true } },
        user: true,
      },
    });
    await this.prisma.post.update({
      where: { id },
      data: { view: post.view + 1 },
    });
    const likedUsers: string[] = post.likes.map((like) => {
      const nickname = like.user.nickname;
      return nickname;
    });
    const comments: CommentResponseDto[] = [];
    const replys: CommentResponseDto[] = [];
    post.comments.map((comment) => {
      const { id, content, user, createdAt } = comment;
      if (comment.replyCommentId == 0 || comment.replyCommentId == null) {
        comments.push({
          id: id,
          content: content,
          writer: user.nickname,
          date: createdAt,
        });
      } else {
        replys.push({
          id: id,
          content: content,
          writer: user.nickname,
          date: createdAt,
          reply: comment.replyCommentId,
        });
      }
    });
    const response: PostInfoResponseDto = {
      id: post.id,
      title: post.title,
      content: post.content,
      writer: post.user.nickname,
      date: post.createdAt,
      view: post.view + 1,
      like: post.likes.length,
      likedUser: likedUsers,
      comments: comments,
      replys: replys,
    };
    return response;
  }

  async createComment(id: number, comment: CommentRequestDto) {
    const { postId, content, reply } = comment;
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (post) {
      if (reply == null) {
        //댓글 생성
        const data = {
          userId: id,
          postId: postId,
          content: content,
          replyCommentId: 0,
        };
        return await this.prisma.comment.create({ data });
      } else {
        const comment = await this.prisma.comment.findUnique({
          where: { id: reply },
        });
        if (comment.replyCommentId != 0)
          throw new BadRequestException('답글에는 답글을 달 수 없습니다.');

        //답글 생성
        const data = {
          userId: id,
          postId: postId,
          content: content,
          replyCommentId: reply,
        };
        return await this.prisma.comment.create({ data });
      }
    }
  }
  async deleteComment(id: number, commentId: number) {
    const comment = await this.prisma.comment.delete({
      where: { userId: id, id: commentId },
    });
    return comment;
  }
  async likePost(userId: number, postId: number) {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (like) {
      return await this.prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
    } else {
      return await this.prisma.like.create({
        data: { userId, postId },
      });
    }
  }
}
