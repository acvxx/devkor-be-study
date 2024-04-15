import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AuthGuard } from '@nestjs/passport';
import { PostCreateRequest } from './dto/PostCreateRequest.dto';
import { CommentRequestDto } from './dto/CommentRequest.dto';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('/create')
  @UseGuards(AuthGuard())
  async createPost(@Body() body: PostCreateRequest, @Req() req: any) {
    return await this.postService.createPost(req.user.id, body);
  }

  @UseGuards(AuthGuard())
  @Delete('/delete')
  async deletePost(@Req() req: any, @Body() body: any) {
    return await this.postService.deletePost(req.user.id, body.postId);
  }

  @UseGuards(AuthGuard())
  @Get('/list')
  async getPostList(
    @Req() req: any,
    @Query('page') page: number,
    @Query('order') order: string,
  ) {
    return await this.postService.getPostList(page, order);
  }
  @UseGuards(AuthGuard())
  @Get('/list/search')
  async getSearchedPostList(
    @Req() req: any,
    @Query('page') page: number,
    @Query('order') order: string,
    @Query('search') search: string,
  ) {
    return await this.postService.getSearchedPostList(search, page, order);
  }

  @UseGuards(AuthGuard())
  @Get('/info/:postId')
  async getPostInfo(@Req() req: any, @Param('postId') postId: string) {
    return await this.postService.getPostInfo(parseInt(postId));
  }
  @UseGuards(AuthGuard())
  @Post('/comment/create')
  async createComment(@Req() req: any, @Body() body: CommentRequestDto) {
    return await this.postService.createComment(req.user.id, body);
  }

  @UseGuards(AuthGuard())
  @Delete('/comment/delete')
  async deleteComment(@Req() req: any, @Body() body: any) {
    return await this.postService.deleteComment(req.user.id, body.commentId);
  }

  @UseGuards(AuthGuard())
  @Put('/like/:postId')
  async likePost(@Req() req: any, @Param('postId') postId: string) {
    return await this.postService.likePost(req.user.id, parseInt(postId));
  }
}
